async function getOfficerInformationSection(
  officerInformation,
  isList = false
) {
  const language = await getLanguage()

  const title = document.createElement('div')
  if (isList) {
    title.classList.add('searchResponseSectionTitle')
  } else {
    title.classList.add('title')
  }
  title.innerHTML = language.reports.sections.officerInformation.title

  const firstName = document.createElement('div')
  firstName.classList.add('firstName')
  const firstNameLabel = document.createElement('label')
  firstNameLabel.innerHTML =
    language.reports.sections.officerInformation.firstName
  firstNameLabel.htmlFor = 'officerInformationSectionFirstNameInput'
  const firstNameInput = document.createElement('input')
  firstNameInput.type = 'text'
  firstNameInput.value = officerInformation.firstName || ''
  firstNameInput.id = 'officerInformationSectionFirstNameInput'
  firstNameInput.autocomplete = 'off'
  firstNameInput.disabled = isList
  firstName.appendChild(firstNameLabel)
  firstName.appendChild(firstNameInput)

  const lastName = document.createElement('div')
  lastName.classList.add('lastName')
  const lastNameLabel = document.createElement('label')
  lastNameLabel.innerHTML =
    language.reports.sections.officerInformation.lastName
  lastNameLabel.htmlFor = 'officerInformationSectionLastNameInput'
  const lastNameInput = document.createElement('input')
  lastNameInput.type = 'text'
  lastNameInput.value = officerInformation.lastName || ''
  lastNameInput.id = 'officerInformationSectionLastNameInput'
  lastNameInput.autocomplete = 'off'
  lastNameInput.disabled = isList
  lastName.appendChild(lastNameLabel)
  lastName.appendChild(lastNameInput)

  const badgeNumber = document.createElement('div')
  badgeNumber.classList.add('badgeNumber')
  const badgeNumberLabel = document.createElement('label')
  badgeNumberLabel.innerHTML =
    language.reports.sections.officerInformation.badgeNumber
  badgeNumberLabel.htmlFor = 'officerInformationSectionBadgeNumberInput'
  const badgeNumberInput = document.createElement('input')
  badgeNumberInput.type = 'number'
  badgeNumberInput.value = officerInformation.badgeNumber || ''
  badgeNumberInput.id = 'officerInformationSectionBadgeNumberInput'
  badgeNumberInput.autocomplete = 'off'
  badgeNumberInput.disabled = isList
  badgeNumber.appendChild(badgeNumberLabel)
  badgeNumber.appendChild(badgeNumberInput)

  const rank = document.createElement('div')
  rank.classList.add('rank')
  const rankLabel = document.createElement('label')
  rankLabel.innerHTML = language.reports.sections.officerInformation.rank
  rankLabel.htmlFor = 'officerInformationSectionRankInput'
  const rankInput = document.createElement('input')
  rankInput.type = 'text'
  rankInput.value = officerInformation.rank || ''
  rankInput.id = 'officerInformationSectionRankInput'
  rankInput.autocomplete = 'off'
  rankInput.disabled = isList
  rank.appendChild(rankLabel)
  rank.appendChild(rankInput)

  const callSign = document.createElement('div')
  callSign.classList.add('callSign')
  const callSignLabel = document.createElement('label')
  callSignLabel.innerHTML =
    language.reports.sections.officerInformation.callSign
  callSignLabel.htmlFor = 'officerInformationSectionCallSignInput'
  const callSignInput = document.createElement('input')
  callSignInput.type = 'text'
  callSignInput.value = officerInformation.callSign || ''
  callSignInput.id = 'officerInformationSectionCallSignInput'
  callSignInput.autocomplete = 'off'
  callSignInput.disabled = isList
  callSign.appendChild(callSignLabel)
  callSign.appendChild(callSignInput)

  const agency = document.createElement('div')
  agency.classList.add('agency')
  const agencyLabel = document.createElement('label')
  agencyLabel.innerHTML = language.reports.sections.officerInformation.agency
  agencyLabel.htmlFor = 'officerInformationSectionAgencyInput'
  const agencyInput = document.createElement('input')
  agencyInput.type = 'text'
  agencyInput.value = officerInformation.agency || ''
  agencyInput.id = 'officerInformationSectionAgencyInput'
  agencyInput.autocomplete = 'off'
  agencyInput.disabled = isList
  agency.appendChild(agencyLabel)
  agency.appendChild(agencyInput)

  const inputWrapper = document.createElement('div')
  inputWrapper.classList.add('inputWrapper')
  inputWrapper.classList.add('grid')

  inputWrapper.appendChild(firstName)
  inputWrapper.appendChild(lastName)
  inputWrapper.appendChild(badgeNumber)
  inputWrapper.appendChild(rank)
  inputWrapper.appendChild(callSign)
  inputWrapper.appendChild(agency)

  const sectionWrapper = document.createElement('div')
  sectionWrapper.classList.add('section')
  if (isList) sectionWrapper.classList.add('searchResponseWrapper')

  sectionWrapper.appendChild(title)
  sectionWrapper.appendChild(inputWrapper)

  return sectionWrapper
}
