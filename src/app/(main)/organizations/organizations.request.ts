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
  const organizations = await request.get('/api/organization', {
    cache: "no-cache"
  })
  return await organizations.json() as ResponseType
}

