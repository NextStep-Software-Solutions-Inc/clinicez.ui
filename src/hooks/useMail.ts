import { atom, useAtom } from "jotai"

import { appointmentList } from "@public/json/appointment-list"

type Config = {
  selected: string | null
}

const configAtom = atom<Config>({
  selected: appointmentList[0].id,
})

export function useMail() {
  return useAtom(configAtom)
}
