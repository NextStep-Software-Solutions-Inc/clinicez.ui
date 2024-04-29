import { createCustomFetch } from './fetch';


describe('createCustomFetch', () => {
  it('should create a custom fetch function', () => {
    const fetch = createCustomFetch({ baseUrl: 'http://example.com' });
    expect(typeof fetch.get).toBe('function');
    expect(typeof fetch.post).toBe('function');
    expect(typeof fetch.put).toBe('function');
    expect(typeof fetch.patch).toBe('function');
    expect(typeof fetch.delete).toBe('function');
  });
});

// Add more tests here to test the behavior of the fetch functions
describe('createCustomFetch', () => {

  it('should throw error if baseUrl not provided', () => {
    expect(() => {
      createCustomFetch({})
    }).toThrow('baseUrl is required')
  })

  it('should append query parameters correctly', () => {
    const fetch = createCustomFetch({baseUrl: 'http://test.com'})
    fetch.get('/test', {
      params: {
        id: 123,
        name: 'John'
      }
    })
    expect(fetch).toHaveBeenCalledWith('http://test.com/test?id=123&name=John', expect.anything()) 
  })

  it('should handle undefined query parameters', () => {
    const fetch = createCustomFetch({baseUrl: 'http://test.com'})
    fetch.get('/test', {
      params: {
        id: 123,
        name: undefined
      }
    })
    expect(fetch).toHaveBeenCalledWith('http://test.com/test?id=123', expect.anything())
  })

  it('should encode query parameter values correctly', () => {
    const fetch = createCustomFetch({baseUrl: 'http://test.com'})
    fetch.get('/test', {
      params: {
        query: 'foo bar'
      }
    })
    expect(fetch).toHaveBeenCalledWith('http://test.com/test?query=foo%20bar', expect.anything())
  })

  it('should handle empty query parameters', () => {
    const fetch = createCustomFetch({baseUrl: 'http://test.com'})
    fetch.get('/test', {
      params: {}
    })
    expect(fetch).toHaveBeenCalledWith('http://test.com/test', expect.anything())
  })

})
