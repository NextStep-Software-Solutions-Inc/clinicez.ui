"use client";

import React from "react";
import HotJarClient from '@hotjar/browser';

const siteId = parseInt(process.env.NEXT_PUBLIC_HOTJAR_SITE_ID!);
const hotJarVersion = parseInt(process.env.NEXT_PUBLIC_HOTJAR_VERSION!);

export default function HotJar() {
  React.useEffect(() => {
    HotJarClient.init(siteId, hotJarVersion);
  }, []);
  return null;
}
