"use client";

import React from "react";

interface HPApplicationDataType {
    selectedRole?: string;
    selectedPlan?: string;
    profileData: any;
    paymentData: any;
    applicationStatus: string;
}

const HPApplicationDataContext = React.createContext<{applicationData: HPApplicationDataType, dispatch: React.Dispatch<Partial<HPApplicationDataType>>}>({
  applicationData: {
    selectedRole: "",
    selectedPlan: "",
    profileData: {},
    paymentData: {},
    applicationStatus: "",
  },
  dispatch: () => {},
});

interface HPApplicationDataProviderProps {
    children: React.ReactNode;
}

export default function HPApplicationDataProvider({children}: HPApplicationDataProviderProps) {
  const [applicationData, dispatch] = React.useReducer(
    (state: HPApplicationDataType, newState: Partial<HPApplicationDataType>) => ({
      ...state,
      ...newState,
    }),
    {
      selectedRole: "",
      selectedPlan: "",
      profileData: {},
      paymentData: {},
      applicationStatus: "",
    }
  );

  return <HPApplicationDataContext.Provider value={{applicationData, dispatch}}>{children}</HPApplicationDataContext.Provider>;
}

export {HPApplicationDataContext, HPApplicationDataProvider};