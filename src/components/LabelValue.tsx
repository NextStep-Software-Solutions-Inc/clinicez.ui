import { Label } from "./ui/label";

interface LabelValueProps {
    label: string;
    value: React.ReactNode;
    className?: string;
    }
      
export const LabelValue = ({label, value, className}:LabelValueProps) => {
  return (
    <div className={className}>
      <p className="font-medium" id={label}>{value}</p>
      <Label htmlFor={label} className="text-primary font-normal">{label}</Label>
    </div>
  );
}