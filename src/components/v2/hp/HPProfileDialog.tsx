"use client";

import type { ReactNode } from "react";

import Icon from "@/components/Icon";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { extractExperienceYears } from "@/lib/hp-utils";

import { HPAvatar } from "./HPAvatar";

interface HpProfileDialogProps {
  profile: {
    id: number;
    imageUrl?: string;
    title?: string;
    name?: string;
    suffix?: string;
    type?: string;
    experience?: string;
    educations?: string[];
    languages?: string[];
    philosophy?: string;
    workEmail?: string;
    workPhone?: string;
    availability?: string;
  };
  organization?: string;
}

const sanitizeList = (values?: string[]) => values?.map((value) => value?.trim()).filter(Boolean) ?? [];

const DetailSection = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-2">
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    <div className="min-h-[1.5rem] text-sm text-muted-foreground">{children}</div>
  </section>
);

export function HPProfileDialog({ profile, organization }: HpProfileDialogProps) {
  const displayName = [profile?.title, profile?.name, profile?.suffix].filter(Boolean).join(" ") || profile?.name || "Healthcare Provider";
  const imageSrc = profile?.imageUrl || "/placeholder.svg";
  const profession = profile?.type ?? "Unknown Profession";
  const organizationLabel = organization ?? "No Organization";
  const experienceYears = extractExperienceYears(profile?.experience);
  const educationList = sanitizeList(profile?.educations);
  const languageList = sanitizeList(profile?.languages);
  const aboutCopy = profile?.philosophy?.trim() ?? "";
  const email = profile?.workEmail ?? "";
  const phone = profile?.workPhone ?? "";
  const availability = profile?.availability?.trim() ?? "";
  const availabilityClassName = availability.toLowerCase().includes("available")
    ? "text-primary-v2"
    : availability.toLowerCase().includes("not")
      ? "text-destructive"
      : "text-muted-foreground";

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full justify-center bg-primary-v2 text-sm text-primary-foreground-v2 transition-colors hover:bg-primary-v2/90 sm:text-base">
          View Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl space-y-8 rounded-[1.25rem] bg-[#F7F7F7] p-8">
        <DialogHeader className="hidden" aria-hidden="true">
          <DialogTitle>{displayName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          <div className="flex flex-col gap-6 justify-center items-center sm:flex-row sm:items-center">
            <HPAvatar imageUrl={imageSrc} description={displayName} />
            <div className="flex flex-1 flex-col gap-2 text-center sm:text-left">
              <h2 className="text-2xl font-semibold text-foreground">{displayName}</h2>
              <p className="text-base font-medium text-muted-foreground">{profession}</p>
              <p className="text-sm text-muted-foreground">{organizationLabel}</p>
              <p className="text-sm text-muted-foreground">{experienceYears ? `${experienceYears} year(s) of experience` : "0 years of experience"}</p>
            </div>
          </div>

          <hr className="border-border" />

          <DetailSection title="About">
            <p className="leading-relaxed text-foreground">{aboutCopy}</p>
          </DetailSection>

          <DetailSection title="Education & Training">
            <ul className="list-disc space-y-1 pl-5 text-foreground">
              {educationList.map((entry, index) => (
                <li key={`${entry}-${index}`}>{entry}</li>
              ))}
            </ul>
          </DetailSection>

          <div className="grid gap-8 sm:grid-cols-2">
            <DetailSection title="Contact Information">
              <div className="space-y-2 text-foreground">
                <div className="flex items-center gap-2">
                  <Icon name="phone" size={18} className="text-foreground" />
                  <span>{phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="mail" size={18} className="text-foreground" />
                  <span>{email}</span>
                </div>
              </div>
            </DetailSection>

            <DetailSection title="Additional Information">
              <div className="space-y-2 text-foreground">
                <p>
                  <span>Languages:</span> {languageList.join(", ")}
                </p>
                <p>
                  <span>Availability:</span>{" "}
                  <span className={availabilityClassName}>{availability}</span>
                </p>
              </div>
            </DetailSection>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}