import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import React from 'react';


const SettingsPage = async () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="bg-white rounded-lg shadow-2xl w-full md:w-3/4 lg:w-1/2 p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Settings</h2>
        <h3 className="text-xl font-bold mb-4 text-gray-800">Security</h3>
        <div className="flex items-center justify-between">
          <button className="btn disabled">
                        Change Password <span className="badge">Coming Soon</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default withPageAuthRequired(SettingsPage);