"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@components/ui/avatar';
import Image from 'next/image';
import React from 'react';

export const CoverProfilePhoto = ({ coverPhoto, profilePhoto, alias }: { coverPhoto: string, profilePhoto: string, alias: string }) => {
  return (
    <div className="w-full h-80 relative">
      <Image src={coverPhoto} fill quality={85} objectFit="cover" alt={coverPhoto} className='rounded-lg' />
      <div className="absolute bottom-0 left-6 transform translate-y-1/3 z-10">
        <Avatar className='w-[12rem] h-[12rem] rounded-full overflow-hidden ring-4 ring-white'>
          {
            profilePhoto
              ? <Image
                src={profilePhoto}
                width={200}
                height={200}
                quality={85}
                alt={alias}
                className='w-full h-full object-cover'
              />
              : <AvatarFallback className='text-8xl'>{alias}</AvatarFallback>
          }
        </Avatar>
      </div>
    </div>
  );
}


export const PersonalDetails = ({ name, title, suffix }: { name: string, title: string, suffix: string }) => {
  return (
    <div className="space-x-2 text-xl font-semibold">
      <span className="italic">{title}</span>
      <span>{name}</span>
      <span className="italic">{suffix}</span>
    </div>
  );
}
