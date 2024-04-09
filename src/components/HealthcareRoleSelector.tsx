import React from "react";
import Each from "./utils/Each";
import { revalidatePath } from "next/cache";

const roles = ["doctor", "nurse", "pharmacist", "laboratory", "admin"];

interface IHealthcareRoleSelectorProps {
    defaultRole?: string;
}

export default function HealthcareRoleSelector({defaultRole = ""}: IHealthcareRoleSelectorProps) {
  const handleSubmit = async (formData: FormData) => {
    "use server"
    const role = formData.get("role");
    console.log({role});
    const res = await fetch("http://localhost:3000/api/register/hp", {method: "POST", body: JSON.stringify({step: "role"})}); 
    const data = await res.json();
    
    if(data.status) revalidatePath("/healthcare-provider/register", "page")
    return true;
  };

  return (
    <form action={handleSubmit} className="">
      <div className="form-control">
        <label className="label">Role:</label>
        <div className="flex gap-2">
          <Each
            of={roles}
            render={(_role) => (
              <label className="label cursor-pointer justify-start gap-2">
                <input type="radio" name="role" value={_role} className="radio checked:bg-teal-500" defaultChecked={defaultRole === _role}  />
                <span className="label-text capitalize">{_role}</span>
              </label>
            )}
          />
        </div>
      </div>
      <button className="btn mt-2" type="submit">Submit</button>
    </form>
  );
}
