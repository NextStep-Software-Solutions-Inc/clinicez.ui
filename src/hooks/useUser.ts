import { GetUser, GetUsers } from '@actions/users/user.action'
import { self } from '@services/request'
import useSWR from 'swr'

type UseUsersFilter = {
  userId?: string,
  email?: string
  orgUid?: string
}
export const useUsers = (filter?: UseUsersFilter) => {
  const { userId, email, orgUid } = filter || {};
  const fetcher = (...args: any) => self.get<GetUsers>(args)
  const searchParams = new URLSearchParams();

  if (userId) searchParams.append('userId', userId);
  if (email) searchParams.append("email", email)
  if (orgUid) searchParams.append("orgUid", orgUid)
    
  return  useSWR(() => `/api/users?${searchParams.toString()}`, fetcher);
}
type UseUser = {
  userId?: string,
  email?: string
}
export const useUser = ({userId, email}: UseUser) => {
  
  const fetcher = (...args: any) => self.get<GetUser>(args)
  return  useSWR(() => (userId || email) ? `/api/users/${userId || email}`: null, fetcher);
}