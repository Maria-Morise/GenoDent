const EUTILS_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
const MAX_RESULTS = 10

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

export function buildPubMedQuery(variantId, disease) {
  const normalizedId = variantId.trim().toLowerCase()
  if (!/^rs\d+$/.test(normalizedId)) {
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
  if (ids.length === 0) return { count, query, records: [] }

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

  return { count, query, records }
}

async function fetchJson(url, fetcher) {
  const response = await fetcher(url, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    const error = new Error(`PubMed request failed (HTTP ${response.status}).`)
    error.status = response.status
    throw error
  }

  return response.json()
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
