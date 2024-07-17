import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Bell, LucideIcon } from "lucide-react";

interface VitalCardProps {
    label: string;
    value: string | number;
    icon?: LucideIcon;
    unit?: string
}
const VitalCard = ({label = "Name", value = "0",icon = Bell, unit = ""}:VitalCardProps) => {
  const Icon = icon;
  return (
    <Card className="group/icon hover:ring-1 basis-52 flex-grow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="text-primary group-hover/icon:scale-150 transition-all" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value} <span className="text-sm">{unit}</span></div>
      </CardContent>
    </Card>
  )
}

export default VitalCard;