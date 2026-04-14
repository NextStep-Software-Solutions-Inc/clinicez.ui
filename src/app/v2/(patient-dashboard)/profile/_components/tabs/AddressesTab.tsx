'use client'

import { MapPin } from 'lucide-react'
import type { AddressesTabData } from '@/types/patient-profile-tabs'

type Props = { data: AddressesTabData }

export function AddressesTab({ data }: Props) {
  return (
    <div className="space-y-6">
      <div className="glassmorphic-card p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white mb-4"><MapPin className="w-5 h-5 text-teal-500" /> Addresses</h3>
        {data.userAddresses.length > 0 ? (
          <div className="space-y-3">
            {data.userAddresses.map((addr) => (
              <div key={addr.id} className="p-4 rounded-lg bg-green-50/30 dark:bg-green-950/20 border border-green-200/30 dark:border-green-800/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Primary</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{addr.isPrimary ? 'Yes' : 'No'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Address</p>
                    <p className="text-slate-900 dark:text-white font-semibold">{addr.address}</p>
                  </div>
                  {addr.apartmentUnit && (
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Unit</p>
                      <p className="text-slate-700 dark:text-slate-300">{addr.apartmentUnit}</p>
                    </div>
                  )}
                  {addr.bldgName && (
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Building</p>
                      <p className="text-slate-700 dark:text-slate-300">{addr.bldgName}</p>
                    </div>
                  )}
                  {addr.street && (
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Street</p>
                      <p className="text-slate-700 dark:text-slate-300">{addr.street}</p>
                    </div>
                  )}
                  {addr.barangay && (
                    <div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Barangay</p>
                      <p className="text-slate-700 dark:text-slate-300">{addr.barangay}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">City</p>
                    <p className="text-slate-700 dark:text-slate-300">{addr.city}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">State/Province</p>
                    <p className="text-slate-700 dark:text-slate-300">{addr.state}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Country</p>
                    <p className="text-slate-700 dark:text-slate-300">{addr.country}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 font-semibold uppercase">Zip Code</p>
                    <p className="text-slate-700 dark:text-slate-300">{addr.zipCode}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-600 dark:text-slate-400 text-center py-8">No addresses recorded</p>
        )}
      </div>
    </div>
  )
}
