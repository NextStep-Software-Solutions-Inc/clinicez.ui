"use client";

import { useContext } from "react";
import SubmitAndNext from "./SubmitAndNext";
import { HPApplicationDataContext } from "@contexts/hp-application.context";

export default function ConfirmationForm() {
  const {applicationData} = useContext(HPApplicationDataContext);

  return (
    <form className="p-4 bg-white shadow-lg rounded-lg">
      <div>
        <h2 className="text-lg font-bold">Confirmation</h2>
        <p className="mt-2">Your application is ready for submission. Please carefully review all the details you have provided.</p>
      </div>

      <h2 className="text-lg font-bold">Summary</h2>
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-2">
          <h3 className="text-sm font-bold">Role</h3>
          <p>{applicationData.selectedRole}</p>
        </div>
        <div className="flex flex-col space-y-2">
          <h3 className="text-sm font-bold">Plan</h3>
          <p>{applicationData.selectedPlan}</p>
        </div>
        <div className="flex flex-col space-y-2">
          <h3 className="text-sm font-bold">Profile</h3>
          <p>Dr. John Doe</p>
          <p>
            <span>
                1234 Main Street
            </span>
            <span>
                City, State, Zip
            </span>
          </p>
          <p>
            <span>
                Phone: 123-456-7890
            </span>
            <span>
                Email:
            </span>
          </p>
        </div>
        <div className="flex flex-col space-y-2">
          <h3 className="text-sm font-bold">Payment</h3>
          <p>**** **** **** 1234</p>
        </div>
      </div>
        
      
      <SubmitAndNext disabled={{next:true}} prevIndex="payment"/>
    </form>
   
  );
}
