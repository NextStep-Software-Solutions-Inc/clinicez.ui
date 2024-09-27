import {  CoverProfilePhoto, PersonalDetails } from "./PractitionerLayout";
import { Badge } from "@components/ui/badge";
import { Label } from "@components/ui/label";
import Each from "@components/utils/Each";
import { EarthIcon, FacebookIcon, LinkedinIcon, MailIcon, PhoneCallIcon, TwitterIcon } from "lucide-react";
import Suspend from "@components/Suspend";
import { notFound } from "next/navigation";
import { getHPAction } from "@actions/hp.actions";

interface HPProfileProps {
  hpId: number;
}

export default async function HPProfile({hpId}: HPProfileProps) {
  const profile = await getHPAction({
    isPublished: true,
    id: hpId
  });
  if (!profile) notFound();
  
  const cover = profile.HPProfile?.cover ?? "https://art.metro.net/wp-content/uploads/2021/02/placeholder.png";
  const picture = profile.HPProfile?.picture ?? "https://integratedmedfl.com/wp-content/uploads/2023/08/dr.png";
  const philosophy = profile.HPProfile?.philosophy;
  const areaOfInterest = profile.HPProfile?.areaOfInterest;
  const experience = profile.HPProfile?.experience ?? "";
  const educations = profile.HPProfile?.educations ?? [];
  const languages = profile.HPProfile?.languages ?? [];
  const specialties = profile.HPProfile?.specialties ?? [];
  const affiliations = profile.HPProfile?.affiliations  ?? [];
  const hobbies = profile.HPProfile?.hobbies ?? [];
  const fields = profile.HPProfile?.fields ?? [];
  const alias = profile.HPProfile?.name?.split(" ").map(name => name[0]).join("") ?? "";

  const links =  {
    website: profile.User.SocialLink?.website ?? "",
    linkedin: profile.User.SocialLink?.linkedin ?? "",
    facebook: profile.User.SocialLink?.facebook ?? "",
    twitter: profile.User.SocialLink?.twitter ?? "",
    tiktok: profile.User.SocialLink?.tiktok ?? "",
  }

  const personalDetails = {
    name: profile.HPProfile?.name ?? "",
    title: profile.HPProfile?.title ?? "",
    suffix: profile.HPProfile?.suffix ?? "",
    fields: profile.HPProfile?.fields ?? [],
  };

  const contactDetails = {
    email: profile.HPProfile?.workEmail ?? "",
    phone: profile.HPProfile?.workPhone ?? "",
  }

  return (
    <div className="">
      {/* Photos */}
      <Suspend>
        <CoverProfilePhoto 
          coverPhoto={cover} 
          profilePhoto={picture}
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
            

            { philosophy && (
              <div >
                <Label>Philosophy of Care</Label>
                <p className="indent-5 mt-2">{philosophy}</p>
              </div>
            )}
            { areaOfInterest && (
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
              <ul className="list-disc ml-5">
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
                  <a href={`tel:${contactDetails.phone}`}>{contactDetails.phone}</a>
                </div>
                <div className="flex items-center gap-2">
                  <EarthIcon/>
                  <a href={links?.website} target="_blank">{links.website}</a>
                </div>
                <div className="flex items-center gap-2">
                  <LinkedinIcon/>
                  <a href={links?.linkedin} target="_blank">{links.linkedin}</a>
                </div>
                <div className="flex items-center gap-2">
                  <FacebookIcon/>
                  <a href={links?.facebook} target="_blank">{links.facebook}</a>
                </div>
                <div className="flex items-center gap-2">
                  <TwitterIcon/>
                  <a href={links?.twitter} target="_blank">{links.twitter}</a>
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
              <ul className="list-disc ml-5">
                <Each
                  of={educations}
                  render={education => <li>{education}</li>}
                />
              </ul>
            </div>
            <div>
              <Label className="">Certifications</Label>
              <ul className="list-disc ml-5">
                <Each
                  of={profile.HPProfile?.certifications ?? []}
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
              <ul className="list-disc ml-5">
                <Each
                  of={specialties}
                  render={specialty => <li>{specialty}</li>}
                />
              </ul>
            </div>
            <div>
              <Label className="">Affiliations</Label>
              <ul className="list-disc ml-5">
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