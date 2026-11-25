const oralConditions = [
  {
    name: 'Dental caries',
    description:
      'Dental caries, commonly called tooth decay, occurs when acids produced by bacteria damage the hard tissues of a tooth.',
    signs: [
      'White, brown or dark spots on a tooth',
      'Sensitivity to sweet, hot or cold foods and drinks',
      'Toothache or a visible cavity',
    ],
    imageSource: 'https://www.nhs.uk/conditions/tooth-decay/',
    sourceName: 'NHS – Tooth decay',
  },
  {
    name: 'Periodontal disease',
    description:
      'Periodontal disease affects the gums and the supporting tissues around the teeth. It can progress from gum inflammation to damage of the supporting structures.',
    signs: [
      'Red, swollen or tender gums',
      'Bleeding when brushing or flossing',
      'Persistent bad breath',
      'Gum recession or loose teeth in more advanced disease',
    ],
    imageSource: 'https://www.nhs.uk/conditions/gum-disease/',
    sourceName: 'NHS – Gum disease',
  },
  {
    name: 'Peri-implantitis',
    description:
      'Peri-implantitis is an inflammatory condition affecting the tissues around a dental implant. It involves inflammation and progressive loss of supporting bone.',
    signs: [
      'Redness or swelling around an implant',
      'Bleeding around the implant',
      'Discharge or pus around the implant',
      'Changes in the gum level around the implant',
    ],
    imageSource: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11126371/',
    sourceName: 'Clinical review – Peri-implant diseases',
  },
  {
    name: 'Oral lichen planus',
    description:
      'Oral lichen planus is a chronic inflammatory condition affecting the lining of the mouth. It can produce white, lace-like patterns or painful red and ulcerated areas.',
    signs: [
      'White lace-like lines inside the cheeks',
      'Red or sore areas of the oral lining',
      'Burning or discomfort when eating',
      'Ulcerated areas in some cases',
    ],
    imageSource:
      'https://www.gla.ac.uk/schools/medicine/dental/oralcancer/clinicalphotographs/clinicalphotographs-page3/',
    sourceName: 'University of Glasgow – Clinical photographs',
  },
  {
    name: 'Recurrent aphthous stomatitis',
    description:
      'Recurrent aphthous stomatitis causes repeated episodes of painful ulcers inside the mouth. These ulcers are not the same as cold sores.',
    signs: [
      'Small, round or oval ulcers',
      'A pale or yellowish centre with a red border',
      'Pain when eating, drinking or speaking',
      'Repeated episodes of ulceration',
    ],
    imageSource:
      'https://www.gla.ac.uk/schools/medicine/dental/oralcancer/clinicalphotographs/clinicalphotographs-page3/',
    sourceName: 'University of Glasgow – Clinical photographs',
  },
  {
    name: 'Oral leukoplakia',
    description:
      'Oral leukoplakia describes a persistent white patch in the mouth that cannot be classified as another specific condition. Some lesions may contain potentially precancerous changes, so professional assessment is important.',
    signs: [
      'A persistent white patch in the mouth',
      'A patch that cannot be wiped away',
      'A smooth, thickened or irregular surface',
      'Sometimes no pain or other symptoms',
    ],
    imageSource: 'https://opmdcare.com/atlas-photos/',
    sourceName: 'OPMDCARE – Clinical photo atlas',
  },
  {
    name: 'Oral submucous fibrosis',
    description:
      'Oral submucous fibrosis is a chronic condition in which the tissues inside the mouth become stiff and less flexible. It is associated with areca nut and betel quid use.',
    signs: [
      'Pale or blanched areas inside the mouth',
      'A burning sensation, especially with spicy foods',
      'Tightness or stiffness of the oral tissues',
      'Reduced ability to open the mouth',
    ],
    imageSource: 'https://screening.iarc.fr/atlasoral_list.php?cat=A5&lang=1',
    sourceName: 'IARC – Oral submucous fibrosis image atlas',
  },
  {
    name: 'Oral cancer',
    description:
      'Oral cancer can affect the tongue, lips, gums, floor of the mouth and other areas of the oral cavity. Early assessment of persistent or unusual changes is important.',
    signs: [
      'An ulcer that does not heal',
      'A persistent red or white patch',
      'A lump in the mouth or on the lip',
      'Persistent pain or difficulty swallowing',
    ],
    imageSource: 'https://www.nhs.uk/conditions/mouth-cancer/symptoms/',
    sourceName: 'NHS – Mouth cancer symptoms',
  },
  {
    name: 'Temporomandibular disorders',
    description:
      'Temporomandibular disorders affect the jaw joint and the muscles involved in jaw movement. They can cause pain and difficulties with normal jaw function.',
    signs: [
      'Pain around the jaw joint or chewing muscles',
      'Jaw stiffness',
      'Limited mouth opening or jaw locking',
      'Painful clicking or popping when moving the jaw',
    ],
    imageSource: 'https://www.nidcr.nih.gov/health-info/tmd',
    sourceName: 'NIDCR – Temporomandibular disorders',
  },
]

export function renderEducationGuide(container) {
  if (!container) return

  oralConditions.forEach((condition) => {
    const card = document.createElement('article')
    card.className = 'condition-card'

    const heading = document.createElement('h2')
    heading.textContent = condition.name

    const description = document.createElement('p')
    description.className = 'condition-description'
    description.textContent = condition.description

    const signsHeading = document.createElement('h3')
    signsHeading.textContent = 'Common signs and symptoms'

    const signsList = document.createElement('ul')

    condition.signs.forEach((sign) => {
      const item = document.createElement('li')
      item.textContent = sign
      signsList.append(item)
    })

    const imageLink = document.createElement('a')
    imageLink.className = 'condition-image-link'
    imageLink.href = condition.imageSource
    imageLink.target = '_blank'
    imageLink.rel = 'noopener noreferrer'
    imageLink.textContent = 'View clinical images and information'

    const source = document.createElement('p')
    source.className = 'condition-source'
    source.textContent = `Educational source: ${condition.sourceName}`

    card.append(
      heading,
      description,
      signsHeading,
      signsList,
      imageLink,
      source,
    )

    container.append(card)
  })
}
