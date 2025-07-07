;(async function () {
  const config = await getConfig()
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

document
  .querySelector('.listPage .createButton')
  .addEventListener('click', async function () {
    const language = await getLanguage()
    for (const iframe of topDoc.querySelectorAll('.overlay .window iframe')) {
      if (iframe.contentWindow.reportIsOnCreatePage()) {
        showNotification(language.reports.notifications.createPageAlreadyOpen)
        return
      }
    }

    document.title = language.reports.newReportTitle
    reportIsOnCreatePageBool = true

    document.querySelector('.listPage').classList.add('hidden')
    document.querySelector('.listPage .reportInformation').innerHTML = ''
    document.querySelector('.createPage').classList.remove('hidden')

    document.querySelector('.createPage .typeSelector button').click()
  })

document
  .querySelectorAll('.listPage .listWrapper .typeSelector button')
  .forEach((button) =>
    button.addEventListener('click', async function () {
      if (button.classList.contains('loading')) return
      showLoadingOnButton(button)
      button.blur()
      document
        .querySelectorAll('.listPage .listWrapper .typeSelector button')
        .forEach((btn) => btn.classList.remove('selected'))
      button.classList.add('selected')

      document.querySelector('.listPage .reportsList').innerHTML = ''

      const language = await getLanguage()

      let reports = await (
        await fetch(`/data/${button.dataset.type}Reports`)
      ).json()
      reports = reports.reverse()

      const filterElement = document.createElement('div')
      filterElement.classList.add('filter')

      const filterTitle = document.createElement('div')
      filterTitle.classList.add('title')
      filterTitle.innerHTML = language.reports.list.filter.title

      const filterInput = document.createElement('input')
      filterInput.id = 'reportsListFilterInput'
      filterInput.type = 'text'
      filterInput.placeholder = language.reports.list.filter.searchPlaceholder
      filterInput.addEventListener('input', async function () {
        await applyFilter()
      })

      const statusButtonWrapper = document.createElement('div')
      statusButtonWrapper.classList.add('buttonWrapper')

      const closedButton = document.createElement('button')
      closedButton.innerHTML = language.reports.statusMap[0]
      closedButton.dataset.status = 0
      closedButton.classList.add('selected')

      const openButton = document.createElement('button')
      openButton.innerHTML = language.reports.statusMap[1]
      openButton.dataset.status = 1
      openButton.classList.add('selected')

      const canceledButton = document.createElement('button')
      canceledButton.innerHTML = language.reports.statusMap[2]
      canceledButton.dataset.status = 2

      statusButtonWrapper.appendChild(closedButton)
      statusButtonWrapper.appendChild(openButton)
      statusButtonWrapper.appendChild(canceledButton)

      for (const button of statusButtonWrapper.querySelectorAll('button')) {
        button.addEventListener('click', async function () {
          button.blur()
          button.classList.toggle('selected')
          await applyFilter()
        })
      }

      filterElement.appendChild(filterTitle)
      filterElement.appendChild(filterInput)
      filterElement.appendChild(statusButtonWrapper)

      if (reports.length < 1) {
        document.querySelector('.listPage .reportsList').innerHTML +=
          language.reports.list.empty
      } else {
        document
          .querySelector('.listPage .reportsList')
          .appendChild(filterElement)

        await applyFilter()
      }

      async function applyFilter() {
        const newReports = []
        function addToNewReports(report) {
          if (!newReports.includes(report)) {
            newReports.push(report)
          }
        }
        function removeFromNewReports(report) {
          const index = newReports.indexOf(report)
          if (index > -1) newReports.splice(index, 1)
        }
        for (const report of reports) {
          if (
            report.OffenderPedName?.toLowerCase().includes(
              filterInput.value.toLowerCase()
            ) ||
            report.OffenderVehicleLicensePlate?.toLowerCase().includes(
              filterInput.value.toLowerCase()
            ) ||
            report.Id.toLowerCase().includes(filterInput.value.toLowerCase()) ||
            new Date(report.TimeStamp)
              .toLocaleDateString()
              .toLowerCase()
              .includes(filterInput.value.toLowerCase()) ||
            `${report.Location.Postal} ${report.Location.Street}`
              .toLowerCase()
              .includes(filterInput.value.toLowerCase()) ||
            report.Location.Area.toLowerCase().includes(
              filterInput.value.toLowerCase()
            )
          ) {
            addToNewReports(report)
          }

          if (report.OffenderPedsNames) {
            for (const pedName of report.OffenderPedsNames) {
              if (
                pedName.toLowerCase().includes(filterInput.value.toLowerCase())
              ) {
                addToNewReports(report)
                break
              }
            }
          }

          if (report.WitnessPedsNames) {
            for (const pedName of report.WitnessPedsNames) {
              if (
                pedName.toLowerCase().includes(filterInput.value.toLowerCase())
              ) {
                addToNewReports(report)
                break
              }
            }
          }

          for (const statusButton of statusButtonWrapper.querySelectorAll(
            'button'
          )) {
            if (
              !statusButton.classList.contains('selected') &&
              report.Status == statusButton.dataset.status
            ) {
              removeFromNewReports(report)
            }
          }
        }
        await renderReports(newReports, button.dataset.type)
      }

      hideLoadingOnButton(button)
    })
  )

async function renderReports(reports, type) {
  const language = await getLanguage()

  document
    .querySelectorAll('.listPage .reportsList .listElement')
    .forEach((el) => el.remove())

  for (const report of reports) {
    const listElement = document.createElement('div')
    listElement.classList.add('listElement')

    const infoWrapper = document.createElement('div')
    infoWrapper.classList.add('infoWrapper')

    const iDElement = document.createElement('div')
    iDElement.classList.add('id')
    iDElement.innerHTML = `${language.reports.list.reportId}: <span>${report.Id}</span>`

    const dateElement = document.createElement('div')
    dateElement.innerHTML = `${language.reports.list.date}: <span>${new Date(
      report.TimeStamp
    ).toLocaleDateString()}</span>`

    const locationElement = document.createElement('div')
    locationElement.innerHTML = `${language.reports.list.location}: <span>${report.Location.Postal} ${report.Location.Street}, ${report.Location.Area}</span>`

    const textWrapper = document.createElement('div')
    textWrapper.appendChild(iDElement)
    textWrapper.appendChild(dateElement)
    textWrapper.appendChild(locationElement)
    textWrapper.classList.add('textWrapper')

    switch (type) {
      case 'incident':
        const involvedPartiesElement = document.createElement('div')
        const involvedParties = [
          ...report.OffenderPedsNames,
          ...report.WitnessPedsNames,
        ]
        involvedPartiesElement.innerHTML = `${
          language.reports.list.involvedParties
        }: <span>${involvedParties.join(', ')}</span>`

        if (involvedParties.length > 1)
          textWrapper.appendChild(involvedPartiesElement)
        break
      case 'citation':
      case 'arrest':
        const offenderElement = document.createElement('div')
        offenderElement.innerHTML = `${language.reports.list.offender}: <span>${report.OffenderPedName}</span>`

        const vehicleElement = document.createElement('div')
        vehicleElement.innerHTML = `${language.reports.list.vehicle}: <span>${report.OffenderVehicleLicensePlate}</span>`

        if (report.OffenderPedName) textWrapper.appendChild(offenderElement)
        if (report.OffenderVehicleLicensePlate)
          textWrapper.appendChild(vehicleElement)
        break
    }

    const statusElement = document.createElement('div')
    statusElement.classList.add('status')
    statusElement.dataset.status = report.Status
    const statusColorMap = {
      0: 'success',
      1: 'info',
      2: 'error',
    }
    statusElement.style.backgroundColor = `var(--color-${
      statusColorMap[report.Status]
    }-half)`
    statusElement.style.borderColor = `var(--color-${
      statusColorMap[report.Status]
    })`
    statusElement.innerHTML = language.reports.statusMap[report.Status]

    infoWrapper.appendChild(textWrapper)
    infoWrapper.appendChild(statusElement)

    const buttonWrapper = document.createElement('div')
    buttonWrapper.classList.add('buttonWrapper')

    const viewButton = document.createElement('button')
    viewButton.classList.add('viewButton')
    viewButton.innerHTML = language.reports.list.viewButton

    const editButton = document.createElement('button')
    editButton.classList.add('editButton')
    editButton.innerHTML = language.reports.list.editButton

    buttonWrapper.appendChild(viewButton)
    buttonWrapper.appendChild(editButton)

    listElement.appendChild(infoWrapper)
    listElement.appendChild(buttonWrapper)

    document.querySelector('.listPage .reportsList').appendChild(listElement)
  }
}

document
  .querySelector('.createPage .cancelButton')
  .addEventListener('click', function () {
    document.querySelector('.createPage').classList.add('hidden')
    document.querySelector('.createPage .reportInformation').innerHTML = ''
    document.querySelector('.listPage').classList.remove('hidden')
    reportIsOnCreatePageBool = false
  })

document
  .querySelector('.createPage .saveButton')
  .addEventListener('click', async function () {
    await saveReport(
      document.querySelector('.createPage .typeSelector .selected').dataset.type
    )
  })

document
  .querySelectorAll('.createPage .typeSelector button')
  .forEach((button) =>
    button.addEventListener('click', async function () {
      if (button.classList.contains('loading')) return
      showLoadingOnButton(button)
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

      const reportId = await generateReportId(button.dataset.type)

      const generalInformation = {
        time: config.useInGameTime
          ? inGameDate.toLocaleTimeString()
          : new Date().toLocaleTimeString(),
        date: new Date().toLocaleDateString(),
        reportId: reportId,
        status: 1,
      }

      document
        .querySelector('.createPage .reportInformation')
        .appendChild(await getGeneralInformationSection(generalInformation))
      document
        .querySelector('.createPage .reportInformation')
        .appendChild(await getOfficerInformationSection(officerInformation))
      document
        .querySelector('.createPage .reportInformation')
        .appendChild(await getLocationSection(location))

      switch (button.dataset.type) {
        case 'incident':
          document
            .querySelector('.createPage .reportInformation')
            .appendChild(
              await getMultipleNameInputsSection(
                language.reports.sections.incident.titleOffenders,
                language.reports.sections.incident.labelOffenders,
                language.reports.sections.incident.addOffender,
                language.reports.sections.incident.removeOffender
              )
            )
          document
            .querySelector('.createPage .reportInformation')
            .appendChild(
              await getMultipleNameInputsSection(
                language.reports.sections.incident.titleWitnesses,
                language.reports.sections.incident.labelWitnesses,
                language.reports.sections.incident.addWitness,
                language.reports.sections.incident.removeWitness
              )
            )
          break
        case 'citation':
        case 'arrest':
          document
            .querySelector('.createPage .reportInformation')
            .appendChild(await getOffenderSection())
          document
            .querySelector('.createPage .reportInformation')
            .appendChild(await getCitationArrestSection(button.dataset.type))
          break
      }

      document
        .querySelector('.createPage .reportInformation')
        .appendChild(await getNotesSection())

      hideLoadingOnButton(button)
    })
  )

document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('.listPage .listWrapper .typeSelector button').click()
})

