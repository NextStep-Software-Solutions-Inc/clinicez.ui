"use client";

import React from "react";

import HotjarClient from '@hotjar/browser';

const siteId = parseInt(process.env.NEXT_PUBLIC_HOTJAR_SITE_ID!);
const hotjarVersion = parseInt(process.env.NEXT_PUBLIC_HOTJAR_VERSION!);

export default function Hotjar() {
  
  React.useEffect(() => {
    HotjarClient.init(siteId, hotjarVersion);
  }, []);

  return null;
}
