// region ids must match QUESTION_BANKS in backend/main.py
export const COUNTRIES = [
  {
    code: 'CA',
    regions: [
      { id: 'ca-ab', name: 'Alberta', ready: true },
      { id: 'ca-bc', name: 'British Columbia' },
      { id: 'ca-on', name: 'Ontario' },
      { id: 'ca-qc', name: 'Québec' },
      { id: 'ca-mb', name: 'Manitoba' },
      { id: 'ca-sk', name: 'Saskatchewan' },
      { id: 'ca-ns', name: 'Nova Scotia' },
    ],
  },
  {
    code: 'US',
    regions: [
      { id: 'us-ca', name: 'California' },
      { id: 'us-tx', name: 'Texas' },
      { id: 'us-fl', name: 'Florida' },
      { id: 'us-ny', name: 'New York' },
      { id: 'us-wa', name: 'Washington' },
      { id: 'us-il', name: 'Illinois' },
    ],
  },
  {
    code: 'GB',
    regions: [
      { id: 'gb-eng', name: 'England' },
      { id: 'gb-sct', name: 'Scotland' },
      { id: 'gb-wls', name: 'Wales' },
      { id: 'gb-nir', name: 'Northern Ireland' },
    ],
  },
  {
    code: 'AU',
    regions: [
      { id: 'au-nsw', name: 'New South Wales' },
      { id: 'au-vic', name: 'Victoria' },
      { id: 'au-qld', name: 'Queensland' },
      { id: 'au-wa', name: 'Western Australia' },
    ],
  },
  {
    code: 'DE',
    regions: [
      { id: 'de-be', name: 'Berlin' },
      { id: 'de-by', name: 'München' },
      { id: 'de-hh', name: 'Hamburg' },
      { id: 'de-he', name: 'Frankfurt' },
    ],
  },
  {
    code: 'AE',
    regions: [
      { id: 'ae-du', name: 'Dubai' },
      { id: 'ae-az', name: 'Abu Dhabi' },
      { id: 'ae-sh', name: 'Sharjah' },
    ],
  },
]

export const DEFAULT_REGION = 'ca-ab'

export function findPlace(regionId) {
  for (const country of COUNTRIES) {
    const region = country.regions.find((r) => r.id === regionId)
    if (region) return { country, region }
  }
  return findPlace(DEFAULT_REGION)
}

export function countryName(code, lang) {
  try {
    return new Intl.DisplayNames([lang, 'en'], { type: 'region' }).of(code)
  } catch {
    return code
  }
}

export function getSavedRegion() {
  return findPlace(localStorage.getItem('region')).region.id
}

export function saveRegion(regionId) {
  localStorage.setItem('region', regionId)
}
