import {
  Stethoscope,
  Eye,
  Brain,
  Heart,
  Activity,
  Pill,
  Scissors,
  Beaker,
  Thermometer,
  Wind,
  User,
  type LucideIcon,
} from "lucide-react";

const HP_TYPE_ICON_MAP: { keywords: string[]; Icon: LucideIcon; color: string }[] = [
  { keywords: ["dent", "oral", "tooth", "teeth"], Icon: Scissors, color: "bg-blue-100 text-blue-600" },
  { keywords: ["eye", "ophthalm", "vision", "ocular"], Icon: Eye, color: "bg-purple-100 text-purple-600" },
  { keywords: ["neuro", "brain", "psych", "mental"], Icon: Brain, color: "bg-pink-100 text-pink-600" },
  { keywords: ["ortho", "bone", "joint", "spine", "musculo"], Icon: Activity, color: "bg-orange-100 text-orange-600" },
  { keywords: ["cardio", "heart", "cardiac"], Icon: Heart, color: "bg-red-100 text-red-600" },
  { keywords: ["pediatr", "child", "infant", "newborn"], Icon: Heart, color: "bg-yellow-100 text-yellow-600" },
  { keywords: ["lab", "pathol", "micro", "biochem"], Icon: Beaker, color: "bg-green-100 text-green-600" },
  { keywords: ["oncol", "cancer", "tumor", "chemo"], Icon: Beaker, color: "bg-emerald-100 text-emerald-600" },
  { keywords: ["pharmac", "drug", "medicine", "clinical"], Icon: Pill, color: "bg-teal-100 text-teal-600" },
  { keywords: ["surg", "oper"], Icon: Scissors, color: "bg-indigo-100 text-indigo-600" },
  { keywords: ["ent", "ear", "nose", "throat", "laryngo"], Icon: Thermometer, color: "bg-amber-100 text-amber-600" },
  { keywords: ["rehab", "physio", "therapy", "occup"], Icon: Activity, color: "bg-lime-100 text-lime-600" },
  { keywords: ["respir", "pulmon", "lung"], Icon: Wind, color: "bg-cyan-100 text-cyan-600" },
  { keywords: ["general", "family", "internal", "primary"], Icon: Stethoscope, color: "bg-sky-100 text-sky-600" },
];

const DEFAULT_ICON = { Icon: User as LucideIcon, color: "bg-muted text-muted-foreground" };

function resolveHPTypeIcon(name: string): { Icon: LucideIcon; color: string } {
  const lower = name.toLowerCase();
  for (const entry of HP_TYPE_ICON_MAP) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return { Icon: entry.Icon, color: entry.color };
    }
  }
  return DEFAULT_ICON;
}

interface HPTypeIconProps {
  name: string;
  className?: string;
}

/**
 * Renders a colour-coded icon for a given HP type name.
 * Falls back to a generic User icon when no keyword matches.
 */
export default function HPTypeIcon({ name, className = "" }: HPTypeIconProps) {
  const { Icon, color } = resolveHPTypeIcon(name);
  return (
    <div className={`flex h-full w-full items-center justify-center rounded-lg ${color} ${className}`}>
      <Icon className="h-1/2 w-1/2" strokeWidth={1.5} />
    </div>
  );
}
