import assert from 'node:assert/strict'
import test from 'node:test'
import { fetchWithTimeout } from '../src/fetch-with-timeout.js'

test('stops a request when it exceeds the timeout', async () => {
  const fetcher = (_url, { signal }) =>
    new Promise((resolve, reject) => {
      signal.addEventListener(
        'abort',
        () => reject(new Error('Request aborted')),
        { once: true },
      )
    })

  await assert.rejects(
    fetchWithTimeout(
      'https://example.com',
      {},
      fetcher,
      5,
    ),
    (error) => error.name === 'TimeoutError',
  )
})
