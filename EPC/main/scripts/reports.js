;(async function () {
  const config = await getConfig()
  if (config.updateDomWithLanguageOnLoad) await updateDomWithLanguage('reports')
})()

document
  .querySelector('.listPage .createButton')
  .addEventListener('click', async function () {
    await onCreateButtonClick()
  })

async function onCreateButtonClick() {
  const language = await getLanguage()
  if (await checkForReportOnCreatePage()) return

  document.title = language.reports.newReportTitle
  reportIsOnCreatePageBool = true

  document.querySelector('.listPage').classList.add('hidden')
  document.querySelector('.listPage .reportInformation').innerHTML = ''
  document.querySelector('.createPage').classList.remove('hidden')

  document.querySelector('.createPage .listWrapper').style.display = 'grid'
  document.querySelector('.createPage .typeSelector').classList.remove('hidden')

  await onCreatePageTypeSelectorButtonClick(
    document.querySelector('.listPage .typeSelector .selected').dataset.type
  )
}

document
  .querySelectorAll('.listPage .listWrapper .typeSelector button')
  .forEach((button) =>
    button.addEventListener('click', async function () {
      await onListPageTypeSelectorButtonClick(button.dataset.type)
    })
  )

async function onListPageTypeSelectorButtonClick(type) {
  const button = document.querySelector(
    `.listPage .typeSelector [data-type="${type}"]`
  )

  if (button.classList.contains('loading')) return
  showLoadingOnButton(button)
  button.blur()

  document
    .querySelectorAll('.listPage .listWrapper .typeSelector button')
    .forEach((btn) => btn.classList.remove('selected'))
  button.classList.add('selected')

  const language = await getLanguage()

  document.title = document
    .querySelector('title')
    .dataset.language.split('.')
    .reduce((acc, key) => acc?.[key], language.reports.static)

  document
    .querySelector('.listPage .listWrapper .reportInformation')
    .classList.add('hidden')
  document
    .querySelector('.listPage .listWrapper .reportsList')
    .classList.remove('hidden')

  document.querySelector('.listPage .reportsList').innerHTML = ''

  let reports = await (await fetch(`/data/${type}Reports`)).json()
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
    document.querySelector('.listPage .reportsList').appendChild(filterElement)

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
          if (pedName.toLowerCase().includes(filterInput.value.toLowerCase())) {
            addToNewReports(report)
            break
          }
        }
      }

      if (report.WitnessPedsNames) {
        for (const pedName of report.WitnessPedsNames) {
          if (pedName.toLowerCase().includes(filterInput.value.toLowerCase())) {
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
}

const statusColorMap = {
  0: 'success',
  1: 'info',
  2: 'error',
}

async function renderReports(reports, type) {
  const language = await getLanguage()

  document
    .querySelectorAll('.listPage .reportsList .listElement')
    .forEach((el) => el.remove())

  for (const report of reports) {
    const listElement = document.createElement('div')
    listElement.classList.add('listElement')
    listElement.dataset.id = report.Id

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
    viewButton.addEventListener('click', async function () {
      if (viewButton.classList.contains('loading')) return
      showLoadingOnButton(viewButton)

      await renderReportInformation(report, type, true)

      hideLoadingOnButton(viewButton)
    })

    const editButton = document.createElement('button')
    editButton.classList.add('editButton')
    editButton.innerHTML = language.reports.list.editButton
    editButton.addEventListener('click', async function () {
      if (editButton.classList.contains('loading')) return
      showLoadingOnButton(editButton)

      const language = await getLanguage()
      for (const iframe of topDoc.querySelectorAll('.overlay .window iframe')) {
        if (iframe.contentWindow.reportIsOnCreatePage()) {
          topWindow.showNotification(
            language.reports.notifications.createPageAlreadyOpen
          )
          return
        }
      }

      document.title = language.reports.editReportTitle
      reportIsOnCreatePageBool = true

      document
        .querySelectorAll('.createPage .typeSelector .selected')
        .forEach((el) => el.classList.remove('selected'))
      document
        .querySelector(
          `.createPage .typeSelector [data-type="${
            document.querySelector('.listPage .typeSelector .selected').dataset
              .type
          }"]`
        )
        .classList.add('selected')

      document.querySelector('.createPage .listWrapper').style.display = 'block'
      document
        .querySelector('.createPage .typeSelector')
        .classList.add('hidden')

      await renderReportInformation(report, type, false)

      hideLoadingOnButton(editButton)
    })

    buttonWrapper.appendChild(viewButton)
    buttonWrapper.appendChild(editButton)

    listElement.appendChild(infoWrapper)
    listElement.appendChild(buttonWrapper)

    document.querySelector('.listPage .reportsList').appendChild(listElement)
  }
}

async function renderReportInformation(report, type, isList) {
  const language = await getLanguage()

  const reportInformationEl = document.querySelector(
    `.${isList ? 'listPage' : 'createPage'} .listWrapper .reportInformation`
  )

  if (isList) {
    document
      .querySelector('.listPage .listWrapper .reportsList')
      .classList.add('hidden')
    reportInformationEl.classList.remove('hidden')
  } else {
    document.querySelector('.listPage').classList.add('hidden')
    document.querySelector('.createPage').classList.remove('hidden')
  }

  reportInformationEl.innerHTML = ''

  const timeStamp = new Date(report.TimeStamp)
  timeStamp.setMinutes(timeStamp.getMinutes() - timeStamp.getTimezoneOffset())

  const generalInformation = {
    reportId: report.Id,
    status: report.Status,
    timeStamp: timeStamp,
  }

  const officerInformation = report.OfficerInformation

  const location = report.Location

  reportInformationEl.appendChild(
    await getGeneralInformationSection(generalInformation, isList)
  )
  reportInformationEl.appendChild(
    await getOfficerInformationSection(officerInformation, isList)
  )
  reportInformationEl.appendChild(await getLocationSection(location, isList))

  switch (type) {
    case 'incident':
      if (!isList || report.OffenderPedsNames.length > 0) {
        reportInformationEl.appendChild(
          await getMultipleNameInputsSection(
            language.reports.sections.incident.titleOffenders,
            language.reports.sections.incident.labelOffenders,
            language.reports.sections.incident.addOffender,
            language.reports.sections.incident.removeOffender,
            isList,
            report.OffenderPedsNames
          )
        )
      }
      if (!isList || report.WitnessPedsNames.length > 0) {
        reportInformationEl.appendChild(
          await getMultipleNameInputsSection(
            language.reports.sections.incident.titleWitnesses,
            language.reports.sections.incident.labelWitnesses,
            language.reports.sections.incident.addWitness,
            language.reports.sections.incident.removeWitness,
            isList,
            report.WitnessPedsNames
          )
        )
      }
      break
    case 'citation':
    case 'arrest':
      reportInformationEl.appendChild(
        await getOffenderSection(
          {
            pedName: report.OffenderPedName,
            vehicleLicensePlate: report.OffenderVehicleLicensePlate,
          },
          isList,
          report.canEditCitationArrest
        )
      )
      if (report.canEditCitationArrest || report.Charges.length > 0) {
        reportInformationEl.appendChild(
          await getCitationArrestSection(type, isList, report.Charges)
        )
      }
      if (report.CourtCaseNumber)
        reportInformationEl.dataset.courtCaseNumber = report.CourtCaseNumber
      break
  }

  reportInformationEl.appendChild(await getNotesSection(report.Notes, isList))
}

document
  .querySelector('.createPage .cancelButton')
  .addEventListener('click', async function () {
    document.querySelector('.createPage').classList.add('hidden')
    document.querySelector('.createPage .reportInformation').innerHTML = ''
    document.querySelector('.listPage').classList.remove('hidden')
    reportIsOnCreatePageBool = false

    await onListPageTypeSelectorButtonClick(
      document.querySelector('.createPage .typeSelector .selected').dataset.type
    )
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
      await onCreatePageTypeSelectorButtonClick(button.dataset.type)
    })
  )

async function onCreatePageTypeSelectorButtonClick(type) {
  const button = document.querySelector(
    `.createPage .typeSelector [data-type="${type}"]`
  )

  button.blur()
  document
    .querySelectorAll('.createPage .typeSelector button')
    .forEach((btn) => btn.classList.remove('selected'))
  button.classList.add('selected')

  document.querySelector('.createPage .reportInformation').innerHTML = ''

  const config = await getConfig()
  const location = await (await fetch('/data/playerLocation')).json()
  const officerInformation = await (
    await fetch('/data/officerInformationData')
  ).json()

  const inGameDateArr = (await (await fetch('/data/currentTime')).text()).split(
    ':'
  )
  const inGameDate = new Date()
  inGameDate.setHours(inGameDateArr[0])
  inGameDate.setMinutes(inGameDateArr[1])
  inGameDate.setSeconds(inGameDateArr[2])

  const reportId = await generateReportId(button.dataset.type)

  const fakeReport = {
    Id: reportId,
    Status: type == 'citation' || type == 'arrest' ? 0 : 1,
    TimeStamp: config.useInGameTime ? inGameDate : new Date(),
    OfficerInformation: officerInformation,
    Location: location,
    Notes: '',
    canEditCitationArrest: true,
  }

  await renderReportInformation(fakeReport, button.dataset.type, false)
}

const pageLoadedEvent = new Event('pageLoaded')
document.addEventListener('DOMContentLoaded', async function () {
  await onListPageTypeSelectorButtonClick('incident')
  document.dispatchEvent(pageLoadedEvent)
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

async function saveReport(type) {
  const language = await getLanguage()

  const el = document.querySelector('.createPage .reportInformation')
  const date = new Date(
    `${el.querySelector('#generalInformationSectionDateInput').value}T${el.querySelector('#generalInformationSectionTimeInput').value}`
  )
  const generalInformation = {
    Id: el.querySelector('#generalInformationSectionReportIdInput').value,
    TimeStamp: date,
    Status: el.querySelector('.statusInput .selected').dataset.status,
    Notes: el.querySelector('#notesSectionTextarea').value.trim(),
    ShortYear: date.getFullYear().toString().slice(-2),
  }

  if (!isValidDate(generalInformation.TimeStamp)) {
    return topWindow.showNotification(
      `${language.reports.notifications.saveError} ${language.reports.notifications.invalidTimeStamp}`,
      'error',
      6000
    )
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

      if (!report.OffenderPedName) {
        return topWindow.showNotification(
          `${language.reports.notifications.saveError} ${language.reports.notifications.noOffender}`,
          'error'
        )
      }

      report.OffenderVehicleLicensePlate = el
        .querySelector('#offenderSectionVehicleLicensePlateInput')
        .value.trim()

      report.Charges = []
      for (const chargeEl of el.querySelectorAll(
        `.${type}Section .optionsList .chargeWrapper`
      )) {
        const charge = JSON.parse(chargeEl.dataset.charge)
        report.Charges.push(charge)
      }

      if (report.Charges.length < 1) {
        return topWindow.showNotification(
          `${language.reports.notifications.saveError} ${language.reports.notifications.noCharges}`,
          'error'
        )
      }

      report.CourtCaseNumber = el.dataset.courtCaseNumber ?? null

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

      if (!report.OffenderPedName) {
        return topWindow.showNotification(
          `${language.reports.notifications.saveError} ${language.reports.notifications.noOffender}`,
          'error'
        )
      }

      report.OffenderVehicleLicensePlate = el
        .querySelector('#offenderSectionVehicleLicensePlateInput')
        .value.trim()

      report.Charges = []
      for (const chargeEl of el.querySelectorAll(
        `.${type}Section .optionsList .chargeWrapper`
      )) {
        const charge = JSON.parse(chargeEl.dataset.charge)
        report.Charges.push(charge)
      }

      if (report.Charges.length < 1) {
        return topWindow.showNotification(
          `${language.reports.notifications.saveError} ${language.reports.notifications.noCharges}`,
          'error'
        )
      }

      report.CourtCaseNumber = el.dataset.courtCaseNumber ?? null

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
    topWindow.showNotification(
      language.reports.notifications.saveError,
      'error'
    )
    return
  }
  topWindow.showNotification(
    language.reports.notifications.saveSuccess,
    'success'
  )

  document.querySelector('.createPage').classList.add('hidden')
  document.querySelector('.createPage .reportInformation').innerHTML = ''
  document.querySelector('.listPage').classList.remove('hidden')
  reportIsOnCreatePageBool = false

  await onListPageTypeSelectorButtonClick(type)
}

function isValidDate(date) {
  return date instanceof Date && !isNaN(date) && !isNaN(date.getTime())
}
