type CustomRequestInit = RequestInit
type CreateFetchOptions = CustomRequestInit & {
  baseUrl: string;
}

export const createCustomFetch = (options: CreateFetchOptions) => {

  if (!options.baseUrl) {
    throw new Error('baseUrl is required')
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
    const mergedOptions = {
      ...options,
      ...init,
    }
    const urlWithParams = `${options.baseUrl}${url}${createSearchParams(init?.params)}`

    return (await fetch(urlWithParams, mergedOptions)).json() as T
    
  }

  const get = <T>(url: string, init?: RequestOptionsType) => customFetch<T>(url, { ...init, method: 'GET' })
  const post = (url: string, init?: RequestOptionsType ) => customFetch(url, { ...init, method: 'POST' })
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
