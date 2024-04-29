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
  const response = await request.get('/api/health-provider', {
    params: {
      role: "nurse",
      pageNumber: 1,
      pageSize: 10
    },
  })
  if(!response.ok) {
    const error = await response.json()
    throw new Error(JSON.stringify(error, null, 2))
  }
  return await response.json() as ResponseType
}

