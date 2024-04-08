import { AppRouterPageRouteOpts, withPageAuthRequired, } from "@auth0/nextjs-auth0";
import React from "react";

async function HealthcareProviderRegistrationPage(props: AppRouterPageRouteOpts) {
    const { role } = props.searchParams || {};

    const handleSubmit = async (formData: FormData) => {
        "use server"
        const role = formData.get("role");
        console.log({role});
        
    };
    
  return (
    <div className="container mx=auto">
        {/* add alert here to show the the user has already submitted and waiting for approval */}
        <div className="alert outline-dashed outline-2 mb-5">Your registration is pending approval</div>
        
        <div className="prose">
            <h2>Healthcare Provider Registration</h2>
            <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Rerum nesciunt enim voluptas ratione, magnam quas ea atque odit aspernatur perspiciatis tenetur, iusto provident veritatis temporibus facere totam alias officia veniam.</p>
            <form action={handleSubmit} className="">
                <label className="form-control w-full max-w-xs">
                    <div className="label">
                        <span className="label-text">Role:</span>
                    </div>
                    <select disabled={!!role} name="role" className="select select-bordered">
                        <option disabled>Pick one</option>
                        <option value="doctor" selected={role === "doctor"}>Doctor</option>
                        <option value="nurse" selected={role === "nurse"}>Nurse</option>
                        <option value="admin" selected={role === "admin"}>Admin</option>
                    </select>
                    
                </label>

                <button className="btn mt-2" type="submit">Submit</button>
            </form>
        </div>
    </div>
  );
}
export default withPageAuthRequired(HealthcareProviderRegistrationPage);