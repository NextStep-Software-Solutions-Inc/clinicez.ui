import { HP } from "@actions/hp.actions";
import {  CoverProfilePhoto, PersonalDetails } from "./PractitionerLayout";
import { Badge } from "@components/ui/badge";
import { Label } from "@components/ui/label";
import Each from "@components/utils/Each";
import { EarthIcon, FacebookIcon, LinkedinIcon, MailIcon, PhoneCallIcon, TwitterIcon } from "lucide-react";
import Suspend from "@components/Suspend";
import { ar } from "@faker-js/faker";

interface IPractitionerProfileProps {
    profile: HP;
}

export default function PractitionerProfile({profile}: IPractitionerProfileProps) {

  const coverPhoto = (profile.coverPhoto ?? "https://art.metro.net/wp-content/uploads/2021/02/placeholder.png") as string;
  const philosophy = profile.user_metadata.philosophy
  const areaOfInterest = profile.user_metadata.areaOfInterest
  const experience = profile.credentials.experience;
  const educations = profile.credentials.education;
  const languages = profile.professionalDetails.languages
  const specialties = profile.professionalDetails.specialties
  const affiliations = profile.professionalDetails.affiliations
  const hobbies = profile.user_metadata.hobbies
  const links = profile.links 
  const fields = profile.professionalDetails.fields
  const alias = profile.name.split(" ").map(name => name[0]).join("")

  const personalDetails = {
    title: profile.title,
    name: profile.name,
    suffix: profile.suffix
  }

  const contactDetails = {
    email: profile.email,
    phone: profile.phone
  }

  return (
    <div className="mt-5">
      {/* Photos */}
      <Suspend>
        <CoverProfilePhoto 
          coverPhoto={coverPhoto} 
          profilePhoto={profile.profilePhoto}
          alias={alias}
        />
      </Suspend>
      {/* Practitioner Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2  mt-24 gap-10">
        <div className="">
          <PersonalDetails {...personalDetails}/>
          <div  className="space-y-5">
            <div className="flex gap-1 flex-wrap mt-2">
              <Each
                of={fields}
                render={field => <Badge >{field}</Badge>}
              />
            </div>
            

            <div >
              <Label>Philosophy of Care</Label>
              <p className="indent-5 mt-2">{philosophy}</p>
            </div>

            {
              areaOfInterest && (
                <div >
                  <Label>Area of Interest</Label>
                  <p className="">{areaOfInterest}</p>
                </div>
              )
            }

            {
              hobbies && (
                <div>
                  <Label className="">Hobbies</Label>
                  <p>{hobbies}</p>
                </div>
              )
            }
            
            <div>
              <Label className="">Languages</Label>
              <ul className="list-disc ml-10">
                <Each
                  of={languages}
                  render={language => <li>{language}</li>}
                />
              </ul>
            </div>
            <div>
              <Label className="text-xl font-semibold">Contact Information</Label>
              <div className="space-y-1 mt-5">
                <div className="flex items-center gap-2">
                  <MailIcon/>
                  <a href={`mailto:${contactDetails.email}`}>{contactDetails.email}</a>
                </div>
                <div className="flex items-center gap-2">
                  <PhoneCallIcon/>
                  <a href={`$tel:{contactDetails.phone}`}>{contactDetails.phone}</a>
                </div>
                <div className="flex items-center gap-2">
                  <EarthIcon/>
                  <a href={links.website} target="_blank">{links.website}</a>
                </div>
                <div className="flex items-center gap-2">
                  <LinkedinIcon/>
                  <a href={links.linkedin} target="_blank">{links.linkedin}</a>
                </div>
                <div className="flex items-center gap-2">
                  <FacebookIcon/>
                  <a href={links.facebook} target="_blank">{links.facebook}</a>
                </div>
                <div className="flex items-center gap-2">
                  <TwitterIcon/>
                  <a href={links.twitter} target="_blank">{links.twitter}</a>
                </div>
              </div>
            </div>
          </div>
          
        </div>
        <div className="">
          <div className="flex flex-col gap-5">
            <Label className="text-xl font-semibold">Credentials</Label>
            <div className="">
              <Label className="">Education</Label>
              <ul className="list-disc ml-10">
                <Each
                  of={educations}
                  render={education => <li>{education}</li>}
                />
              </ul>
            </div>
            <div>
              <Label className="">Certifications</Label>
              <ul className="list-disc ml-10">
                <Each
                  of={profile.credentials.certifications}
                  render={certification => <li>{certification}</li>}
                />
              </ul>
            </div>
            <div>
              <Label className="">Years of Experience</Label>
              <p>{experience}</p>
            </div>
            
            <Label className="text-xl font-semibold">Professional Details</Label>
            <div>
              <Label className="">Specialties</Label>
              <ul className="list-disc ml-10">
                <Each
                  of={specialties}
                  render={specialty => <li>{specialty}</li>}
                />
              </ul>
            </div>
            <div>
              <Label className="">Affiliations</Label>
              <ul className="list-disc ml-10">
                <Each
                  of={affiliations}
                  render={affiliation => <li>{affiliation}</li>}
                />
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}





