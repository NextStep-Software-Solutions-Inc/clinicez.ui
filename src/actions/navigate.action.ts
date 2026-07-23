"use server";

import { redirect } from "next/navigation";


export const navigateAction = async (url: string, type?: Parameters<typeof redirect>[1]) => {
  redirect(url, type);
}