import { Organization } from "@prisma/client"
import { self } from "@services/request"

type ResponseType = {
    response: Organization[]
}

export const getOrganizations = async ()  => {
  const response = await self.get('/api/organizations')
  
  if(!response.ok) {
    const error = await response.json()
    throw new Error(JSON.stringify(error, null, 2))
  }
  return await response.json() as ResponseType
}

