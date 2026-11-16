export async function fetchWithTimeout(
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
    return await fetcher(url, {
      ...options,
      signal: controller.signal,
    })
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
