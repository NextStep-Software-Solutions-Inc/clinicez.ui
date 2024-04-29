import next from 'next'

type CreateFetchOptions = RequestInit & {
  baseUrl: string
}

export const createCustomFetch = (options: CreateFetchOptions) => {
  if (!options.baseUrl) {
    throw new Error('baseUrl is required')
  }

  type RequestOptionsType = RequestInit & {
      params?: Record<string, string | number | boolean>
  }

  const createSearchParams = (params?: RequestOptionsType["params"]) => {
    const searchParams = new URLSearchParams()
    if (!params) return "" 
    Object.keys(params).forEach(key => {
      if (params[key]!== undefined) {
        searchParams.append(key, params[key].toString())
      }
    })
    return `?${searchParams.toString()}`
  }

  const customFetch = (url: string, init?: RequestOptionsType) => {
      
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

const re = createCustomFetch({
  baseUrl: 'http://localhost:3000',
})
