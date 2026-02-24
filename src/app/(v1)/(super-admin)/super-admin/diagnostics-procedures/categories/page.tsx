import { CategoriesManager } from "../categories-manager";

export const metadata = {
  title: "Manage Procedure Categories",
  description: "Add or remove categories used by master procedures.",
};

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Manage Procedure Categories</h1>
        <p className="text-muted-foreground mt-2">
          Categories are shared across master procedures. Add or remove categories per procedure type.
        </p>
      </div>
      <CategoriesManager />
    </div>
  );
}
