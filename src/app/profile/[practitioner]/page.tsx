import PractitionerDetails from "@components/PractitionersDetails";
import practitionerData from "@public/practitioner.json";
import React from "react";

export default function PractitionerPage() {
  return (
    <div className="container mx-auto">
        <PractitionerDetails
          id={practitionerData.id}
          title={practitionerData.title}
          firstName={practitionerData.firstName}
          lastName={practitionerData.lastName}
          middleName={practitionerData.middleName}
          suffix={practitionerData.suffix}
          email={practitionerData.email}
          number={practitionerData.number}
          fields={practitionerData.fields} 
          profilePhoto={practitionerData.profilePhoto} 
          user_metadata={practitionerData.user_metadata}
        />
    </div>
  )
}
