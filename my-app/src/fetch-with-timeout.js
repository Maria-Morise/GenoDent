export async function fetchJsonWithTimeout(
  url,
  options = {},
  fetcher = fetch,
  timeoutMs = 12000,
) {
  const controller = new AbortController()

  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  try {
    const response = await fetcher(url, {
      ...options,
      signal: controller.signal,
    })

    if (!response.ok) {
      return { response, data: null }
    }

    const data = await response.json()

    return { response, data }
  } catch (error) {
    if (controller.signal.aborted) {
      const timeoutError = new Error(
        'The request took too long to respond.',
      )
      timeoutError.name = 'TimeoutError'
      throw timeoutError
    }

    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
