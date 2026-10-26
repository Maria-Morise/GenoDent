# GenoDent

GenoDent is a web app for exploring genetic variants associated with oral
diseases. It currently provides variant and literature lookup interfaces; it
does not perform scientific evidence analysis or provide clinical
interpretation.

## Technology

- JavaScript (ES modules)
- Vite for local development and production builds
- No UI framework or database is configured; the app queries the public
  Ensembl and NCBI PubMed APIs directly

## Getting started

Install the project dependencies, then start Vite's local development server:

```sh
npm install
npm run dev
```

Open the local URL printed in the terminal (usually `http://localhost:5173`).
The development server updates the page when source files are saved.

To create and locally preview a production build:

```sh
npm run build
npm run preview
```

Run the offline lookup tests with Node.js:

```sh
npm test
```

## Project structure

- `index.html` - HTML document and application mount point
- `src/main.js` - JavaScript entry point; builds the main page content
- `src/pubmed.js` - PubMed search and citation handling
- `src/style.css` - Global and page styles
- `docs/data-sources.md` - Data sources, query approach, and limitations
- `tests/` - Offline tests and a real PubMed API response fixture
- `public/` - Static files served from the site root
- `src/assets/` - Assets imported by JavaScript or stylesheets

## Development direction

The page submits the genetic variant ID field to the Ensembl REST VEP endpoint:
`GET https://rest.ensembl.org/vep/human/id/{id}?content-type=application/json`.
The response is used to display the returned variant ID, allele string,
assembly, genomic location, most severe consequence, and gene annotations
where present. No genetic information is inferred when Ensembl omits a field,
and no scientific evidence analysis is performed.

The browser calls Ensembl directly; no API key or database connection is
configured. HTTP errors, empty responses, and connection failures are reported
in the page. Ensembl's [VEP endpoint documentation](https://rest.ensembl.org/documentation/info/vep_id_get)
describes the response and parameters.

The literature search uses NCBI PubMed E-utilities. Users choose from nine
oral-condition categories with documented genetic literature, and the current
rsID is searched alongside related PubMed terms. Returned citations are
literature matches, not a scientific assessment of whether an association
exists. See
[`docs/data-sources.md`](docs/data-sources.md) for details and limitations.
