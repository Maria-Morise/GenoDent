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
}) {
  const variantText = variantId ? `${variantId} was entered.` : 'A variant ID was entered.'

  const geneText =
    geneNames.length > 0
      ? `The available variant information links this variant to ${formatList(geneNames)}.`
      : 'The available variant information does not clearly list a gene, so the gene association is uncertain.'

  const evidenceText =
    evidenceCount > 0
      ? `PubMed returned ${evidenceCount} matching citation${evidenceCount === 1 ? '' : 's'} for ${diseaseLabel}. These are search matches, not proof that the variant causes disease or that the evidence is clinically conclusive.`
      : `PubMed did not return enough evidence for ${diseaseLabel}. The current search results are insufficient to support a strong conclusion about relevance, and they do not rule out future findings.`

  return `${variantText} ${geneText} ${evidenceText} This explanation does not estimate an individual’s exact disease risk and should not be used as a diagnosis.`
}
