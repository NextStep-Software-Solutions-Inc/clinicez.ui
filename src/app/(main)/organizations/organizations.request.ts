import { request } from "@services/request"

type ResponseType = {
    response: OrganizationType[]
}

export type OrganizationType = {
    id: number,
    url: string,
    coverPhoto: string,
    uid: string,
    name: string,
    bio: string
}

export const getOrganizations = async ()  => {
  const response = await request.get('/api/organization')
  
  if(!response.ok) {
    const error = await response.json()
    throw new Error(JSON.stringify(error, null, 2))
  }
  return await response.json() as ResponseType
}

