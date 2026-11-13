# GenoDent

GenoDent is a web app for exploring genetic variants and literature searches related to oral diseases. It retrieves variant annotations from Ensembl and searches PubMed for matching publications. It does not determine whether a variant causes a disease, assess the quality of scientific evidence, or provide clinical interpretation.

## Technology

- JavaScript (ES modules)
- Vite for local development and production builds
- No UI framework or database is configured; the app queries the public Ensembl and NCBI PubMed APIs directly.

## Getting started

Install the project dependencies, then start the local development server:

```sh
npm install
npm run dev
```

Open the local URL printed in the terminal (usually `http://localhost:5173`).

To create and locally preview a production build:

```sh
npm run build
npm run preview
```

Run the offline tests:

```sh
npm test
```

## Project structure

- `index.html` - HTML document and application mount point
- `src/main.js` - Main application interface and functionality
- `src/pubmed.js` - PubMed search and citation handling
- `src/explanation.js` - Generates plain-language findings summaries
- `src/style.css` - Application styling
- `docs/data-sources.md` - Data sources, query approach, and limitations
- `tests/` - Offline tests and saved PubMed response fixtures
- `public/` - Static files served from the site root
- `src/assets/` - Application assets

## Current functionality

### Variant lookup

The app submits the entered variant ID to the Ensembl Variant Effect Predictor endpoint:

`GET https://rest.ensembl.org/vep/human/id/{id}?content-type=application/json`

When returned by Ensembl, the app displays the variant ID, allele string, assembly, genomic location, most severe consequence, and gene annotations.

### Literature search

The app uses NCBI PubMed E-utilities to search for publications matching the entered rsID and one of nine supported oral-condition categories.

Returned citations are literature search matches, not proof of a genetic association.

### Plain-language findings summary

The "What this means" section generates an explanation using the variant ID, gene annotations, selected oral condition, and number of PubMed search matches.

It explains when gene information is unavailable and warns that search matches do not prove causation or clinical significance. It does not estimate personal disease risk or provide a diagnosis.

## Limitations

- Ensembl annotations do not independently establish an association with an oral disease.
- PubMed search results have not been assessed for study quality or whether they establish an association.
- Search terms can miss relevant publications.
- The app does not calculate personal disease risk or make clinical recommendations.
- Network errors and service rate limits may affect results.

See `docs/data-sources.md` for further information about the data sources and their limitations.