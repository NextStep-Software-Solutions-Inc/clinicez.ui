"use client";

import { GetNoteTemplates } from "@actions/note-template.action";
import { self } from "@services/request"
import useSWR from "swr"

export const useNoteTemplates = () => {
  const fetcher = (args:string) => self.get<GetNoteTemplates>(args)
  const searchParams = new URLSearchParams()
  return useSWR(`/api/note-templates?${searchParams.toString()}`, fetcher)
}
