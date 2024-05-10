import Image from 'next/image';
import React from 'react';

export const CoverProfilePhoto = ({ coverPhoto, profilePhoto }: { coverPhoto: string, profilePhoto: string }) => {
  return (
    <div className="w-full h-80 bg-cover bg-center relative rounded-lg" style={{ backgroundImage: `url(${coverPhoto})` }}>
      <div className="absolute bottom-0 left-6 transform translate-y-1/3 z-10">
        <div className="w-[15rem] h-[15rem] bg-white rounded-full overflow-hidden">
          <Image alt='cover-photo' src={profilePhoto} width={100} height={100} className="rounded-full w-full h-full object-cover" />
        </div>
      </div>
    </div>
  );
}

export const Title = ({ label, desc }: { label: string, desc: any }) => {
  return (
    <div className="rounded-lg p-4 bg-white bg-opacity-50 flex">
      <h2 className="text-teal-600 font-semibold text-xl capitalize">{label}</h2>
      <p className="text-gray-500 text-xl ml-10">{desc}</p>
    </div>
  );
}

export const Specialties = ({ specialties }: { specialties: string[] }) => {
  return (
    <div className="p-4 bg-white bg-opacity-50 rounded-lg mt-8">
      <div className="inline-block">
        <h2 className="text-teal-600 font-medium text-2xl mb-2">SPECIALTIES</h2>
        <div className="flex gap-3">
          {specialties.map((specialty) => (
            <p key={specialty} className="text-teal-600 text-sm font-light border-teal-600 border-2 rounded-full inline-block px-2 py-1 italic">
              {specialty}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export const ContactInfo = ({ email, number }: { email: string, number: string }) => {
  return (
    <div className="p-4 rounded-lg mt-8">
      <h2 className="text-teal-600 font-medium text-2xl mb-4 mr-4">CONTACT</h2>
      <div className="border-l-4 border-teal-500">
        <div className="flex items-center h-6">
          <div className="ml-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 mr-2 fill-teal-500">
              <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.928 5.493a3 3 0 0 1-3.144 0L1.5 8.67Z" />
              <path d="M22.5 6.908V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.158l9.714 5.978a1.5 1.5 0 0 0 1.572 0L22.5 6.908Z" />
            </svg>
          </div>
          <p className="text-teal-600 text-xl font-semibold">{email}</p>
        </div>
        <div className="flex items-center h-6 mt-2">
          <div className="ml-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 fill-teal-500">
              <path fill-rule="evenodd" d="M1.5 4.5a3 3 0 0 1 3-3h1.372c.86 0 1.61.586 1.819 1.42l1.105 4.423a1.875 1.875 0 0 1-.694 1.955l-1.293.97c-.135.101-.164.249-.126.352a11.285 11.285 0 0 0 6.697 6.697c.103.038.25.009.352-.126l.97-1.293a1.875 1.875 0 0 1 1.955-.694l4.423 1.105c.834.209 1.42.959 1.42 1.82V19.5a3 3 0 0 1-3 3h-2.25C8.552 22.5 1.5 15.448 1.5 6.75V4.5Z" clip-rule="evenodd" />
            </svg>
          </div>
          <p className="text-teal-600 text-xl font-semibold">{number}</p>
        </div>
      </div>
    </div>
  );
}

export const ProfileInfo = ({ fullName, fields, address, biography }: { fullName: string, fields: string[], address: string, biography: string }) => {
  return (
    <div className="col-span-2 lg:col-span-1 mt-[4rem]">
      <div className="w-full flex items-start flex-col mb-5 ml-2">
        <span className="text-2xl font-semibold text-teal-600">{fullName}</span>
        <div className="flex flex-row  gap-2 mb-5 sm:mb-0">
          {fields.slice(0, 2).map((field) => (
            <div key={field} className="text-center text-white bg-teal-600 font-light italic text-xs px-2 py-1 rounded-full">
              {field}
            </div>
          ))}
        </div>
      </div>
      <div className="w-full text-teal-600 text-2xl mb-5 ml-2 font-bold flex items-start flex-col sm:flex-row">
        <p className="text-gray-500 text-base font-medium ">{address}</p>
      </div>
      <h2 className="text-teal-600 text-2xl font-semibold mb-2">BIOGRAPHY</h2>
      <div className="bg-white bg-opacity-80 px-6 py-7 rounded-lg">
        <p className="text-gray-900 ">{biography}</p>
      </div>
    </div>
  );
}
