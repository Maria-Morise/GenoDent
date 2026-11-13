import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { buildPlainLanguageExplanation } from '../src/explanation.js'
import {
  buildPubMedQuery,
  PubMedInputError,
  searchPubMed,
  SUPPORTED_DISEASES,
} from '../src/pubmed.js'

const searchFixture = JSON.parse(
  await readFile(
    new URL('./fixtures/pubmed-periodontal-search-example.json', import.meta.url),
    'utf8',
  ),
)
const summaryFixture = JSON.parse(
  await readFile(
    new URL('./fixtures/pubmed-summary-example.json', import.meta.url),
    'utf8',
  ),
)

function jsonResponse(payload, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  }
}

test('builds a disease-specific PubMed query for an rsID', () => {
  assert.match(
    buildPubMedQuery('RS1800629', 'periodontal'),
    /^rs1800629\[All Fields\] AND \(.*periodontitis.*periodontal disease/s,
  )
  assert.match(buildPubMedQuery('rs1800629', 'oralCancer'), /mouth neoplasms/)
})

test('supports the oral conditions with verified genetic literature', () => {
  assert.equal(SUPPORTED_DISEASES.length, 9)
  for (const disease of SUPPORTED_DISEASES) {
    assert.match(
      buildPubMedQuery('rs1800629', disease.id),
      /^rs1800629\[All Fields\] AND \(.+\)$/,
    )
  }
})

test('retrieves and normalizes citations from saved real PubMed responses', async () => {
  const responses = [searchFixture, summaryFixture]
  const requestUrls = []
  const result = await searchPubMed('rs1800629', 'periodontal', async (url) => {
    requestUrls.push(new URL(url))
    return jsonResponse(responses.shift())
  })

  assert.equal(result.count, 15)
  assert.equal(result.records.length, 1)
  assert.equal(result.records[0].pmid, '26750615')
  assert.match(result.records[0].title, /rs1800629/)
  assert.equal(requestUrls.length, 2)
  assert.equal(requestUrls[0].pathname.endsWith('/esearch.fcgi'), true)
  assert.equal(requestUrls[1].pathname.endsWith('/esummary.fcgi'), true)
  assert.equal(requestUrls[1].searchParams.get('id'), '26750615')
})

test('returns an empty result without requesting citation details', async () => {
  let requestCount = 0
  const result = await searchPubMed('rs28934568', 'oralCancer', async () => {
    requestCount += 1
    return jsonResponse({
      esearchresult: { count: '0', idlist: [] },
    })
  })

  assert.equal(result.count, 0)
  assert.deepEqual(result.records, [])
  assert.equal(requestCount, 1)
})

test('rejects non-rsID input before sending a request', async () => {
  let requestCount = 0

  await assert.rejects(
    searchPubMed('not-an-rsid', 'periodontal', async () => {
      requestCount += 1
    }),
    PubMedInputError,
  )
  assert.equal(requestCount, 0)
})

test('reports PubMed HTTP errors', async () => {
  await assert.rejects(
    searchPubMed('rs1800629', 'periodontal', async () =>
      jsonResponse({}, 429),
    ),
    (error) => error.status === 429,
  )
})

test('reports malformed PubMed search responses', async () => {
  await assert.rejects(
    searchPubMed('rs1800629', 'periodontal', async () =>
      jsonResponse({ unexpected: true }),
    ),
    /unexpected search response/,
  )
})

test('explains findings in simple language with uncertainty if no evidence is available', () => {
  const explanation = buildPlainLanguageExplanation({
    variantId: 'rs28934568',
    geneNames: ['MMP9'],
    diseaseLabel: 'periodontal disease',
    evidenceCount: 0,
  })

  assert.match(explanation, /rs28934568 was entered/i)
  assert.match(explanation, /MMP9/i)
  assert.match(explanation, /insufficient|not enough evidence/i)
  assert.match(explanation, /exact disease risk|diagnosis/i)
})

test('explains the available evidence without claiming a proven association', () => {
  const explanation = buildPlainLanguageExplanation({
    variantId: 'rs1800629',
    geneNames: ['TNF'],
    diseaseLabel: 'oral cancer',
    evidenceCount: 3,
  })

  assert.match(explanation, /3 matching citations/i)
  assert.match(explanation, /search matches, not proof/i)
  assert.match(explanation, /not estimate an individual’s exact disease risk/i)
})
