import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import Suspend from '@components/Suspend';
import { Separator } from '@components/ui/separator';
import React from 'react';
import GeneralSettingsForm from './GeneralSettingsForm';


const SettingsPage = async () => {
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

export default withPageAuthRequired(SettingsPage);