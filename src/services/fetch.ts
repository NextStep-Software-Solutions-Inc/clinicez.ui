type CustomRequestInit = RequestInit
type CreateFetchOptions = CustomRequestInit & {
  baseUrl: string;
}

export const createCustomFetch = (options: CreateFetchOptions) => {

  console.log(options.baseUrl);
  
  if (!options.baseUrl) {
    console.log(!options.baseUrl);
    throw new Error('baseUrl is required losidosidpo')
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

  const customFetch = async (url: string, init?: RequestOptionsType) => {
    const mergedOptions = {
      ...options,
      ...init,
    }

    

    const urlWithParams = `${options.baseUrl}${url}${createSearchParams(init?.params)}`

    return fetch(urlWithParams, mergedOptions)
  }

  const get = (url: string, init?: RequestOptionsType) => customFetch(url, { ...init, method: 'GET' })
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
