"use server";

import { revalidatePath as revalidate } from 'next/cache';

export const revalidatePath: typeof revalidate = async (path, options) => {
  revalidate(path, options);
};