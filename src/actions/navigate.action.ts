"use server";

import { redirect, RedirectType } from "next/navigation";


export const navigateAction = async (url: string, type?: RedirectType ) => {
  redirect(url, type);
}