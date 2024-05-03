import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import React from 'react';


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
      <Suspense fallback={<div>Loading...</div>}>
        <GeneralSettingsForm />
      </Suspense>
    </div>
  )
}
