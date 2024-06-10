import { SearchSlash } from "lucide-react";

export default function ProfileNotFound() {
  return (
    <div className="container mx-auto my-10">
      <div className="rounded-xl shadow-2xl flex flex-col items-center justify-center space-y-10 py-20 bg-slate-100">
        <SearchSlash size={90} className="text-primary" /> {/* display the icon */}
        <div className="text-2xl">Profile Not Found!</div>
      </div>
    </div>
  );
}
