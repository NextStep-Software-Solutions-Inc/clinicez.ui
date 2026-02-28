"use client"

import dynamic from 'next/dynamic';
import React from 'react'
const ScheduleSettingsForm = dynamic(() => import("./ScheduleSettingsForm"), { ssr: false });

export default function ScheduleSettings() {
  return <ScheduleSettingsForm />
}
