
function formatList(items) {
  if (items.length === 0) return 'no gene annotation'
  if (items.length === 1) return items[0]
  if (items.length === 2) return `${items[0]} and ${items[1]}`
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`
}

export function buildPlainLanguageExplanation({
  variantId = '',
  geneNames = [],
  diseaseLabel = 'the selected oral disease',
  evidenceCount = 0,
  evidenceSearched = false,
}) {
  const variantText = variantId
    ? `${variantId} was entered.`
    : 'A variant ID was entered.'

  const geneText =
    geneNames.length > 0
      ? `Ensembl returned gene annotations for ${formatList(geneNames)}. These annotations describe the variant's genomic context and do not establish an association with ${diseaseLabel}.`
      : 'The available variant information does not clearly list a gene, so the gene association is uncertain.'

  let evidenceText

  if (!evidenceSearched) {
    evidenceText = `A PubMed search has not yet been completed for ${diseaseLabel}. Search PubMed to look for relevant publications.`
  } else if (evidenceCount > 0) {
    evidenceText = `PubMed returned ${evidenceCount} matching citation${evidenceCount === 1 ? '' : 's'} for ${diseaseLabel}. These are search matches, not proof that the variant causes disease or that the evidence is clinically conclusive.`
  } else {
    evidenceText = `The PubMed search did not find matching records for ${diseaseLabel}. This search is insufficient to establish a strong conclusion and does not establish that no scientific evidence exists.`
  }

  return `${variantText} ${geneText} ${evidenceText} This explanation does not estimate an individual’s exact disease risk and should not be used as a diagnosis.`
}
