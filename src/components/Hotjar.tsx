"use client";

import React from "react";

import HotjarClient from '@hotjar/browser';

const siteId = 5036459;
const hotjarVersion = 6;

export default function Hotjar() {
  
  React.useEffect(() => {
    HotjarClient.init(siteId, hotjarVersion);
  }, []);

  return null;
}
