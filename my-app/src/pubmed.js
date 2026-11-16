import { fetchJsonWithTimeout } from './fetch-with-timeout.js'

const EUTILS_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
const MAX_RESULTS = 10
const CACHE_TTL_MS = 5 * 60 * 1000
const MAX_CACHE_ENTRIES = 100

const searchCache = new Map()

export const SUPPORTED_DISEASES = [
  {
    id: 'caries',
    label: 'Dental caries',
    searchTerms:
      '"dental caries"[Title/Abstract] OR caries[Title/Abstract] OR "tooth decay"[Title/Abstract]',
  },
  {
    id: 'periodontal',
    label: 'Periodontal disease',
    searchTerms:
      'periodontitis[Title/Abstract] OR "periodontal disease"[Title/Abstract] OR "periodontal diseases"[MeSH Terms]',
  },
  {
    id: 'periImplantitis',
    label: 'Peri-implantitis',
    searchTerms:
      '"peri-implantitis"[Title/Abstract] OR periimplantitis[Title/Abstract] OR "peri-implant disease"[Title/Abstract] OR "peri-implant diseases"[Title/Abstract]',
  },
  {
    id: 'oralLichenPlanus',
    label: 'Oral lichen planus',
    searchTerms:
      '"oral lichen planus"[Title/Abstract] OR "lichen planus, oral"[Title/Abstract]',
  },
  {
    id: 'aphthousStomatitis',
    label: 'Recurrent aphthous stomatitis',
    searchTerms:
      '"recurrent aphthous stomatitis"[Title/Abstract] OR "recurrent aphthous ulcer"[Title/Abstract] OR "recurrent oral ulceration"[Title/Abstract]',
  },
  {
    id: 'oralLeukoplakia',
    label: 'Oral leukoplakia',
    searchTerms:
      '"oral leukoplakia"[Title/Abstract] OR "leukoplakia, oral"[Title/Abstract]',
  },
  {
    id: 'oralSubmucousFibrosis',
    label: 'Oral submucous fibrosis',
    searchTerms: '"oral submucous fibrosis"[Title/Abstract]',
  },
  {
    id: 'oralCancer',
    label: 'Oral cancer',
    searchTerms:
      '"oral cancer"[Title/Abstract] OR "oral carcinoma"[Title/Abstract] OR "oral squamous cell carcinoma"[Title/Abstract] OR "mouth neoplasms"[MeSH Terms]',
  },
  {
    id: 'temporomandibularDisorders',
    label: 'Temporomandibular disorders',
    searchTerms:
      '"temporomandibular disorders"[MeSH Terms] OR "temporomandibular disorder"[Title/Abstract] OR "temporomandibular disorders"[Title/Abstract] OR "temporomandibular joint disorder"[Title/Abstract]',
  },
]

const DISEASE_BY_ID = new Map(
  SUPPORTED_DISEASES.map((disease) => [disease.id, disease]),
)

export class PubMedInputError extends Error {
  constructor(message) {
    super(message)
    this.name = 'PubMedInputError'
  }
}

export function isValidRsId(variantId) {
  return typeof variantId === 'string' && /^rs\d+$/i.test(variantId.trim())
}

export function buildPubMedQuery(variantId, disease) {
  const normalizedId = variantId.trim().toLowerCase()

  if (!isValidRsId(variantId)) {
    throw new PubMedInputError(
      'Enter a variant identifier in rsID format, such as rs28934568.',
    )
  }

  const selectedDisease = DISEASE_BY_ID.get(disease)
  if (!selectedDisease) {
    throw new PubMedInputError('Choose a supported oral disease.')
  }

  return `${normalizedId}[All Fields] AND (${selectedDisease.searchTerms})`
}

export async function searchPubMed(variantId, disease, fetcher = fetch) {
  const query = buildPubMedQuery(variantId, disease)

  // Reuse a recent result if the same search was already completed.
  const cached = searchCache.get(query)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.result
  }

  if (cached) {
    searchCache.delete(query)
  }

  const searchParams = new URLSearchParams({
    db: 'pubmed',
    term: query,
    retmode: 'json',
    retmax: String(MAX_RESULTS),
    sort: 'relevance',
  })
  const searchData = await fetchJson(
    `${EUTILS_BASE_URL}/esearch.fcgi?${searchParams}`,
    fetcher,
  )
  const searchResult = searchData.esearchresult

  if (
    !searchResult ||
    !Array.isArray(searchResult.idlist) ||
    !/^\d+$/.test(searchResult.count)
  ) {
    throw new Error('PubMed returned an unexpected search response.')
  }

  const count = Number(searchResult.count)
  const ids = searchResult.idlist
  if (ids.length === 0) {
    const result = { count, query, records: [] }
    cacheSearchResult(query, result)
    return result
  }

  const summaryParams = new URLSearchParams({
    db: 'pubmed',
    id: ids.join(','),
    retmode: 'json',
  })
  const summaryData = await fetchJson(
    `${EUTILS_BASE_URL}/esummary.fcgi?${summaryParams}`,
    fetcher,
  )
  const summaryResult = summaryData.result

  if (!summaryResult || !Array.isArray(summaryResult.uids)) {
    throw new Error('PubMed returned an unexpected citation response.')
  }

  const records = summaryResult.uids
    .map((id) => summaryResult[id])
    .filter(Boolean)
    .map(normalizeCitation)

  const result = { count, query, records }
  cacheSearchResult(query, result)

  return result
}

function cacheSearchResult(query, result) {
  // Keep the cache limited to avoid unlimited memory growth.
  if (searchCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = searchCache.keys().next().value
    searchCache.delete(oldestKey)
  }

  searchCache.set(query, {
    result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  })
}

const MIN_REQUEST_INTERVAL_MS = 350
let lastRequestStartedAt = 0
let requestQueue = Promise.resolve()

function fetchJson(url, fetcher) {
  const request = requestQueue.then(async () => {
    const elapsed = Date.now() - lastRequestStartedAt
    const waitTime = Math.max(0, MIN_REQUEST_INTERVAL_MS - elapsed)

    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime))
    }

    lastRequestStartedAt = Date.now()

    return performFetchJson(url, fetcher)
  })

  // Keep the queue usable even if an individual request fails.
  requestQueue = request.catch(() => {})

  return request
}

async function performFetchJson(url, fetcher) {
  const { response, data } = await fetchJsonWithTimeout(
    url,
    {
      headers: { Accept: 'application/json' },
    },
    fetcher,
  )

  if (!response.ok) {
    const error = new Error(`PubMed request failed (HTTP ${response.status}).`)
    error.status = response.status
    throw error
  }

  return data
}

function normalizeCitation(citation) {
  const doi = citation.articleids?.find((articleId) => articleId.idtype === 'doi')
    ?.value

  return {
    pmid: citation.uid,
    title: citation.title,
    journal: citation.fulljournalname || citation.source,
    publicationDate: citation.pubdate,
    authors: Array.isArray(citation.authors)
      ? citation.authors.map((author) => author.name).filter(Boolean)
      : [],
    doi,
  }
}