async function generateReportId(type) {
  const config = await getConfig()
  const language = await getLanguage()
  const reports = await (await fetch(`/data/${type}Reports`)).json()
  const shortYear = new Date().getFullYear().toString().slice(-2)
  let index = 1
  for (const report of reports) {
    if (report.ShortYear == shortYear) index++
  }
  const typeMap = language.reports.idTypeMap
  let id = config.reportIdFormat
  id = id.replace('{type}', typeMap[type])
  id = id.replace('{shortYear}', shortYear)
  id = id.replace('{year}', new Date().getFullYear())
  id = id.replace('{month}', new Date().getMonth() + 1)
  id = id.replace('{day}', new Date().getDate())
  id = id.replace(
    '{index}',
    index.toString().padStart(config.reportIdIndexPad, '0')
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
  inputWrapper.classList.add('grid')

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
  inputWrapper.classList.add('grid')

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
  statusClosed.innerHTML = language.reports.statusMap[0]
  statusClosed.classList.add('closed')
  statusClosed.dataset.status = 0
  if (generalInformation.status == 0) {
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
  statusOpen.innerHTML = language.reports.statusMap[1]
  statusOpen.classList.add('open')
  statusOpen.dataset.status = 1
  if (generalInformation.status == 1) {
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
  statusCanceled.innerHTML = language.reports.statusMap[2]
  statusCanceled.classList.add('canceled')
  statusCanceled.dataset.status = 2
  if (generalInformation.status == 2) {
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
  inputWrapper.classList.add('grid')

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

async function getMultipleNameInputsSection(
  title,
  label,
  plusButtonText,
  removeButtonText,
  isList = false,
  list = []
) {
  const titleEl = document.createElement('div')
  if (isList) {
    titleEl.classList.add('searchResponseSectionTitle')
  } else {
    titleEl.classList.add('title')
  }
  titleEl.innerHTML = title

  const inputWrapper = document.createElement('div')
  inputWrapper.classList.add('inputWrapper')
  inputWrapper.classList.add('grid')

  if (isList) {
    for (const i in list) {
      const input = document.createElement('div')
      const inputLabel = document.createElement('label')
      inputLabel.innerHTML = `${label} ${parseInt(i) + 1}`
      inputLabel.htmlFor = `multipleNameInputsSection${title}Input${
        parseInt(i) + 1
      }`
      const inputInput = document.createElement('input')
      inputInput.type = 'text'
      inputInput.value = list[i] || ''
      inputInput.id = `multipleNameInputsSection${title}Input${parseInt(i) + 1}`
      inputInput.autocomplete = 'off'
      inputInput.disabled = isList
      input.appendChild(inputLabel)
      input.appendChild(inputInput)

      inputWrapper.appendChild(input)
    }
  } else {
    const input1 = document.createElement('div')
    const input1Label = document.createElement('label')
    input1Label.innerHTML = `${label} 1`
    input1Label.htmlFor = `multipleNameInputsSection${title}Input1`
    const input1Input = document.createElement('input')
    input1Input.type = 'text'
    input1Input.id = `multipleNameInputsSection${title}Input1`
    input1Input.autocomplete = 'off'
    input1Input.disabled = isList
    input1Input.addEventListener('blur', function () {
      checkForValidPedName(input1Input)
    })
    input1.appendChild(input1Label)
    input1.appendChild(input1Input)

    const buttonWrapper = document.createElement('div')
    buttonWrapper.classList.add('buttonWrapper')

    const plusButton = document.createElement('button')
    plusButton.classList.add('plusButton')
    plusButton.innerHTML = plusButtonText

    const removeButton = document.createElement('button')

    plusButton.addEventListener('click', function () {
      plusButton.blur()
      const newInput = document.createElement('div')
      const newInputLabel = document.createElement('label')
      newInputLabel.innerHTML = `${label} ${
        inputWrapper.querySelectorAll('div:has(input)').length + 1
      }`
      newInputLabel.htmlFor = `multipleNameInputsSection${title}Input${
        inputWrapper.querySelectorAll('div:has(input)').length + 1
      }`
      const newInputInput = document.createElement('input')
      newInputInput.type = 'text'
      newInputInput.id = `multipleNameInputsSection${title}Input${
        inputWrapper.querySelectorAll('div:has(input)').length + 1
      }`
      newInputInput.autocomplete = 'off'
      newInputInput.addEventListener('blur', function () {
        checkForValidPedName(newInputInput)
      })
      newInput.appendChild(newInputLabel)
      newInput.appendChild(newInputInput)

      inputWrapper.insertBefore(newInput, buttonWrapper)

      const length = inputWrapper.querySelectorAll('div:has(input)').length
      removeButton.disabled = length < 2
      newInputInput.focus()
    })

    removeButton.classList.add('removeButton')
    removeButton.innerHTML = removeButtonText
    removeButton.disabled = true
    removeButton.addEventListener('click', function () {
      const length = inputWrapper.querySelectorAll('div:has(input)').length
      inputWrapper.querySelectorAll('div:has(input)')[length - 1].remove()

      removeButton.disabled = length < 3
      removeButton.blur()
    })

    inputWrapper.appendChild(input1)
    buttonWrapper.appendChild(plusButton)
    buttonWrapper.appendChild(removeButton)
    inputWrapper.appendChild(buttonWrapper)
  }

  const sectionWrapper = document.createElement('div')
  sectionWrapper.classList.add('section')
  sectionWrapper.dataset.title = title

  sectionWrapper.appendChild(titleEl)
  sectionWrapper.appendChild(inputWrapper)

  return sectionWrapper
}

async function getOffenderSection(
  offenderInformation = { pedName: null, vehicleLicensePlate: null },
  isList = false
) {
  const language = await getLanguage()

  const title = document.createElement('div')
  if (isList) {
    title.classList.add('searchResponseSectionTitle')
  } else {
    title.classList.add('title')
  }
  title.innerHTML = language.reports.sections.offender.title

  const pedName = document.createElement('div')
  pedName.classList.add('pedName')
  const pedNameLabel = document.createElement('label')
  pedNameLabel.innerHTML = language.reports.sections.offender.pedName
  pedNameLabel.htmlFor = 'offenderSectionPedNameInput'
  const pedNameInput = document.createElement('input')
  pedNameInput.type = 'text'
  pedNameInput.value = offenderInformation.pedName || ''
  pedNameInput.id = 'offenderSectionPedNameInput'
  pedNameInput.autocomplete = 'off'
  pedNameInput.disabled = isList
  pedNameInput.addEventListener('blur', function () {
    checkForValidPedName(pedNameInput)
  })
  pedName.appendChild(pedNameLabel)
  pedName.appendChild(pedNameInput)

  const vehicleLicensePlate = document.createElement('div')
  vehicleLicensePlate.classList.add('vehicleLicensePlate')
  const vehicleLicensePlateLabel = document.createElement('label')
  vehicleLicensePlateLabel.innerHTML =
    language.reports.sections.offender.vehicleLicensePlate
  vehicleLicensePlateLabel.htmlFor = 'offenderSectionVehicleLicensePlateInput'
  const vehicleLicensePlateInput = document.createElement('input')
  vehicleLicensePlateInput.type = 'text'
  vehicleLicensePlateInput.value = offenderInformation.vehicleLicensePlate || ''
  vehicleLicensePlateInput.id = 'offenderSectionVehicleLicensePlateInput'
  vehicleLicensePlateInput.autocomplete = 'off'
  vehicleLicensePlateInput.disabled = isList
  vehicleLicensePlateInput.addEventListener('blur', function () {
    checkForValidVehicleLicensePlate(vehicleLicensePlateInput)
  })
  vehicleLicensePlate.appendChild(vehicleLicensePlateLabel)
  vehicleLicensePlate.appendChild(vehicleLicensePlateInput)

  pedName.appendChild(pedNameLabel)
  pedName.appendChild(pedNameInput)

  const inputWrapper = document.createElement('div')
  inputWrapper.classList.add('inputWrapper')
  inputWrapper.classList.add('grid')

  inputWrapper.appendChild(pedName)
  inputWrapper.appendChild(vehicleLicensePlate)

  const sectionWrapper = document.createElement('div')
  sectionWrapper.classList.add('section')

  sectionWrapper.appendChild(title)
  sectionWrapper.appendChild(inputWrapper)

  return sectionWrapper
}

async function checkForValidPedName(inputEl) {
  const name = inputEl.value.trim()
  if (!name) return
  const response = await (
    await fetch('/data/specificPed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: name,
    })
  ).json()
  if (!response) {
    const language = await getLanguage()
    showNotification(language.reports.notifications.invalidPedName, 'warning')
  }
}

async function checkForValidVehicleLicensePlate(inputEl) {
  const name = inputEl.value.trim()
  if (!name) return
  const response = await (
    await fetch('/data/specificVehicle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: name,
    })
  ).json()
  if (!response) {
    const language = await getLanguage()
    showNotification(
      language.reports.notifications.invalidVehicleLicensePlate,
      'warning'
    )
  }
}

async function getCitationArrestSection(type, isList = false) {
  const language = await getLanguage()
  const options = await (await fetch(`/${type}Options`)).json()

  const title = document.createElement('div')
  if (isList) {
    title.classList.add('searchResponseSectionTitle')
  } else {
    title.classList.add('title')
  }
  title.innerHTML = language.reports.sections[type].title
  title.style.borderBottom = 'none'
  title.style.paddingBottom = '0'

  const sectionWrapper = document.createElement('div')
  sectionWrapper.classList.add('section')
  sectionWrapper.classList.add(`${type}Section`)

  const additionalWrapper = document.createElement('div')

  const optionsWrapper = document.createElement('div')
  optionsWrapper.classList.add('optionsWrapper')

  const optionsList = document.createElement('div')
  optionsList.classList.add('optionsList')

  const optionsSearchInput = document.createElement('input')
  optionsSearchInput.type = 'text'
  optionsSearchInput.placeholder =
    language.reports.sections[type].searchChargesPlaceholder
  optionsSearchInput.autocomplete = 'off'
  optionsSearchInput.id = `${type}OptionsSearchInput`
  optionsSearchInput.addEventListener('input', async function () {
    await performSearch(optionsSearchInput.value.trim())
  })
  optionsWrapper.appendChild(optionsSearchInput)

  performSearch()
  async function performSearch(search) {
    optionsWrapper.querySelectorAll('details').forEach((el) => el.remove())
    for (const group of options) {
      const details = document.createElement('details')
      if (search) details.open = true

      const summary = document.createElement('summary')
      summary.innerHTML = group.name
      details.appendChild(summary)
      summary.addEventListener('click', function () {
        optionsWrapper.querySelectorAll('details').forEach((el) => {
          if (el != details) el.open = false
        })
      })

      for (const charge of group.charges) {
        if (
          search &&
          !charge.name.toLowerCase().includes(search.toLowerCase())
        ) {
          continue
        }
        const button = document.createElement('button')
        button.innerHTML = charge.name
        button.addEventListener('click', async function () {
          button.blur()
          await addChargeToOptionsList(charge)
        })

        const chargeDetailsOnButton = document.createElement('span')
        chargeDetailsOnButton.classList.add('chargeDetailsOnButton')
        chargeDetailsOnButton.innerHTML = await getChargeDetailsString(
          type,
          charge
        )

        button.appendChild(chargeDetailsOnButton)
        details.appendChild(button)
      }
      if (search && details.children.length < 2) continue
      optionsWrapper.appendChild(details)
    }
  }

  async function addChargeToOptionsList(charge) {
    const chargeWrapper = document.createElement('div')
    chargeWrapper.classList.add('chargeWrapper')
    chargeWrapper.dataset.charge = JSON.stringify(charge)

    const chargeName = document.createElement('div')
    chargeName.classList.add('chargeName')
    chargeName.innerHTML = charge.name

    const chargeDetails = document.createElement('div')
    chargeDetails.classList.add('chargeDetails')
    chargeDetails.innerHTML = await getChargeDetailsString(type, charge)

    const deleteChargeButton = document.createElement('button')
    deleteChargeButton.classList.add('deleteChargeButton')
    deleteChargeButton.innerHTML =
      topDoc.querySelector('.iconAccess .trash').innerHTML
    deleteChargeButton.addEventListener('click', function () {
      chargeWrapper.remove()
    })

    chargeWrapper.appendChild(chargeName)
    chargeWrapper.appendChild(chargeDetails)
    if (!isList) chargeWrapper.appendChild(deleteChargeButton)

    optionsList.appendChild(chargeWrapper)
  }

  sectionWrapper.appendChild(title)
  additionalWrapper.appendChild(optionsWrapper)
  additionalWrapper.appendChild(optionsList)
  sectionWrapper.appendChild(additionalWrapper)

  return sectionWrapper
}

async function getChargeDetailsString(type, charge) {
  const language = await getLanguage()

  let fineString = `${language.reports.sections.fine}: `
  if (charge.minFine == charge.maxFine) {
    fineString += await getCurrencyString(charge.minFine)
  } else {
    fineString += `${await getCurrencyString(
      charge.minFine
    )} - ${await getCurrencyString(charge.maxFine)}`
  }

  let incarcerationString = `${language.reports.sections.incarceration}: `
  if (charge.minDays == charge.maxDays) {
    incarcerationString += await convertDaysToYMD(charge.minDays)
  } else {
    incarcerationString += `${await convertDaysToYMD(charge.minDays)} - ${
      charge.maxDays == null
        ? language.units.life
        : await convertDaysToYMD(charge.maxDays)
    }`
  }

  if (type == 'citation') {
    return fineString
  } else if (type == 'arrest') {
    return `${fineString} | ${incarcerationString}`
  }
}

async function saveReport(type) {
  const language = await getLanguage()

  const el = document.querySelector('.createPage .reportInformation')
  const generalInformation = {
    Id: el.querySelector('#generalInformationSectionReportIdInput').value,
    TimeStamp: new Date(
      `${el
        .querySelector('#generalInformationSectionDateInput')
        .value.trim()} ${el
        .querySelector('#generalInformationSectionTimeInput')
        .value.trim()}`
    ),
    Status: el.querySelector('.statusInput .selected').dataset.status,
    Notes: el.querySelector('#notesSectionTextarea').value.trim(),
    ShortYear: new Date().getFullYear().toString().slice(-2),
  }

  const officerInformation = {
    firstName: el
      .querySelector('#officerInformationSectionFirstNameInput')
      .value.trim(),
    lastName: el
      .querySelector('#officerInformationSectionLastNameInput')
      .value.trim(),
    badgeNumber: el
      .querySelector('#officerInformationSectionBadgeNumberInput')
      .value.trim(),
    rank: el.querySelector('#officerInformationSectionRankInput').value.trim(),
    callSign: el
      .querySelector('#officerInformationSectionCallSignInput')
      .value.trim(),
    agency: el
      .querySelector('#officerInformationSectionAgencyInput')
      .value.trim(),
  }

  const location = {
    Area: el.querySelector('#locationSectionAreaInput').value.trim(),
    Street: el.querySelector('#locationSectionStreetInput').value.trim(),
    County: el.querySelector('#locationSectionCountyInput').value.trim(),
    Postal: el.querySelector('#locationSectionPostalInput').value.trim(),
  }

  const report = {
    ...generalInformation,
    OfficerInformation: officerInformation,
    Location: location,
  }

  let response

  switch (type) {
    case 'incident':
      report.OffenderPedsNames = []
      const offenderInputs = el.querySelectorAll(
        `[data-title="${language.reports.sections.incident.titleOffenders}"] .inputWrapper > div:has(input) input`
      )
      for (const input of offenderInputs) {
        if (input.value.trim()) {
          report.OffenderPedsNames.push(input.value.trim())
        }
      }

      report.WitnessPedsNames = []
      const witnessInputs = el.querySelectorAll(
        `[data-title="${language.reports.sections.incident.titleWitnesses}"] .inputWrapper > div:has(input) input`
      )
      for (const input of witnessInputs) {
        if (input.value.trim()) {
          report.WitnessPedsNames.push(input.value.trim())
        }
      }

      response = await (
        await fetch('/post/createIncidentReport', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(report),
        })
      ).text()
      break
    case 'citation':
      report.OffenderPedName = el
        .querySelector('#offenderSectionPedNameInput')
        .value.trim()
      report.OffenderVehicleLicensePlate = el
        .querySelector('#offenderSectionVehicleLicensePlateInput')
        .value.trim()

      report.Charges = []
      for (const chargeEl of el.querySelectorAll(
        `.${type}Section .optionsList .chargeWrapper`
      )) {
        report.Charges.push(JSON.parse(chargeEl.dataset.charge))
      }

      response = await (
        await fetch('/post/createCitationReport', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(report),
        })
      ).text()
      break
    case 'arrest':
      report.OffenderPedName = el
        .querySelector('#offenderSectionPedNameInput')
        .value.trim()
      report.OffenderVehicleLicensePlate = el
        .querySelector('#offenderSectionVehicleLicensePlateInput')
        .value.trim()

      report.Charges = []
      for (const chargeEl of el.querySelectorAll(
        `.${type}Section .optionsList .chargeWrapper`
      )) {
        report.Charges.push(JSON.parse(chargeEl.dataset.charge))
      }

      response = await (
        await fetch('/post/createArrestReport', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(report),
        })
      ).text()
      break
  }

  if (response != 'OK') {
    showNotification(language.reports.notifications.saveError, 'error')
    return
  }
  showNotification(language.reports.notifications.saveSuccess, 'success')

  document.querySelector('.createPage').classList.add('hidden')
  document.querySelector('.createPage .reportInformation').innerHTML = ''
  document.querySelector('.listPage').classList.remove('hidden')
  reportIsOnCreatePageBool = false

  document
    .querySelector(`.listPage .typeSelector [data-type="${type}"]`)
    .click()
}
