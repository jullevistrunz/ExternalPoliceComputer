;(async function () {
  const config = await getConfig()
  const language = await getLanguage()
  if (config.updateDomWithLanguageOnLoad) await updateDomWithLanguage()
})()

async function updateDomWithLanguage() {
  const language = await getLanguage()
  traverseObject(language.reports.static, (key, value, path = []) => {
    const selector = [...path, key].join('.')
    document
      .querySelectorAll(`[data-language="${selector}"]`)
      .forEach((el) => (el.innerHTML = value))
    document
      .querySelectorAll(`[data-language-title="${selector}"]`)
      .forEach((el) => (el.title = value))
  })
}

let isOnCreatePageBool = false
function isOnCreatePage() {
  return isOnCreatePageBool
}

document
  .querySelector('.listPage .createButton')
  .addEventListener('click', async function () {
    const language = await getLanguage()
    for (const iframe of topDoc.querySelectorAll('.overlay .window iframe')) {
      if (iframe.contentWindow.isOnCreatePage()) {
        showNotification(
          language.reports.notifications.createPageAlreadyOpen,
          'warning'
        )
        return
      }
    }

    document.title = language.reports.newReportTitle
    isOnCreatePageBool = true

    document.querySelector('.listPage').remove()
    document.querySelector('.createPage').classList.remove('hidden')

    document.querySelector('.createPage .typeSelector button').click()
  })

document
  .querySelectorAll('.listPage .listWrapper .typeSelector button')
  .forEach((button) =>
    button.addEventListener('click', async function () {
      button.blur()
      document
        .querySelectorAll('.listPage .listWrapper .typeSelector button')
        .forEach((btn) => btn.classList.remove('selected'))
      button.classList.add('selected')

      switch (button.dataset.type) {
        case 'incident':
          break
        case 'citation':
          break
        case 'arrest':
          break
      }
    })
  )

document
  .querySelectorAll('.createPage .typeSelector button')
  .forEach((button) =>
    button.addEventListener('click', async function () {
      button.blur()
      document
        .querySelectorAll('.createPage .typeSelector button')
        .forEach((btn) => btn.classList.remove('selected'))
      button.classList.add('selected')

      document.querySelector('.createPage .reportInformation').innerHTML = ''

      const config = await getConfig()
      const language = await getLanguage()
      const location = await (await fetch('/data/playerLocation')).json()
      const officerInformation = await (
        await fetch('/data/officerInformationData')
      ).json()

      const inGameDateArr = (
        await (await fetch('/data/currentTime')).text()
      ).split(':')
      const inGameDate = new Date()
      inGameDate.setHours(inGameDateArr[0])
      inGameDate.setMinutes(inGameDateArr[1])
      inGameDate.setSeconds(inGameDateArr[2])

      const reportId = await getReportId(button.dataset.type)

      const generalInformation = {
        time: config.useInGameTime
          ? inGameDate.toLocaleTimeString()
          : new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString(),
        reportId: reportId,
        status: 'Open',
      }

      const saveButton = document.createElement('button')
      saveButton.classList.add('saveButton')
      saveButton.innerHTML = language.reports.save
      saveButton.addEventListener('click', function () {
        saveReport(button.dataset.type)
      })
      document
        .querySelector('.createPage .reportInformation')
        .appendChild(saveButton)

      switch (button.dataset.type) {
        case 'incident':
          document
            .querySelector('.createPage .reportInformation')
            .appendChild(await getGeneralInformationSection(generalInformation))
          document
            .querySelector('.createPage .reportInformation')
            .appendChild(await getOfficerInformationSection(officerInformation))
          document
            .querySelector('.createPage .reportInformation')
            .appendChild(await getLocationSection(location))
          document
            .querySelector('.createPage .reportInformation')
            .appendChild(await getNotesSection())
          break
        case 'citation':
          break
        case 'arrest':
          break
      }
    })
  )

document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('.listPage .listWrapper .typeSelector button').click()
})

async function getReportId(type) {
  const config = await getConfig()
  const language = await getLanguage()
  const reports = await (await fetch(`/data/${type}Reports`)).json()
  const typeMap = language.reports.idTypeMap
  let id = config.reportIdFormat
  id = id.replace('{type}', typeMap[type])
  id = id.replace('{shortYear}', new Date().getFullYear().toString().slice(-2))
  id = id.replace('{year}', new Date().getFullYear())
  id = id.replace('{month}', new Date().getMonth() + 1)
  id = id.replace('{day}', new Date().getDate())
  id = id.replace(
    '{index}',
    (reports.length + 1).toString().padStart(config.reportIdIndexPad, '0')
  )
  return id
}

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
  countyInput.value = language.values[location.County] || ''
  countyInput.id = 'locationSectionCountyInput'
  countyInput.autocomplete = 'off'
  countyInput.disabled = isList
  county.appendChild(countyLabel)
  county.appendChild(countyInput)

  const inputWrapper = document.createElement('div')
  inputWrapper.classList.add('inputWrapper')
  if (isList) {
    inputWrapper.classList.add('grid')
  }

  inputWrapper.appendChild(postal)
  inputWrapper.appendChild(street)
  inputWrapper.appendChild(area)
  inputWrapper.appendChild(county)

  const sectionWrapper = document.createElement('div')
  sectionWrapper.classList.add('section')

  sectionWrapper.appendChild(title)
  sectionWrapper.appendChild(inputWrapper)

  return sectionWrapper
}

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
  if (isList) {
    inputWrapper.classList.add('grid')
  }

  inputWrapper.appendChild(firstName)
  inputWrapper.appendChild(lastName)
  inputWrapper.appendChild(badgeNumber)
  inputWrapper.appendChild(rank)
  inputWrapper.appendChild(callSign)
  inputWrapper.appendChild(agency)

  const sectionWrapper = document.createElement('div')
  sectionWrapper.classList.add('section')

  sectionWrapper.appendChild(title)
  sectionWrapper.appendChild(inputWrapper)

  return sectionWrapper
}

