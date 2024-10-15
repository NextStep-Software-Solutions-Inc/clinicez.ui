interface ListItemProps {
    name: string;
    description?: string | null;
    actions?: React.ReactNode;
  }
export default function ListItem({name,actions, description}: ListItemProps) {
  return (
    <div className="flex items-center justify-between gap-2 hover:bg-slate-50 py-1 px-2 rounded-md">
      <div>
        <div className="font-medium">{name}</div>
        <div className="text-muted-foreground text-sm">{description ?? "No description"}</div>
      </div>
      <div>
        {actions}
      </div>
    </div>
  )
}
  