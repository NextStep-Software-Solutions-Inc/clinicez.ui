import practitionerData from '../../../public/practitioner.json';
import PractitionerDetails from '@components/PractitionersDetails';

export default function Practitioners() {
  return (
    
      <div>
        
        {practitionerData.map((practitioner, index) => (
          <PractitionerDetails
            key={index}
            name={practitioner.name}
            specialty={practitioner.specialty} 
            address={practitioner.address} 
            biography={practitioner.biography} 
            profilePhoto={practitioner.profilePhoto} 
            years={practitioner.years}
            languages={practitioner.languages}
            field={practitioner.field}
            email={practitioner.email}
            number={practitioner.number}
          />
        ))}
      </div>
   
  );
}
