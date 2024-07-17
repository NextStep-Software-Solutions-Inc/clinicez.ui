import { atom, createStore } from "jotai";

export const authAtom = atom({
  type: "Bearer",
  token: "",
})

export const jotaiStore = createStore()
