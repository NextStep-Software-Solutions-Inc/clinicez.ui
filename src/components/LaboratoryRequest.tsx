"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@components/ui/card";
import React, { useState, useEffect } from "react";
import Each from "@components/utils/Each";
import Suspend from "@components/Suspend";
import dynamic from "next/dynamic";
import { FileText, Pill } from "lucide-react";
import type { PatientProfile } from "@components/clinic/clinical-records/CreateLaboratoryRequestModal";
import { getUserAndAddressAction } from "@/actions/users/user.action";
import LaboratoryRequestItem from "@components/laboratory-requests/LaboratoryRequestItem";
import { useLaboratoryRequests } from "@/hooks/use-laboratory-requests";
// import { useLaboratoryRequests } from "@hooks/useLaboratoryRequests";
const CreateLaboratoryRequestModal = dynamic(
  () => import("@components/clinic/clinical-records/CreateLaboratoryRequestModal").then(module => ({ default: module.default }))
);

export interface LaboratoryRequestProps {
  consultationTicketId?: number;
  clinicUid?: string;
  hpId?: number;
  isArchived?: boolean;
  patientId?: number | string;
  userId?: string;
}

export default function LaboratoryRequest({ consultationTicketId, clinicUid, hpId, patientId, userId }: LaboratoryRequestProps) {
  const [userInfo, setUserInfo] = useState<PatientProfile | null>(null);

  const resolvedPatientId = typeof patientId === "string" ? Number(patientId) : patientId;
  const { data: requests, mutate } = useLaboratoryRequests({
    clinicUid,
    consultationTicketId,
    hpId,
    patientId: resolvedPatientId
  });

  useEffect(() => {
    async function fetchUserInfo() {
      if (userId && typeof userId === "string" && userId.trim() !== "") {
        try {
          const res = await getUserAndAddressAction(userId);
          if (res && res?.data) {
            const user = res.data;
            const mapped: PatientProfile = {
              firstName: user.firstName ?? "Unknown",
              middleName: user.middleName ?? undefined,
              lastName: user.lastName ?? undefined,
              suffix: user.suffix ?? undefined,
              dob: user.dob ? user.dob.toString() : undefined,
              gender: user.gender ?? undefined,
              address: user.UserAddresses && user.UserAddresses.length > 0 ? {
                homeAddress: user.UserAddresses[0].address ?? undefined,
                city: user.UserAddresses[0].city ?? undefined,
                state: user.UserAddresses[0].state ?? undefined,
                zipCode: user.UserAddresses[0].zipCode ?? undefined,
                country: user.UserAddresses[0].country ?? undefined,
              } : undefined,
            };
            setUserInfo(mapped);
          } else {
            setUserInfo(null);
          }
        } catch (e) {
          setUserInfo(null);
        }
      } else {
        setUserInfo(null);
      }
    }

    fetchUserInfo();
  }, [userId]);

  return (
    <Card className="group/laboratory-request">
      <CardHeader>
        <div className="flex flex-wrap gap-2 items-center">
          <div>
            <CardTitle className="flex items-center gap-3 text-lg ">
              <FileText className="text-primary" />
              Laboratory Requests
            </CardTitle>
            <CardDescription>List of all created laboratory requests</CardDescription>
          </div>
          <div className="ml-auto flex flex-grow sm:flex-grow-0 items-center gap-2">
            <Suspend>
              <CreateLaboratoryRequestModal
                clinicUid={clinicUid ?? ""}
                patientId={resolvedPatientId}
                hpId={hpId}
                onCreated={mutate}
                userInfo={userInfo}
                consultationTicketId={consultationTicketId}
              />
            </Suspend>
          </div>
        </div>
      </CardHeader>
      <CardContent className=" h-[25rem] overflow-y-auto no-scrollbar scrollBox">
        <div className="grid gap-1">
          <Each
            of={requests?.data ?? []}
            fallback={
              <p className="text-center text-muted-foreground">
                No recent laboratory request to show.
              </p>
            }
            render={(request) => (
              <LaboratoryRequestItem request={request} onUpdated={mutate} />
            )}
          />
        </div>
      </CardContent>
      <CardFooter />
    </Card>
  );
}