async function getGeneralInformationSection(
  generalInformation,
  isList = false
) {
  const language = await getLanguage()

  const title = document.createElement('div')
  if (isList) {
    title.classList.add('searchResponseSectionTitle')
  } else {
    title.classList.add('title')
  }
  title.innerHTML = language.reports.sections.generalInformation.title

  const reportId = document.createElement('div')
  reportId.classList.add('reportId')
  const reportIdLabel = document.createElement('label')
  reportIdLabel.innerHTML =
    language.reports.sections.generalInformation.reportId
  reportIdLabel.htmlFor = 'generalInformationSectionReportIdInput'
  const reportIdInput = document.createElement('input')
  reportIdInput.type = 'text'
  reportIdInput.value = generalInformation.reportId
  reportIdInput.id = 'generalInformationSectionReportIdInput'
  reportIdInput.disabled = true
  reportId.appendChild(reportIdLabel)
  reportId.appendChild(reportIdInput)

  const status = document.createElement('div')
  status.classList.add('status')
  const statusLabel = document.createElement('label')
  statusLabel.innerHTML = language.reports.sections.generalInformation.status
  const statusInput = document.createElement('div')
  statusInput.classList.add('statusInput')
  const statusClosed = document.createElement('button')
  statusClosed.innerHTML = language.values.Closed
  statusClosed.classList.add('closed')
  if (generalInformation.status == 'Closed') {
    statusClosed.classList.add('selected')
  }
  statusClosed.addEventListener('click', function () {
    statusClosed.blur()
    statusInput
      .querySelectorAll('button')
      .forEach((btn) => btn.classList.remove('selected'))
    statusClosed.classList.add('selected')
  })
  const statusOpen = document.createElement('button')
  statusOpen.innerHTML = language.values.Open
  statusOpen.classList.add('open')
  if (generalInformation.status == 'Open') {
    statusOpen.classList.add('selected')
  }
  statusOpen.addEventListener('click', function () {
    statusOpen.blur()
    statusInput
      .querySelectorAll('button')
      .forEach((btn) => btn.classList.remove('selected'))
    statusOpen.classList.add('selected')
  })
  const statusCanceled = document.createElement('button')
  statusCanceled.innerHTML = language.values.Canceled
  statusCanceled.classList.add('canceled')
  if (generalInformation.status == 'Canceled') {
    statusCanceled.classList.add('selected')
  }
  statusCanceled.addEventListener('click', function () {
    statusCanceled.blur()
    statusInput
      .querySelectorAll('button')
      .forEach((btn) => btn.classList.remove('selected'))
    statusCanceled.classList.add('selected')
  })

  status.appendChild(statusLabel)
  statusInput.appendChild(statusClosed)
  statusInput.appendChild(statusOpen)
  statusInput.appendChild(statusCanceled)
  status.appendChild(statusInput)

  const date = document.createElement('div')
  date.classList.add('date')
  const dateLabel = document.createElement('label')
  dateLabel.innerHTML = language.reports.sections.generalInformation.date
  dateLabel.htmlFor = 'generalInformationSectionDateInput'
  const dateInput = document.createElement('input')
  dateInput.type = 'text'
  dateInput.value = generalInformation.date || ''
  dateInput.id = 'generalInformationSectionDateInput'
  dateInput.autocomplete = 'off'
  dateInput.disabled = isList
  date.appendChild(dateLabel)
  date.appendChild(dateInput)

  const time = document.createElement('div')
  time.classList.add('time')
  const timeLabel = document.createElement('label')
  timeLabel.innerHTML = language.reports.sections.generalInformation.time
  timeLabel.htmlFor = 'generalInformationSectionTimeInput'
  const timeInput = document.createElement('input')
  timeInput.type = 'text'
  timeInput.value = generalInformation.time || ''
  timeInput.id = 'generalInformationSectionTimeInput'
  timeInput.autocomplete = 'off'
  timeInput.disabled = isList
  time.appendChild(timeLabel)
  time.appendChild(timeInput)

  const inputWrapper = document.createElement('div')
  inputWrapper.classList.add('inputWrapper')
  if (isList) {
    inputWrapper.classList.add('grid')
  }

  inputWrapper.appendChild(reportId)
  inputWrapper.appendChild(status)
  inputWrapper.appendChild(date)
  inputWrapper.appendChild(time)

  const sectionWrapper = document.createElement('div')
  sectionWrapper.classList.add('section')

  sectionWrapper.appendChild(title)
  sectionWrapper.appendChild(inputWrapper)

  return sectionWrapper
}

async function getNotesSection(notes, isList = false) {
  const language = await getLanguage()

  const title = document.createElement('div')
  if (isList) {
    title.classList.add('searchResponseSectionTitle')
  } else {
    title.classList.add('title')
  }
  title.innerHTML = language.reports.sections.notes
  title.style.borderBottom = 'none'
  title.style.paddingBottom = '0'

  const notesTextarea = document.createElement('textarea')
  notesTextarea.classList.add('notesTextarea')
  notesTextarea.value = notes || ''
  notesTextarea.id = 'notesSectionTextarea'

  const sectionWrapper = document.createElement('div')
  sectionWrapper.classList.add('section')

  sectionWrapper.appendChild(title)
  sectionWrapper.appendChild(notesTextarea)

  return sectionWrapper
}

async function saveReport(type) {}
