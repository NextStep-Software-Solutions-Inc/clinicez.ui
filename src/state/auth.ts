import { atom } from "jotai";

export const authAtom = atom({
  type: "Bearer",
  token: "",
})