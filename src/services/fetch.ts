import { refreshTokensAction } from "@actions/auth.action";
import { authAtom } from "../state/auth";
import { jotaiStore } from "@state/store";

type CustomRequestInit = RequestInit
type CreateFetchOptions = CustomRequestInit & {
  baseUrl?: string;
}

export const createCustomFetch = (options: CreateFetchOptions) => {
  if (!options.baseUrl) {
    console.warn("Base URL is not defined. Using relative URLs may lead to unexpected behavior.");
  }

  type RequestOptionsType = RequestInit & {
      params?: Record<string, string | number | boolean | string[] | undefined>
  }

  const createSearchParams = (params?: RequestOptionsType["params"]) => {
    const searchParams = new URLSearchParams()
    if (!params) return "" 
    Object.keys(params).forEach(key => {
      if (params[key]!== undefined) {
        const value = params[key]?.toString()
        searchParams.append(key, value ?? "")
      }
    })
    return `?${searchParams.toString()}`
  }

  const customFetch = async <T>(url: string, init?: RequestOptionsType): Promise<T> => {
    const { type, token} = jotaiStore.get(authAtom)
    const mergedOptions = {
      ...options,
      ...init,
      headers:{
        ...options.headers,
        Authorization: `${type} ${token}`
      }
    }
    const urlWithParams = `${options.baseUrl ? options.baseUrl : ''}${url}${createSearchParams(init?.params)}`
    const res = await fetchWithAutoRefresh(urlWithParams, mergedOptions)
    if(!res.ok) {
      throw new Error(`Failed to fetch ${urlWithParams}`)
    } else {
      return await res.json() as T
    }
  }
  let refreshTokenInProgress: Promise<string> | null = null;

  async function refreshAuthTokenIfNeeded(): Promise<string> {
    if (!refreshTokenInProgress) {
      const url = new URL(window.location.href);
      refreshTokenInProgress = refreshTokensAction().then(async token => {
        if(token === null) {
          window.open(`/api/auth/login?returnTo=${url.pathname}`, "_self")
        } else {
          jotaiStore.set(authAtom, (prev) => ({ ...prev, token: token?.accessToken ?? "" }));
        }
        return token?.accessToken ?? "";
      }).finally(() => {
        refreshTokenInProgress = null; // Reset after completion
      });
    }
    return refreshTokenInProgress;
  }

  async function fetchWithAutoRefresh(url: string, options: RequestInit): Promise<Response> {
    const response = await fetch(url, options);
  
    if (response.status === 401) {
      // Wait for token refresh if it's already in progress or trigger a new one
      const newToken = await refreshAuthTokenIfNeeded();
  
      // Update the Authorization header with the new token
      const newHeaders = new Headers(options.headers);
      newHeaders.set('Authorization', `Bearer ${newToken}`);
  
      // Clone the original request with updated headers and retry
      const newOptions = { ...options, headers: newHeaders };
      return fetch(url, newOptions); // Retry the request with the new token
    }
  
    return response; // Return the original response if status is not 401
  }
  
  const get = <T>(url: string, init?: RequestOptionsType) => customFetch<T>(url, { ...init, method: 'GET' })
  const post = <T>(url: string, init?: RequestOptionsType ) => customFetch<T>(url, { ...init, method: 'POST' })
  const put = (url: string, init?: RequestOptionsType) => customFetch(url, { ...init, method: 'PUT' })
  const patch = (url: string, init?: RequestOptionsType) => customFetch(url, { ...init, method: 'PATCH' })
  const delete_ = (url: string, init?: RequestOptionsType) => customFetch(url, { ...init, method: 'DELETE' })
  
  return {
    get,
    post,
    put,
    patch,
    delete: delete_,
  }
}
