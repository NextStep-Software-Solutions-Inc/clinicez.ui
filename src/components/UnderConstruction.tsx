import { Construction } from "lucide-react";
import React from "react";

export default function UnderConstruction() {
  return (
    <div className="container flex flex-col space-y-5 items-center justify-center">
      <Construction size={80}/>
      <h3 className="text-4xl font-bold">This feature is currently under construction</h3>
      <p>This feature is under construction. Please check back later.</p>
    </div>
  );
}
