async function getLocationSection(location, isList = false) {
  const language = await getLanguage()

  const title = document.createElement('div')
  if (isList) {
    title.classList.add('searchResponseSectionTitle')
  } else {
    title.classList.add('title')
  }
  title.innerHTML = language.reports.sections.location.title

  const postal = document.createElement('div')
  postal.classList.add('postal')
  const postalLabel = document.createElement('label')
  postalLabel.innerHTML = language.reports.sections.location.postal
  postalLabel.htmlFor = 'locationSectionPostalInput'
  const postalInput = document.createElement('input')
  postalInput.type = 'text'
  postalInput.value = location.Postal || ''
  postalInput.id = 'locationSectionPostalInput'
  postalInput.autocomplete = 'off'
  postalInput.disabled = isList
  postal.appendChild(postalLabel)
  postal.appendChild(postalInput)

  const street = document.createElement('div')
  street.classList.add('street')
  const streetLabel = document.createElement('label')
  streetLabel.innerHTML = language.reports.sections.location.street
  streetLabel.htmlFor = 'locationSectionStreetInput'
  const streetInput = document.createElement('input')
  streetInput.type = 'text'
  streetInput.value = location.Street || ''
  streetInput.id = 'locationSectionStreetInput'
  streetInput.autocomplete = 'off'
  streetInput.disabled = isList
  street.appendChild(streetLabel)
  street.appendChild(streetInput)

  const area = document.createElement('div')
  area.classList.add('area')
  const areaLabel = document.createElement('label')
  areaLabel.innerHTML = language.reports.sections.location.area
  areaLabel.htmlFor = 'locationSectionAreaInput'
  const areaInput = document.createElement('input')
  areaInput.type = 'text'
  areaInput.value = location.Area || ''
  areaInput.id = 'locationSectionAreaInput'
  areaInput.autocomplete = 'off'
  areaInput.disabled = isList
  area.appendChild(areaLabel)
  area.appendChild(areaInput)

  const county = document.createElement('div')
  county.classList.add('county')
  const countyLabel = document.createElement('label')
  countyLabel.innerHTML = language.reports.sections.location.county
  countyLabel.htmlFor = 'locationSectionCountyInput'
  const countyInput = document.createElement('input')
  countyInput.type = 'text'
  countyInput.value = language.values[location.County] || location.County || ''
  countyInput.id = 'locationSectionCountyInput'
  countyInput.autocomplete = 'off'
  countyInput.disabled = isList
  county.appendChild(countyLabel)
  county.appendChild(countyInput)

  const inputWrapper = document.createElement('div')
  inputWrapper.classList.add('inputWrapper')
  inputWrapper.classList.add('grid')

  inputWrapper.appendChild(postal)
  inputWrapper.appendChild(street)
  inputWrapper.appendChild(area)
  inputWrapper.appendChild(county)

  const sectionWrapper = document.createElement('div')
  sectionWrapper.classList.add('section')
  if (isList) sectionWrapper.classList.add('searchResponseWrapper')

  sectionWrapper.appendChild(title)
  sectionWrapper.appendChild(inputWrapper)

  return sectionWrapper
}
