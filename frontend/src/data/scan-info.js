/**
 * Disease and pest knowledge base for scan results.
 * Keys match the predicted_class values returned by the backend.
 */

export const DISEASE_INFO = {
  Early_Blight: {
    name: 'Early Blight',
    pathogen: 'Alternaria solani',
    description:
      'Early blight is a common fungal disease that affects potato foliage, stems, and tubers. It typically appears as dark brown to black lesions with concentric rings (target-like pattern) on older, lower leaves first.',
    symptoms: [
      'Dark brown circular lesions with concentric rings on leaves',
      'Yellowing of tissue surrounding lesions',
      'Lesions may coalesce, causing large areas of dead tissue',
      'Premature defoliation starting from lower leaves',
      'Dark, sunken lesions on tubers with a leathery texture',
    ],
    treatment: [
      'Apply fungicides such as chlorothalonil, mancozeb, or azoxystrobin at first sign of disease',
      'Rotate crops — avoid planting potatoes in the same field for at least 2–3 years',
      'Remove and destroy infected plant debris after harvest',
      'Ensure adequate spacing between plants for air circulation',
      'Avoid overhead irrigation; use drip irrigation to keep foliage dry',
      'Use certified disease-free seed tubers',
    ],
    severity: 'Moderate to High',
  },

  Healthy: {
    name: 'Healthy',
    pathogen: 'None',
    description:
      'The leaf appears healthy with no visible signs of disease or pest damage. The plant is in good condition.',
    symptoms: ['No disease symptoms detected'],
    treatment: [
      'Continue regular monitoring for early detection of any issues',
      'Maintain proper irrigation and fertilization schedules',
      'Practice crop rotation to prevent soil-borne diseases',
      'Keep the field free of weeds that may harbor pests',
    ],
    severity: 'None',
  },

  Late_Blight: {
    name: 'Late Blight',
    pathogen: 'Phytophthora infestans',
    description:
      'Late blight is a devastating oomycete disease that can destroy entire potato crops within days under favorable conditions (cool and wet weather). It was responsible for the Irish Potato Famine of the 1840s.',
    symptoms: [
      'Water-soaked, dark green to brown lesions on leaf tips and edges',
      'White, fuzzy mold growth on the underside of leaves in humid conditions',
      'Rapidly expanding lesions that turn black and necrotic',
      'Stem lesions that are dark brown and firm',
      'Reddish-brown, granular rot on tubers extending inward',
    ],
    treatment: [
      'Apply systemic fungicides (metalaxyl, cymoxanil) combined with contact fungicides (mancozeb) immediately',
      'Remove and destroy all infected plants to slow spread',
      'Avoid overhead irrigation; water early in the day',
      'Improve air circulation through wider plant spacing',
      'Monitor weather forecasts — apply preventive fungicides before cool, wet periods',
      'Use late blight-resistant potato varieties where available',
      'Destroy volunteer potato plants and cull piles',
    ],
    severity: 'Very High — requires immediate action',
  },

  Leaf_Roll: {
    name: 'Leaf Roll',
    pathogen: 'Potato Leafroll Virus (PLRV)',
    description:
      'Potato Leaf Roll is a viral disease transmitted primarily by the green peach aphid (Myzus persicae). It causes upward rolling of the lower leaves and can significantly reduce tuber yield and quality.',
    symptoms: [
      'Upward rolling and curling of lower leaves',
      'Leaves become leathery, stiff, and pale green to yellow',
      'Purple or reddish discoloration on leaf margins',
      'Stunted plant growth in severe infections',
      'Net necrosis (brown streaking) inside tubers',
    ],
    treatment: [
      'Control aphid vectors using insecticides (imidacloprid, thiamethoxam) or biological control',
      'Use certified virus-free seed potatoes',
      'Remove and destroy infected plants promptly (roguing)',
      'Plant resistant or tolerant potato varieties',
      'Use mineral oil sprays to reduce aphid transmission',
      'Eliminate nearby weed hosts that harbor aphids or the virus',
    ],
    severity: 'High — no cure once infected; prevention is key',
  },

  Verticillium_Wilt: {
    name: 'Verticillium Wilt',
    pathogen: 'Verticillium dahliae / Verticillium albo-atrum',
    description:
      'Verticillium wilt is a soil-borne fungal disease that invades through the roots and colonizes the vascular system, blocking water and nutrient transport. It persists in soil for many years.',
    symptoms: [
      'Yellowing and wilting of lower leaves, often one-sided',
      'V-shaped yellow lesions at leaf margins',
      'Brown discoloration of vascular tissue when stems are cut',
      'Premature senescence and early vine death',
      'Reduced tuber size and discolored vascular ring in tubers',
    ],
    treatment: [
      'Practice long crop rotations (4+ years) with non-host crops like cereals',
      'Use Verticillium-resistant potato varieties',
      'Soil fumigation with metam sodium or chloropicrin in severe cases',
      'Improve soil drainage and avoid waterlogged conditions',
      'Remove and destroy crop residues after harvest',
      'Green manure crops (broccoli, mustard) can reduce soil inoculum through biofumigation',
      'Ensure balanced fertilization — avoid excessive nitrogen',
    ],
    severity: 'High — soil pathogen persists for years',
  },
}

