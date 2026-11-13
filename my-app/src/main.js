import './style.css'
import { buildPlainLanguageExplanation } from './explanation.js'
import {
  PubMedInputError,
  searchPubMed,
  SUPPORTED_DISEASES,
} from './pubmed.js'

document.querySelector('#app').innerHTML = `
  <header class="site-header">
    <a class="brand" href="/" aria-label="GenoDent home">GenoDent</a>
  </header>
  <main class="page-content">
    <p class="eyebrow">Genetics and oral health</p>
    <h1>Welcome to GenoDent</h1>
    <p class="intro">
      A place to explore genetic variants associated with oral diseases.
    </p>
    <form id="variant-form" class="variant-field">
      <label for="variant-id">Genetic variant ID</label>
      <input
        id="variant-id"
        name="variantId"
        type="text"
        placeholder="e.g. rs28934568"
        required
        autocomplete="off"
        spellcheck="false"
      />
      <button type="submit">Look up variant</button>
    </form>
    <p id="lookup-status" class="lookup-status" role="status" aria-live="polite"></p>
    <section
      id="variant-results"
      class="variant-results"
      aria-label="Variant lookup results"
    ></section>
    <section class="findings-summary" aria-labelledby="findings-heading">
      <h2 id="findings-heading">What this means</h2>
      <p id="findings-summary-text" class="findings-summary-text">
        Enter a variant ID and search the literature to see the current findings and uncertainty.
      </p>
    </section>
    <section class="evidence-section" aria-labelledby="evidence-heading">
      <h2 id="evidence-heading">Scientific literature</h2>
      <p class="evidence-intro">
        Search PubMed for publications mentioning this rsID and an oral disease.
        Search matches are not proof of an association.
      </p>
      <form id="evidence-form" class="evidence-form">
        <label for="oral-disease">Oral disease</label>
        <select id="oral-disease" name="disease"></select>
        <button type="submit">Search PubMed</button>
      </form>
      <p
        id="evidence-status"
        class="lookup-status"
        role="status"
        aria-live="polite"
      ></p>
      <section
        id="evidence-results"
        class="evidence-results"
        aria-label="PubMed literature search results"
      ></section>
    </section>
  </main>
  <footer class="site-footer">
    <p>GenoDent is an early-stage project.</p>
  </footer>
`

const ENSEMBL_VEP_URL = 'https://rest.ensembl.org/vep/human/id/'
const variantForm = document.querySelector('#variant-form')
const variantInput = document.querySelector('#variant-id')
const lookupStatus = document.querySelector('#lookup-status')
const variantResults = document.querySelector('#variant-results')
const evidenceForm = document.querySelector('#evidence-form')
const evidenceStatus = document.querySelector('#evidence-status')
const evidenceResults = document.querySelector('#evidence-results')
const findingsSummaryText = document.querySelector('#findings-summary-text')
let variantLookupSequence = 0
let evidenceSearchSequence = 0
const appState = {
  variantId: '',
  geneNames: [],
  diseaseLabel: 'the selected oral disease',
  evidenceCount: 0,
}

SUPPORTED_DISEASES.forEach(({ id, label }) => {
  const option = document.createElement('option')
  option.value = id
  option.textContent = label
  evidenceForm.elements.disease.append(option)
})

variantInput.addEventListener('input', () => {
  variantLookupSequence += 1
  evidenceSearchSequence += 1
  lookupStatus.textContent = ''
  variantResults.replaceChildren()
  evidenceStatus.textContent = ''
  evidenceResults.replaceChildren()
  appState.variantId = ''
  appState.geneNames = []
  appState.evidenceCount = 0
  updateFindingsSummary()
})

evidenceForm.elements.disease.addEventListener('change', () => {
  evidenceSearchSequence += 1
  evidenceStatus.textContent = ''
  evidenceResults.replaceChildren()
  appState.evidenceCount = 0
  appState.diseaseLabel = getDiseaseLabel(evidenceForm.elements.disease.value)
  updateFindingsSummary()
})

