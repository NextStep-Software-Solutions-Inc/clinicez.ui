import { Label } from "./ui/label";

interface LabelValueProps {
    label: string;
    value: React.ReactNode;
    className?: string;
    }
      
export const LabelValue = ({label, value, className}:LabelValueProps) => {
  return (
    <div className={className}>
      <p className="font-semibold" id={label}>{value}</p>
      <Label htmlFor={label}>{label}</Label>
    </div>
  );
}