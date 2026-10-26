# GenoDent data sources

Last checked: 2026-10-26. Both services are queried live by the browser. Their
records can change over time; the test fixtures are snapshots and are never
used as application results.

## Variant details: Ensembl VEP

GenoDent uses the official Ensembl Variant Effect Predictor endpoint:

- Request: `GET https://rest.ensembl.org/vep/human/id/{rsID}?content-type=application/json`
- Documentation: [VEP lookup by variant identifier](https://rest.ensembl.org/documentation/info/vep_id_get)
- Data displayed when present: variant ID, allele string, assembly, genomic
  location, most severe consequence, gene ID/symbol, and transcript consequence
  terms.

The fields returned depend on the variant. A missing gene annotation is shown
as unavailable; it is not inferred from another source. This lookup does not
establish a disease association or provide clinical interpretation.

## Literature search: PubMed via NCBI E-utilities

The user selects an oral condition. GenoDent combines the entered rsID with a
disease-specific PubMed query and requests up to 10 relevance-sorted records:

1. `esearch.fcgi` searches the PubMed database and returns matching PMIDs.
2. `esummary.fcgi` retrieves citation metadata for those PMIDs.

Official references:

- [NCBI E-utilities API documentation](https://www.ncbi.nlm.nih.gov/books/NBK25500/)
- [E-utilities help](https://www.ncbi.nlm.nih.gov/books/NBK25497/)
- [PubMed](https://pubmed.ncbi.nlm.nih.gov/)

The rsID is searched in PubMed's all-fields index. The disease side of the
search uses condition terms in titles/abstracts and, where specified, MeSH
terms:

- Dental caries: `dental caries`, `caries`, or `tooth decay`.
- Periodontal disease: `periodontitis` in title/abstract, `periodontal disease`
  in title/abstract, or `periodontal diseases` as a MeSH term.
- Peri-implantitis: peri-implantitis and peri-implant disease terminology.
- Oral lichen planus: oral lichen planus terminology.
- Recurrent aphthous stomatitis: recurrent aphthous stomatitis, recurrent
  aphthous ulcer, or recurrent oral ulceration.
- Oral leukoplakia: oral leukoplakia terminology.
- Oral submucous fibrosis: oral submucous fibrosis.
- Oral cancer: `oral cancer`, `oral carcinoma`, or `oral squamous cell
  carcinoma` in title/abstract, or `mouth neoplasms` as a MeSH term.
- Temporomandibular disorders: temporomandibular disorders (MeSH), disorder,
  or joint disorder terminology.

### Why these conditions are included

The supported categories were checked against PubMed for condition-specific
genetic association studies, reviews, meta-analyses, or genome-wide
association studies on 2026-10-26. These publications establish that genetic
literature exists for each topic; they do **not** establish that any rsID
entered into GenoDent is associated with that condition:

- Dental caries: [PMID 34311721](https://pubmed.ncbi.nlm.nih.gov/34311721/)
  (genome-wide association study).
- Periodontal disease: [PMID 26750615](https://pubmed.ncbi.nlm.nih.gov/26750615/)
  (meta-analysis of rs1800629 and aggressive periodontitis susceptibility).
- Peri-implantitis: [PMID 36503538](https://pubmed.ncbi.nlm.nih.gov/36503538/)
  (meta-analysis of an OPG polymorphism).
- Oral lichen planus: [PMID 28094099](https://pubmed.ncbi.nlm.nih.gov/28094099/)
  (IL-10 polymorphism meta-analysis).
- Recurrent aphthous stomatitis: [PMID 30341786](https://pubmed.ncbi.nlm.nih.gov/30341786/)
  (case-control study of gene variability).
- Oral leukoplakia: [PMID 16519766](https://pubmed.ncbi.nlm.nih.gov/16519766/)
  (GSTM1 polymorphism study).
- Oral submucous fibrosis: [PMID 14675133](https://pubmed.ncbi.nlm.nih.gov/14675133/)
  (MICA gene polymorphism study).
- Oral cancer: [PMID 14662415](https://pubmed.ncbi.nlm.nih.gov/14662415/)
  (GSTM1 polymorphism and oral squamous cell carcinoma).
- Temporomandibular disorders: [PMID 38943858](https://pubmed.ncbi.nlm.nih.gov/38943858/)
  (systematic literature review of genetic factors).

This is a documented initial set, not a claim that it covers every oral
condition or every relevant paper. Additional categories should be added only
after their disease-specific genetic literature is checked.

For each returned citation the app displays available title, authors, journal,
publication date, PMID, and DOI, with a link to the PubMed record. The app
shows at most 10 records at a time and links to the full PubMed query when more
records match. An empty result is described as insufficient evidence *from
this search*, not evidence that no studies exist.

### Limitations

- A PubMed search match is not proof of an association. GenoDent does not
  assess the study methods, findings, direction, or quality.
- Search terms can miss papers that use different terminology, omit the rsID,
  or discuss a variant under another identifier.
- This is a literature discovery step only. It does not calculate personal
  disease risk or make a clinical recommendation.
- Requests are made directly from the browser without an API key. Network
  errors and HTTP errors are reported; NCBI may also apply request rate limits.
- No abstract or full text is retrieved or interpreted by this feature.

### Test snapshot

`tests/fixtures/pubmed-periodontal-search-example.json` and
`tests/fixtures/pubmed-summary-example.json` are unmodified JSON responses
retrieved from NCBI E-utilities on 2026-10-26. They support offline tests only.
The example search query was for `rs1800629` and periodontal terms; it is not
used as a default, hard-coded, or live result in GenoDent.

The app's example `rs28934568` returned no PubMed records in the periodontal
disease and oral cancer searches when checked on 2026-10-26. This is a
time-bound result for those searches, not a conclusion that no evidence exists.