variantForm.addEventListener('submit', async (event) => {
  event.preventDefault()

  const variantId = variantInput.value.trim()
  if (!variantId) return

  const requestSequence = ++variantLookupSequence
  variantForm.querySelector('button').disabled = true
  lookupStatus.textContent = `Looking up ${variantId} with Ensembl...`
  variantResults.replaceChildren()

  try {
    const response = await fetch(
      `${ENSEMBL_VEP_URL}${encodeURIComponent(variantId)}?content-type=application/json`,
      { headers: { Accept: 'application/json' } },
    )
    if (requestSequence !== variantLookupSequence) return

    if (!response.ok) {
      lookupStatus.textContent = getRequestErrorMessage(response.status, variantId)
      return
    }

    const data = await response.json()
    if (requestSequence !== variantLookupSequence) return
    if (!Array.isArray(data) || data.length === 0) {
      lookupStatus.textContent = `Ensembl returned no variant data for "${variantId}".`
      appState.variantId = variantId
      appState.geneNames = []
      appState.evidenceCount = 0
      updateFindingsSummary()
      return
    }

    data.forEach((variant) => variantResults.append(createVariantResult(variant)))
    appState.variantId = variantId
    appState.geneNames = collectGeneNames(data)
    appState.evidenceCount = appState.evidenceCount || 0
    lookupStatus.textContent = `Ensembl returned ${data.length} variant record${data.length === 1 ? '' : 's'} for ${variantId}.`
    variantResults.append(createSourceNote())
    updateFindingsSummary()
  } catch (error) {
    console.error('Ensembl variant lookup failed:', error)
    if (requestSequence !== variantLookupSequence) return
    lookupStatus.textContent =
      'Could not retrieve variant information from Ensembl. Check your connection and try again.'
  } finally {
    variantForm.querySelector('button').disabled = false
  }
})

evidenceForm.addEventListener('submit', async (event) => {
  event.preventDefault()

  const variantId = variantInput.value.trim()
  const disease = evidenceForm.elements.disease.value
  const submitButton = evidenceForm.querySelector('button')
  const requestSequence = ++evidenceSearchSequence

  evidenceResults.replaceChildren()
  if (!variantId) {
    evidenceStatus.textContent = 'Enter an rsID before searching PubMed.'
    variantInput.focus()
    return
  }

  submitButton.disabled = true
  evidenceStatus.textContent = `Searching PubMed for ${variantId} and ${getDiseaseLabel(disease)}...`

  try {
    const result = await searchPubMed(variantId, disease)
    if (requestSequence !== evidenceSearchSequence) return

    appState.diseaseLabel = getDiseaseLabel(disease)
    appState.evidenceCount = result.count
    if (result.count === 0) {
      evidenceStatus.textContent =
        `No PubMed records matched this ${appState.diseaseLabel} search for ${variantId}. ` +
        'Evidence is insufficient based on this search; this does not establish that no evidence exists.'
      updateFindingsSummary()
      return
    }

    if (result.records.length === 0) {
      evidenceStatus.textContent =
        `PubMed reported ${result.count} matching record${result.count === 1 ? '' : 's'}, but citation details were unavailable.`
      evidenceResults.append(createPubMedSearchLink(result.query))
      updateFindingsSummary()
      return
    }

    result.records.forEach((record) => {
      evidenceResults.append(createCitationCard(record))
    })

    const shownCount = result.records.length
    evidenceStatus.textContent =
      `PubMed returned ${shownCount} of ${result.count} matching citation${result.count === 1 ? '' : 's'}. ` +
      'These search matches have not been assessed for study quality or whether findings establish an association.'
    evidenceResults.append(createPubMedSearchLink(result.query))
    updateFindingsSummary()
  } catch (error) {
    console.error('PubMed literature search failed:', error)
    if (requestSequence !== evidenceSearchSequence) return
    appState.evidenceCount = 0
    if (error instanceof PubMedInputError) {
      evidenceStatus.textContent = error.message
    } else if (error.status === 429) {
      evidenceStatus.textContent =
        'PubMed is temporarily rate-limiting requests. Please try again shortly.'
    } else if (error.status) {
      evidenceStatus.textContent =
        `PubMed could not complete this search (HTTP ${error.status}). Please try again later.`
    } else {
      evidenceStatus.textContent =
        'Could not retrieve literature from PubMed. Check your connection and try again.'
    }
    updateFindingsSummary()
  } finally {
    submitButton.disabled = false
  }
})

function updateFindingsSummary() {
  findingsSummaryText.textContent = buildPlainLanguageExplanation({
    variantId: appState.variantId,
    geneNames: appState.geneNames,
    diseaseLabel: appState.diseaseLabel,
    evidenceCount: appState.evidenceCount,
  })
}

