import Suspend from '@components/Suspend';
import { Separator } from '@components/ui/separator';
import React from 'react';
import GeneralSettingsForm from '../../../components/settings/GeneralSettingsForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "General | Account Setting",
  description: "General information about your account.",
}

export default async function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">General</h3>
        <p className="text-sm text-muted-foreground">
            General information about your account.
        </p>
      </div>
      <Separator />
      <Suspend>
        <GeneralSettingsForm />
      </Suspend>
    </div>
  )
}