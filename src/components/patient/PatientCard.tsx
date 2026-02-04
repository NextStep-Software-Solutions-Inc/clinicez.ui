'use client';

import { Avatar, AvatarFallback } from '@components/ui/avatar';
import { Badge } from '@components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@components/ui/card';
import ConditionalRender from '@components/utils/ConditionalRender';
import Image from 'next/image';
import { GetClinicPatients } from '@/actions/clinics/clinic-patient.action';
import dayjs from '@lib/day-utils';
import { ViewEMRButton } from './ViewEMRButton';
import { calculateAge } from '@/lib/utils';
import { PatientInsightsCard } from '@/components/ai';

type ViewMode = 'list' | 'grid';

interface PatientCardProps {
  patient: NonNullable<GetClinicPatients['data']>[number] & {
    immunocompromised?: boolean;
  };
  viewMode?: ViewMode;
}

export function PatientCard({ patient, viewMode = 'grid' }: PatientCardProps) {
  const {
    Patient: {
      dob,
      gender,
      firstName,
      middleName,
      lastName,
      suffix,
      updatedAt,
      bloodType,
      nickname,
      userId,
      picture = 'https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png',
    },
    immunocompromised,
    stats = {
      appointments: 0,
      conditions: 0,
      medications: 0,
    },
  } = patient;

  const nameInitials = `${firstName?.charAt(0) ?? ''}${lastName?.charAt(0) ?? ''}`;
  const name = `${lastName || '-'}, ${firstName || '-'} ${middleName ?? ''} ${suffix ?? ''}`;
  const age = calculateAge(dob);

  // Extract numeric userId
  const numericUserId = userId ? parseInt(userId.split('_')[1] || '0') : 0;

  // List view - horizontal compact layout
  if (viewMode === 'list') {
    return (
      <Card className="shadow-md select-none w-full hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4 items-start">
            {/* Avatar */}
            <Avatar className="rounded h-16 w-16 flex-shrink-0">
              {picture ? (
                <Image
                  width={64}
                  height={64}
                  className="object-cover w-full"
                  src={picture}
                  alt={nickname ?? ''}
                />
              ) : (
                <AvatarFallback>{nameInitials}</AvatarFallback>
              )}
            </Avatar>

            {/* Patient Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-sm line-clamp-1">{name}</p>
                  <p className="text-xs text-muted-foreground">
                    {gender?.toLowerCase()} / {age && `${age} years old`}
                    {bloodType && ` / ${bloodType.split('_').join(' ').toLowerCase()}`}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <ViewEMRButton userId={userId} />
                </div>
              </div>

              {/* Stats & Badges in a single row */}
              <div className="flex gap-3 items-center flex-wrap mb-2">
                {/* Stats */}
                <div className="flex gap-4 text-xs">
                  <div>
                    <span className="text-muted-foreground">Appointments: </span>
                    <span className="font-semibold">{stats.appointments}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Conditions: </span>
                    <span className="font-semibold">{stats.conditions}</span>
                  </div>
                </div>

                {/* Badges */}
                <ConditionalRender condition={immunocompromised ?? false}>
                  <Badge variant="destructive" className="text-xs">
                    Immunocompromised
                  </Badge>
                </ConditionalRender>
              </div>

              <p className="text-xs text-muted-foreground">
                Updated: {dayjs(updatedAt).format('MMM DD, YYYY')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid view - original card layout (vertical)
  return (
    <Card className="shadow-2xl select-none flex-grow lg:flex-grow-0">
      <CardHeader>
        <CardTitle className="line-clamp-1">{name}</CardTitle>
        <CardDescription>Last update: {dayjs(updatedAt).format('lll')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3">
          <Avatar className="rounded w-40 h-40">
            {picture ? (
              <Image
                width={200}
                height={200}
                className="object-cover w-full"
                src={picture}
                alt={nickname ?? ''}
              />
            ) : (
              <AvatarFallback>{nameInitials}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 flex flex-col justify-between">
            <div className="">
              <p className="text-sm text-muted-foreground italic font-medium truncate overflow-hidden capitalize">
                {gender?.toLowerCase()} / {age && `${age} years old`}
              </p>
              <p className="text-sm text-muted-foreground italic font-medium capitalize">
                {bloodType?.split('_').join(' ').toLowerCase()}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <ConditionalRender condition={immunocompromised ?? false}>
                <Badge variant="destructive">Immunocompromised</Badge>
              </ConditionalRender>
            </div>
            <div>
              <ViewEMRButton userId={userId} />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-4">
        {/* AI Patient Insights */}
        <PatientInsightsCard userId={numericUserId} clinicId={patient.Clinic?.id} />
      </CardFooter>
    </Card>
  );
}