function getRequestErrorMessage(status, variantId) {
  if (status === 400) {
    return `Ensembl could not process "${variantId}" as a variant identifier.`
  }
  if (status === 404) {
    return `Ensembl did not find a variant record for "${variantId}".`
  }
  if (status === 429) {
    return 'Ensembl is temporarily rate-limiting requests. Please try again shortly.'
  }
  return `Ensembl could not retrieve this variant (HTTP ${status}). Please try again later.`
}

function getDiseaseLabel(disease) {
  return SUPPORTED_DISEASES.find((item) => item.id === disease)?.label.toLowerCase() ??
    'selected oral disease'
}

function collectGeneNames(variants = []) {
  return [...new Set(
    variants.flatMap((variant) =>
      collectGenes(variant.transcript_consequences)
        .map((gene) => gene.symbol)
        .filter(Boolean),
    ),
  )]
}

function createCitationCard(record) {
  const article = document.createElement('article')
  article.className = 'citation-card'

  const title = createTextElement('h3', record.title || 'Title unavailable')
  article.append(title)

  const metadata = [
    record.authors.length > 0 ? record.authors.join(', ') : null,
    [record.journal, record.publicationDate].filter(Boolean).join(' · '),
    record.pmid ? `PMID: ${record.pmid}` : null,
    record.doi ? `DOI: ${record.doi}` : null,
  ].filter(Boolean)

  metadata.forEach((value) => {
    article.append(createTextElement('p', value))
  })

  if (record.pmid) {
    const link = document.createElement('a')
    link.href = `https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(record.pmid)}/`
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.textContent = 'View record on PubMed'
    article.append(link)
  }

  return article
}

function createPubMedSearchLink(query) {
  const link = document.createElement('a')
  link.className = 'pubmed-search-link'
  link.href = `https://pubmed.ncbi.nlm.nih.gov/?term=${encodeURIComponent(query)}`
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.textContent = 'View this search on PubMed'
  return link
}

function createVariantResult(variant) {
  const article = document.createElement('article')
  article.className = 'variant-result'
  article.append(createTextElement('h2', variant.id || 'Variant record'))

  const details = document.createElement('dl')
  const location =
    variant.seq_region_name != null &&
    variant.start != null &&
    variant.end != null
      ? `${variant.seq_region_name}:${variant.start}-${variant.end}`
      : null

  appendDetail(details, 'Alleles', variant.allele_string)
  appendDetail(details, 'Assembly', variant.assembly_name)
  appendDetail(details, 'Location', location)
  appendDetail(details, 'Most severe consequence', variant.most_severe_consequence)
  if (details.childElementCount > 0) article.append(details)

  const genes = collectGenes(variant.transcript_consequences)
  const geneHeading = createTextElement('h3', 'Associated genes')
  article.append(geneHeading)

  if (genes.length === 0) {
    article.append(
      createTextElement('p', 'Ensembl did not return a gene annotation for this variant.'),
    )
    return article
  }

  const geneList = document.createElement('ul')
  geneList.className = 'gene-list'
  genes.forEach((gene) => {
    const item = document.createElement('li')
    item.append(createTextElement('strong', gene.symbol || 'Gene annotation'))
    if (gene.id) item.append(createTextElement('span', gene.id))
    if (gene.consequences.size > 0) {
      item.append(createTextElement('span', [...gene.consequences].join(', ')))
    }
    geneList.append(item)
  })
  article.append(geneList)

  return article
}

function collectGenes(transcriptConsequences = []) {
  const genes = new Map()

  transcriptConsequences.forEach((transcript) => {
    const geneId = transcript.gene_id
    const geneSymbol = transcript.gene_symbol
    const key = geneId || geneSymbol
    if (!key) return

    if (!genes.has(key)) {
      genes.set(key, {
        id: geneId,
        symbol: geneSymbol,
        consequences: new Set(),
      })
    }

    transcript.consequence_terms?.forEach((term) => {
      genes.get(key).consequences.add(term)
    })
  })

  return [...genes.values()]
}

function appendDetail(list, label, value) {
  if (value == null || value === '') return
  list.append(
    createTextElement('dt', label),
    createTextElement('dd', String(value)),
  )
}

function createTextElement(tagName, text) {
  const element = document.createElement(tagName)
  element.textContent = text
  return element
}

function createSourceNote() {
  const note = document.createElement('p')
  note.className = 'source-note'
  note.append(document.createTextNode('Variant annotations provided by '))

  const link = document.createElement('a')
  link.href = 'https://rest.ensembl.org/documentation/info/vep_id_get'
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  link.textContent = 'Ensembl VEP'
  note.append(link, document.createTextNode('.'))

  return note
}
