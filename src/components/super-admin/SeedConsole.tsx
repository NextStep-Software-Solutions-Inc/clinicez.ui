"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Button } from "@components/ui/button";
import { Badge } from "@components/ui/badge";
import { toast } from "sonner";
import { getActionErrorMessage } from "@/lib/action-error";
import { Loader2, Database, Shield, Stethoscope, Heart, Syringe, Play } from "lucide-react";
import {
  seedPermissionsAction,
  seedProceduresAction,
  seedPhilHealthAction,
  seedVaccinesAction,
  seedAllAction,
  type SeedResult,
} from "@actions/super-admin/seed.action";

type SeedKey = "permissions" | "procedures" | "philhealth" | "vaccines" | "all";

const seedConfigs: Array<{
  key: SeedKey;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => Promise<SeedResult>;
}> = [
  {
    key: "permissions",
    title: "Permissions",
    description: "Seed system permissions from the PERMISSIONS constant. Creates new permissions that don't exist yet.",
    icon: <Shield className="h-5 w-5" />,
    action: seedPermissionsAction,
  },
  {
    key: "procedures",
    title: "Diagnostics & Procedures",
    description: "Seed imaging procedures, laboratory procedures, and heart station procedures (idempotent upsert).",
    icon: <Stethoscope className="h-5 w-5" />,
    action: seedProceduresAction,
  },
  {
    key: "philhealth",
    title: "PhilHealth Member Types",
    description: "Seed PhilHealth member types hierarchy: Direct and Indirect contributors with subcategories.",
    icon: <Heart className="h-5 w-5" />,
    action: seedPhilHealthAction,
  },
  {
    key: "vaccines",
    title: "Vaccines, Routes & Doses",
    description: "Seed vaccine catalog, administration routes, and dose types.",
    icon: <Syringe className="h-5 w-5" />,
    action: seedVaccinesAction,
  },
];

export default function SeedConsole() {
  const [runningSeeds, setRunningSeeds] = useState<Set<SeedKey>>(new Set());
  const [results, setResults] = useState<Record<string, SeedResult>>({});
  const [isPending, startTransition] = useTransition();

  const runSeed = (key: SeedKey, action: () => Promise<SeedResult>) => {
    if (runningSeeds.has(key)) return;

    setRunningSeeds((prev) => new Set(prev).add(key));
    startTransition(async () => {
      try {
        const result = await action();
        setResults((prev) => ({ ...prev, [key]: result }));
        if (result.status) {
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error(`Seed ${key} failed:`, error);
        toast.error(getActionErrorMessage(error, `Failed to run seed: ${key}`));
      } finally {
        setRunningSeeds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    });
  };

  const runAll = () => {
    if (runningSeeds.has("all")) return;

    setRunningSeeds((prev) => new Set(prev).add("all"));
    startTransition(async () => {
      try {
        const result = await seedAllAction();
        setResults((prev) => ({ ...prev, all: result }));
        if (result.status) {
          toast.success(result.message);
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        console.error("Seed all failed:", error);
        toast.error(getActionErrorMessage(error, "Failed to run all seeds"));
      } finally {
        setRunningSeeds((prev) => {
          const next = new Set(prev);
          next.delete("all");
          return next;
        });
      }
    });
  };

  const isAnyRunning = runningSeeds.size > 0;

  return (
    <div className="space-y-6">
      {/* Seed All */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Seed All</CardTitle>
                <CardDescription>Run all seed operations at once (permissions, procedures, PhilHealth, vaccines).</CardDescription>
              </div>
            </div>
            <Button
              onClick={runAll}
              disabled={isAnyRunning}
              size="sm"
            >
              {runningSeeds.has("all") ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Run All Seeds
            </Button>
          </div>
        </CardHeader>
        {results.all && (
          <CardContent>
            <SeedResultBadge result={results.all} />
          </CardContent>
        )}
      </Card>

      {/* Individual Seeds */}
      <div className="grid gap-4 md:grid-cols-2">
        {seedConfigs.map((config) => (
          <Card key={config.key}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-muted p-2">{config.icon}</div>
                <div className="flex-1">
                  <CardTitle className="text-base">{config.title}</CardTitle>
                  <CardDescription className="text-xs">{config.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {results[config.key] ? (
                  <SeedResultBadge result={results[config.key]} />
                ) : (
                  <span className="text-xs text-muted-foreground">Not run yet</span>
                )}
                <Button
                  onClick={() => runSeed(config.key, config.action)}
                  disabled={isAnyRunning}
                  variant="outline"
                  size="sm"
                >
                  {runningSeeds.has(config.key) ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  Seed
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function SeedResultBadge({ result }: { result: SeedResult }) {
  if (!result) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={result.status ? "default" : "destructive"}>
        {result.status ? "Success" : "Failed"}
      </Badge>
      {result.data && (
        <>
          <Badge variant="secondary">Created: {result.data.created}</Badge>
          <Badge variant="outline">Skipped: {result.data.skipped}</Badge>
        </>
      )}
      <span className="text-xs text-muted-foreground">{result.message}</span>
    </div>
  );
}
