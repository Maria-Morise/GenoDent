import assert from 'node:assert/strict'
import test from 'node:test'
import { fetchJsonWithTimeout } from '../src/fetch-with-timeout.js'

test('returns the response and its JSON data', async () => {
  const expectedData = { result: 'success' }

  const result = await fetchJsonWithTimeout(
    'https://example.com',
    {},
    async () => ({
      ok: true,
      status: 200,
      json: async () => expectedData,
    }),
  )

  assert.equal(result.response.status, 200)
  assert.deepEqual(result.data, expectedData)
})

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
    fetchJsonWithTimeout(
      'https://example.com',
      {},
      fetcher,
      5,
    ),
    (error) => error.name === 'TimeoutError',
  )
})

test('also stops waiting when the JSON response body is too slow', async () => {
  const fetcher = (_url, { signal }) => ({
    ok: true,
    status: 200,
    json: () =>
      new Promise((resolve, reject) => {
        signal.addEventListener(
          'abort',
          () => reject(new Error('JSON reading aborted')),
          { once: true },
        )
      }),
  })

  await assert.rejects(
    fetchJsonWithTimeout(
      'https://example.com',
      {},
      fetcher,
      5,
    ),
    (error) => error.name === 'TimeoutError',
  )
})
