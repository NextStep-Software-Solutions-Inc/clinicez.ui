'use client'

import { Phone } from 'lucide-react'
import type { ContactsTabData } from '@/types/patient-profile-tabs'

type Props = { data: ContactsTabData }

export function ContactsTab({ data }: Props) {
  return (
    <div className="space-y-6">
      <div className="glassmorphic-card p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4"><Phone className="w-5 h-5 text-teal-500" /> Emergency Contacts</h3>
        {data.userEmergencyContacts.length > 0 ? (
          <div className="space-y-3">
            {data.userEmergencyContacts.map((contact) => (
              <div key={contact.id} className="p-4 rounded-lg bg-blue-50/30 dark:bg-blue-950/20 border border-blue-200/30 dark:border-blue-800/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Name</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{contact.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Relationship</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{contact.relationship}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Phone</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{contact.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Primary</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{contact.isPrimary ? 'Yes' : 'No'}</p>
                  </div>
                  {contact.address && (
                    <div className="md:col-span-2">
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Address</p>
                      <p className="text-slate-700 dark:text-slate-300">{contact.address}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400 text-center py-8">No emergency contacts recorded</p>
        )}
      </div>
    </div>
  )
}
