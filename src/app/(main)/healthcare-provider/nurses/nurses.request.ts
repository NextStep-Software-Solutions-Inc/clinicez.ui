import { request } from "../../../../services/request";

type ResponseType = {
    response: NurseType[]
}

export type NurseType = {
    id: number,
    role: string,
    organization: string,
    profile: {
        id: number,
        profilePhotoUrl: string,
        coverPhotoUrl: string,
        title: string,
        firstName: string,
        middleName: string,
        lastName: string,
        suffix: string,
        fieldOfStudy: string
    }
}

export const getNurses = async ()  => {
  const doctors = await request.get('/api/health-provider', {
    params: {
      role: "nurse",
      pageNumber: 1,
      pageSize: 10
    },
    cache: "no-cache"
  })
  return await doctors.json() as ResponseType
}

