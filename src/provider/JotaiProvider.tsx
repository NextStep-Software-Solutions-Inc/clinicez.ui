"use client";

import { Provider } from "jotai";
import React from "react";
import { jotaiStore } from "../state/auth";

export default function JotaiProvider({children}: {children: React.ReactNode}) {
  return (
    <Provider store={jotaiStore}>
      {children}
    </Provider>
  );
}
