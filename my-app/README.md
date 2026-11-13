# GenoDent 

**Explore genetic variant annotations and scientific literature related to oral health.**

🌐 **Live application:** [https://geno-dent.vercel.app/](https://geno-dent.vercel.app/)

GenoDent is a web application that allows users to explore genetic variants potentially relevant to oral health. It retrieves genetic variant annotations from Ensembl and searches scientific publications through PubMed using a variant identifier (rsID) and a selected oral condition.

The goal is to make genetic information and scientific literature more accessible through a simple interface and plain-language explanations.

**Important:** GenoDent is an exploratory research tool. It does not establish genetic causation, assess the quality of scientific evidence, provide clinical interpretation, diagnose diseases, or calculate personal disease risk.

## Features

### 1. Genetic variant lookup

- Accepts genetic variant identifiers in rsID format (e.g. `rs1800629`).
- Retrieves variant annotations using the Ensembl Variant Effect Predictor API.
- Displays available information such as:
  - Variant identifier
  - Alleles
  - Genome assembly
  - Genomic location
  - Most severe consequence
  - Gene annotations

### 2. Scientific literature search

Searches PubMed for publications matching the entered rsID and one of nine supported oral conditions:

1. Dental caries
2. Periodontal disease
3. Peri-implantitis
4. Oral lichen planus
5. Recurrent aphthous stomatitis
6. Oral leukoplakia
7. Oral submucous fibrosis
8. Oral cancer
9. Temporomandibular disorders

The application displays matching publication information and links to the corresponding PubMed records.

### 3. Plain-language explanations

The application generates a simple explanation of the available findings, including:

- What the variant annotations mean.
- Whether gene annotations are available.
- Whether a PubMed search has been completed.
- How many matching publications were returned.
- Why literature search matches should not be interpreted as proof of a genetic association.

### 4. Input validation and error handling

- Checks that variant identifiers follow the expected rsID format.
- Handles unsuccessful variant lookups.
- Distinguishes between searches that have not been performed and searches that return no matching publications.
- Provides messages for API errors and unsuccessful requests.

## Technologies

- **JavaScript (ES modules):** Application functionality.
- **Vite:** Development server and production build.
- **HTML and CSS:** Application structure and styling.
- **Ensembl REST API:** Genetic variant annotations.
- **NCBI PubMed E-utilities API:** Scientific literature searches.
- **Node.js test runner:** Automated tests.
- **GitHub:** Version control and source code.
- **Vercel:** Application deployment and hosting.

The application does not currently use a database or a backend server. It communicates directly with the public Ensembl and NCBI PubMed APIs.

## Data sources

### Ensembl

The application uses the Ensembl Variant Effect Predictor endpoint:

`https://rest.ensembl.org/vep/human/id/{id}?content-type=application/json`

Ensembl provides information about genetic variants and their potential genomic consequences.

Gene annotations describe genomic context. They do not independently establish an association with an oral disease.

### NCBI PubMed

The application uses NCBI PubMed E-utilities to search scientific publications.

Searches combine the entered rsID with terms related to the selected oral condition.

A matching publication does not necessarily demonstrate that the variant is associated with the disease. Search results have not been independently assessed for study quality or strength of evidence.

For additional information, see [`docs/data-sources.md`](docs/data-sources.md).

## Getting started

### Requirements

- Node.js
- npm

### Installation

Clone the repository:

```bash
git clone https://github.com/Maria-Morise/GenoDent.git
```

Navigate to the application directory:

```bash
cd GenoDent/my-app
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL printed in the terminal, usually:

`http://localhost:5173/`

## Testing

Run the automated tests:

```bash
npm test
```

Create a production build:

```bash
npm run build
```

Locally preview the production build:

```bash
npm run preview
```

The project includes automated tests covering PubMed query construction, supported oral conditions, citation handling, invalid inputs, API errors, empty search results, and plain-language explanations.

## Deployment

GenoDent is deployed using Vercel.

**Live application:** [https://geno-dent.vercel.app/](https://geno-dent.vercel.app/)

The application is built using Vite with the following production settings:

- Framework: Vite
- Root directory: `my-app`
- Build command: `npm run build`
- Output directory: `dist`

## Project structure

```text
my-app/
├── index.html
├── package.json
├── src/
│   ├── main.js
│   ├── pubmed.js
│   ├── explanation.js
│   ├── style.css
│   └── assets/
├── public/
├── docs/
│   └── data-sources.md
└── tests/
    └── pubmed.test.js
```

## Limitations and responsible use

- Ensembl annotations do not establish an association between a genetic variant and an oral disease.
- PubMed search results are literature matches, not confirmed genetic associations.
- Search terms may miss relevant publications.
- Returned publications have not been evaluated for study quality or clinical significance.
- The application does not provide diagnosis, treatment recommendations, or personal disease-risk predictions.
- Results depend on the availability and reliability of external services.

GenoDent is intended for educational and exploratory research purposes, not as a clinical decision-making tool.

---

**Repository:** [github.com/Maria-Morise/GenoDent](https://github.com/Maria-Morise/GenoDent)

**Live application:** [geno-dent.vercel.app](https://geno-dent.vercel.app/)
