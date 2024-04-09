import { revalidatePath } from 'next/cache';
import React from 'react';

const plans = ["basic", "small", "large"];
interface IPlanSelectorProps {
  defaultPlan?: string;
}

const PlanSelector: React.FC<IPlanSelectorProps> = ({ defaultPlan = "" }) => {
  
  const handleSubmit = async (formData: FormData) => {
    "use server"
    const plan = formData.get("plan");
    console.log({plan});
    const res = await fetch("http://localhost:3000/api/register/hp", {method: "POST", body: JSON.stringify({step: "plan"})}); 
    const data = await res.json();
        
    if(data.status) revalidatePath("/healthcare-provider/register", "page")
    return true;
  };

  return (
    <form action={handleSubmit} className="">
      <div className="form-control">
        <label className="label">Plan:</label>
        <div className="flex gap-2">
          {plans.map((plan, index) => (
            <label key={index} className="label cursor-pointer justify-start gap-2">
              <input type="radio" name="plan" value={plan} className="radio checked:bg-teal-500" defaultChecked={defaultPlan === plan} />
              <span className="label-text capitalize">{plan}</span>
            </label>
          ))}
        </div>
      </div>
      <button className="btn mt-2" type="submit">Submit</button>
    </form>
  );
};

export default PlanSelector;