export const PEST_INFO = {
  'Agrotis ipsilon (Hufnagel)': {
    name: 'Black Cutworm',
    scientificName: 'Agrotis ipsilon (Hufnagel)',
    description:
      'The black cutworm is a nocturnal moth whose larvae (caterpillars) cut young plants at or below the soil surface. They are major pests of potato and other crops worldwide.',
    damage: [
      'Larvae cut stems at ground level, causing plants to topple',
      'Feeding on roots and tubers below soil surface',
      'Irregular holes in leaves from young larval feeding',
      'Significant stand reduction in seedling-stage crops',
    ],
    treatment: [
      'Apply soil-directed insecticides (chlorpyrifos, cypermethrin) at planting',
      'Use pheromone traps to monitor adult moth populations',
      'Cultivate soil before planting to expose and kill overwintering larvae and pupae',
      'Remove weeds and crop residues that provide shelter',
      'Apply Bacillus thuringiensis (Bt) for biological control of young larvae',
      'Flood irrigation can drown larvae in the soil',
    ],
  },

  'Amrasca devastans (Distant)': {
    name: 'Cotton Jassid / Leafhopper',
    scientificName: 'Amrasca devastans (Distant)',
    description:
      'The cotton jassid is a sap-sucking leafhopper that causes "hopper burn" — yellowing and curling of leaf margins. It is a significant pest across South Asia on potato and cotton.',
    damage: [
      'Yellowing and downward curling of leaf edges (hopper burn)',
      'Stunted plant growth due to continuous sap feeding',
      'Reduced photosynthesis leading to lower tuber yields',
      'Potential transmission of plant viruses',
    ],
    treatment: [
      'Spray systemic insecticides such as imidacloprid or thiamethoxam',
      'Use yellow sticky traps for population monitoring',
      'Introduce natural predators like ladybugs and lacewings',
      'Apply neem-based biopesticides as an organic alternative',
      'Avoid excessive nitrogen fertilization which promotes lush growth attractive to jassids',
      'Plant resistant varieties where available',
    ],
  },

  'Aphis gossypii Glover': {
    name: 'Cotton Aphid / Melon Aphid',
    scientificName: 'Aphis gossypii Glover',
    description:
      'The cotton aphid is a polyphagous sap-sucking insect found worldwide. On potato, it can cause direct feeding damage and transmit viral diseases including Potato Virus Y (PVY).',
    damage: [
      'Yellowing and curling of young leaves from sap extraction',
      'Honeydew secretion leading to sooty mold growth on leaves',
      'Stunted plant growth and reduced vigor',
      'Transmission of viral diseases (PVY, PLRV)',
    ],
    treatment: [
      'Apply systemic insecticides (imidacloprid, acetamiprid) early in the season',
      'Encourage natural enemies: ladybird beetles, parasitic wasps, lacewings',
      'Use reflective mulches to repel aphids from crop rows',
      'Apply mineral oil sprays to reduce virus transmission',
      'Remove weed hosts around field margins',
      'Use neem oil or insecticidal soap for organic management',
    ],
  },

  'Bemisia tabaci (Gennadius)': {
    name: 'Silverleaf Whitefly',
    scientificName: 'Bemisia tabaci (Gennadius)',
    description:
      'The silverleaf whitefly is one of the most destructive agricultural pests globally. It feeds on plant sap and transmits numerous plant viruses. It reproduces rapidly in warm conditions.',
    damage: [
      'Leaf yellowing, wilting, and premature drop from sap removal',
      'Honeydew excretion leading to sooty mold on leaves and tubers',
      'Silvering of leaves (silverleaf symptoms)',
      'Transmission of begomoviruses and other plant viruses',
      'Reduced photosynthesis and plant vigor',
    ],
    treatment: [
      'Apply neonicotinoid insecticides (imidacloprid, thiamethoxam) as soil drench or foliar spray',
      'Use yellow sticky traps for mass trapping and monitoring',
      'Introduce biological control agents: Encarsia formosa, Eretmocerus eremicus',
      'Apply insect growth regulators (buprofezin, pyriproxyfen)',
      'Install fine-mesh insect screens in greenhouse settings',
      'Rotate insecticide classes to prevent resistance development',
    ],
  },

  'Brachytrypes portentosus Lichtenstein': {
    name: 'Large Brown Cricket',
    scientificName: 'Brachytrypes portentosus Lichtenstein',
    description:
      'The large brown cricket is a burrowing insect that lives underground and emerges at night to feed. It causes significant damage to potato tubers and root systems.',
    damage: [
      'Feeding damage on tubers causing irregular holes and cavities',
      'Severing of roots and underground stems',
      'Seedling destruction by cutting stems at soil level',
      'Soil disturbance from extensive burrowing tunnels',
    ],
    treatment: [
      'Apply soil insecticides (chlorpyrifos, fipronil) in cricket-infested areas',
      'Use bait formulations with bran mixed with insecticide placed near burrow entrances',
      'Flood fields to flush crickets out of burrows',
      'Deep ploughing to destroy burrows and expose eggs',
      'Use light traps at night to attract and capture adult crickets',
      'Encourage natural predators: birds, lizards, and parasitic wasps',
    ],
  },

  'Epilachna vigintioctopunctata (Fabricius)': {
    name: 'Hadda Beetle / 28-spotted Lady Beetle',
    scientificName: 'Epilachna vigintioctopunctata (Fabricius)',
    description:
      'Unlike most ladybugs, the hadda beetle is herbivorous and a serious pest of potato and other solanaceous crops. Both adults and larvae skeletonize leaves by scraping the surface tissue.',
    damage: [
      'Skeletonized leaves — upper or lower epidermis scraped off, leaving a "windowpane" appearance',
      'Severe defoliation reducing photosynthetic capacity',
      'Reduced tuber yield from extensive leaf damage',
      'Larvae and adults both feed on foliage',
    ],
    treatment: [
      'Hand-pick adults and egg masses from leaves (bright yellow egg clusters)',
      'Spray carbaryl, malathion, or neem-based insecticides',
      'Introduce parasitoid wasps (Pediobius foveolatus) for biological control',
      'Remove and destroy crop residues after harvest to eliminate overwintering sites',
      'Crop rotation with non-solanaceous crops',
      'Intercropping with repellent crops like garlic or onion',
    ],
  },

  'Myzus persicae (Sulzer)': {
    name: 'Green Peach Aphid',
    scientificName: 'Myzus persicae (Sulzer)',
    description:
      'The green peach aphid is the most important vector of Potato Leafroll Virus (PLRV) and Potato Virus Y (PVY). It is one of the most polyphagous aphid species, feeding on hundreds of plant species.',
    damage: [
      'Leaf curling and distortion from sap feeding',
      'Transmission of PLRV, PVY, and other viral diseases (primary concern)',
      'Honeydew secretion promoting sooty mold',
      'Stunted growth in heavy infestations',
    ],
    treatment: [
      'Apply systemic insecticides at planting (imidacloprid soil drench)',
      'Use mineral oil sprays (2–3%) to interfere with virus transmission',
      'Monitor with green and yellow pan traps; treat when thresholds are exceeded',
      'Encourage aphid predators: hoverflies, ladybugs, parasitic wasps (Aphidius colemani)',
      'Use certified virus-free seed tubers to break the infection cycle',
      'Remove volunteer potatoes and solanaceous weeds near fields',
      'Apply reflective (silver) mulch to repel colonizing aphids',
    ],
  },

  'Phthorimaea operculella (Zeller)': {
    name: 'Potato Tuber Moth',
    scientificName: 'Phthorimaea operculella (Zeller)',
    description:
      'The potato tuber moth is one of the most damaging pests of stored and field potatoes worldwide. Larvae mine into leaves and bore into tubers, causing significant quality and storage losses.',
    damage: [
      'Leaf mining — larvae create serpentine or blotch mines in leaves',
      'Tuber boring — larvae penetrate through eyes and lenticels, creating tunnels filled with frass',
      'Secondary infections (bacterial and fungal) enter through larval tunnels in tubers',
      'Major post-harvest storage losses if tubers are not protected',
    ],
    treatment: [
      'Harvest tubers promptly at maturity; do not leave exposed in the field',
      'Store tubers in cool, well-ventilated conditions (below 10°C if possible)',
      'Apply Bacillus thuringiensis (Bt) or granulosis virus (GV) in storage facilities',
      'Use pheromone traps in fields and storage to monitor and mass-trap males',
      'Hill up soil around potato plants to prevent moths from reaching tubers',
      'Apply insecticides (spinosad, indoxacarb) when moth populations are high in the field',
      'Cover stored tubers with dried Lantana or eucalyptus leaves as a deterrent',
    ],
  },

  noninsect: {
    name: 'No Insect Detected',
    scientificName: 'N/A',
    description:
      'The image does not appear to contain a recognizable insect. It may be a leaf, soil, debris, or another non-insect object.',
    damage: [],
    treatment: [
      'If you expected an insect detection, try uploading a clearer image with the insect in focus',
      'Ensure the image has good lighting and the subject is centered',
    ],
  },
}

/**
 * Look up info for a predicted class.
 * @param {'leaf'|'pest'} mode
 * @param {string} predictedClass
 * @returns {object|null}
 */
export function getClassInfo(mode, predictedClass) {
  if (!predictedClass) return null
  if (mode === 'leaf') return DISEASE_INFO[predictedClass] ?? null
  return PEST_INFO[predictedClass] ?? null
}
