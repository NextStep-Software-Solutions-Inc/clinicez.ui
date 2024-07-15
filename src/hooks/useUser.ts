import { GetUser } from '@actions/user.action'
import { self } from '@services/request'
import useSWR from 'swr'

export const useUser = (userId: string) => {
  const fetcher = (...args: any) => self.get<GetUser>(args)
  return useSWR(`/api/users/${userId}`, fetcher)
}