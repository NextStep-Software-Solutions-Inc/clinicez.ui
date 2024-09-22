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
  orgUid?: string
}
export const useUser = ({userId, email, orgUid}: UseUser) => {
  
  const fetcher = (...args: any) => self.get<GetUser>(args)
  const searchParams = new URLSearchParams();
  if (orgUid) searchParams.append("orgUid", orgUid)

  return  useSWR(() => (userId || email) ? `/api/users/${userId || email}?${searchParams.toString()}`: null, fetcher);
}