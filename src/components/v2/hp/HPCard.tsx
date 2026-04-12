import Icon from "@/components/Icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { HPAvatar } from "./HPAvatar";
import { extractExperienceYears } from "@/lib/hp-utils";
import { HPProfileDialog } from "./HPProfileDialog";
import { HPBookAppointmentButton } from "./HPBookAppointmentButton";

type HPProfile = {
  id?: number;
  imageUrl?: string;
  title?: string;
  name?: string;
  suffix?: string;
  type?: string;
  experience?: string;
  isAvailableToday?: boolean;
  educations?: string[];
  languages?: string[];
  philosophy?: string;
  workEmail?: string;
  workPhone?: string;
}

interface HPCardProps {
  /** Healthcare provider record ID (used for booking) */
  hpId?: number;
  hp?: HPProfile;
  organization?: string;
}

export function HPCard({
  hpId,
  hp,
  organization,
}: HPCardProps) {
  const profileId = hp?.id;
  const imageSrc = hp?.imageUrl;
  const displayName = [hp?.title, hp?.name, hp?.suffix].filter(Boolean).join(" ") || hp?.name || "Healthcare Provider";
  const type = hp?.type;
  const experienceYears = extractExperienceYears(hp?.experience);
  const isAvailableToday = hp?.isAvailableToday ?? false;
  const canViewProfile = typeof profileId === "number";
  const canBook = typeof hpId === "number";

  const profileForDialog = canViewProfile ? {
    id: profileId,
    imageUrl: hp?.imageUrl,
    title: hp?.title,
    name: hp?.name,
    suffix: hp?.suffix,
    type,
    experience: hp?.experience,
    educations: hp?.educations,
    languages: hp?.languages,
    philosophy: hp?.philosophy,
    workEmail: hp?.workEmail,
    workPhone: hp?.workPhone,
  } : undefined;

  return (
    <Card className="flex h-full w-full flex-col overflow-hidden transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg">
      <CardContent className="flex-1 p-4 sm:p-6">
        <div className="flex w-full flex-col items-center gap-6 sm:flex-row">
          <HPAvatar imageUrl={imageSrc} description={displayName} />

          <div className="flex min-w-0 w-full flex-col items-center sm:items-start">
            <h2 className="w-full truncate text-center text-base font-semibold text-foreground sm:text-left sm:text-lg md:text-xl">{displayName}</h2>
            <Badge className="max-w-full rounded-full bg-secondary-v2 px-3 text-center text-secondary-foreground-v2 font-normal hover:bg-secondary-v2">
              {type ?? "Unknown"}
            </Badge>
            <p className="mt-1 w-full break-words text-center text-sm text-label-v2 sm:text-left">{organization ?? "No Organization"}</p>
            <p className="w-full break-words text-center text-sm text-label-v2 sm:text-left">{experienceYears ? `${experienceYears} year(s) of experience` : "0 years of experience"}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          {isAvailableToday ? (
            <>
              <Icon name="clock" size={20} className="text-primary-v2" />
              <span className="text-sm text-primary-v2">Available today</span>
            </>
          ) : (
            <>
              <Icon name="clock" size={20} className="text-destructive" />
              <span className="text-sm text-destructive">Not available today</span>
            </>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex w-full flex-col items-stretch gap-3 px-4 pb-6 pt-0 sm:flex-row sm:items-center sm:px-6">
        {canViewProfile && profileForDialog ? (
          <HPProfileDialog
            profile={profileForDialog}
            organization={organization}
          />
        ) : (
          <Button
            className="w-full justify-center bg-muted text-sm text-muted-foreground sm:text-base cursor-not-allowed"
            variant="outline"
            disabled
          >
            Profile Unavailable
          </Button>
        )}
        {canBook ? (
          <HPBookAppointmentButton hpId={hpId} hpName={displayName} />
        ) : (
          <Button
            variant="outline"
            className="w-full justify-center text-sm sm:text-base"
            disabled
          >
            Book Appointment
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
