import { atom, useAtom } from "jotai"

import { Appointment, appointmentList } from "@public/json/appointment-list"

type Config = {
  selected: Appointment["id"] | null
}

const configAtom = atom<Config>({
  selected: appointmentList[0].id,
})

export function useMail() {
  return useAtom(configAtom)
}
