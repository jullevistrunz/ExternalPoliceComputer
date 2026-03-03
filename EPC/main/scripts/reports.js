;(async function () {
  const config = await getConfig()
  if (config.updateDomWithLanguageOnLoad) await updateDomWithLanguage('reports')
})()

let autosaveInterval = null

function serializeDraft() {
  const el = document.querySelector('.createPage .reportInformation')
  if (!el || el.children.length === 0) return
  const type = document.querySelector(
    '.createPage .typeSelector .selected'
  )?.dataset.type
  if (!type) return
  const draft = { type, timestamp: Date.now(), fields: {} }
  el.querySelectorAll('input[id]').forEach((input) => {
    draft.fields[input.id] = input.value
  })
  const notes = el.querySelector('#notesSectionTextarea')
  if (notes) draft.fields['notesSectionTextarea'] = notes.value
  const selectedStatus = el.querySelector('.statusInput .selected')
  if (selectedStatus) draft.fields['status'] = selectedStatus.dataset.status
  localStorage.setItem('epcReportDraft', JSON.stringify(draft))
}

function clearDraft() {
  if (autosaveInterval) {
    clearInterval(autosaveInterval)
    autosaveInterval = null
  }
  localStorage.removeItem('epcReportDraft')
}

function getDraft() {
  const raw = localStorage.getItem('epcReportDraft')
  if (!raw) return null
  try {
    const draft = JSON.parse(raw)
    if (Date.now() - draft.timestamp >= 24 * 60 * 60 * 1000) {
      localStorage.removeItem('epcReportDraft')
      return null
    }
    return draft
  } catch {
    return null
  }
}

function applyDraft(draft) {
  const el = document.querySelector('.createPage .reportInformation')
  if (!el || !draft) return
  for (const [id, value] of Object.entries(draft.fields)) {
    if (id === 'status') {
      const statusButtons = el.querySelectorAll('.statusInput button')
      statusButtons.forEach((btn) => {
        btn.classList.toggle('selected', btn.dataset.status === value)
      })
    } else if (id === 'notesSectionTextarea') {
      const textarea = el.querySelector('#notesSectionTextarea')
      if (textarea) textarea.value = value
    } else {
      const input = el.querySelector(`#${id}`)
      if (input) input.value = value
    }
  }
}

function startAutosave() {
  if (autosaveInterval) clearInterval(autosaveInterval)
  autosaveInterval = setInterval(serializeDraft, 5000)
}

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

  const draft = getDraft()
  const type = draft
    ? draft.type
    : document.querySelector('.listPage .typeSelector .selected').dataset.type

  await onCreatePageTypeSelectorButtonClick(type)

  if (draft) {
    applyDraft(draft)
    topWindow.showNotification(
      language.reports.notifications?.draftRestored ||
        'Draft report restored',
      'info'
    )
  }

  startAutosave()
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

  const dateRangeWrapper = document.createElement('div')
  dateRangeWrapper.classList.add('dateRange')

  const dateFromLabel = document.createElement('label')
  dateFromLabel.innerHTML =
    language.reports.list.filter?.dateFrom || 'From'
  const dateFromInput = document.createElement('input')
  dateFromInput.type = 'date'
  dateFromInput.id = 'reportsListFilterDateFrom'
  dateFromInput.addEventListener('change', async () => await applyFilter())

  const dateToLabel = document.createElement('label')
  dateToLabel.innerHTML =
    language.reports.list.filter?.dateTo || 'To'
  const dateToInput = document.createElement('input')
  dateToInput.type = 'date'
  dateToInput.id = 'reportsListFilterDateTo'
  dateToInput.addEventListener('change', async () => await applyFilter())

  dateRangeWrapper.appendChild(dateFromLabel)
  dateRangeWrapper.appendChild(dateFromInput)
  dateRangeWrapper.appendChild(dateToLabel)
  dateRangeWrapper.appendChild(dateToInput)

  const sortWrapper = document.createElement('div')
  sortWrapper.classList.add('buttonWrapper', 'sortWrapper')

  const sortNewest = document.createElement('button')
  sortNewest.innerHTML =
    language.reports.list.filter?.newest || 'Newest'
  sortNewest.classList.add('selected')
  sortNewest.dataset.sort = 'newest'

  const sortOldest = document.createElement('button')
  sortOldest.innerHTML =
    language.reports.list.filter?.oldest || 'Oldest'
  sortOldest.dataset.sort = 'oldest'

  sortWrapper.appendChild(sortNewest)
  sortWrapper.appendChild(sortOldest)

  for (const btn of sortWrapper.querySelectorAll('button')) {
    btn.addEventListener('click', async function () {
      btn.blur()
      sortWrapper
        .querySelectorAll('button')
        .forEach((b) => b.classList.remove('selected'))
      btn.classList.add('selected')
      await applyFilter()
    })
  }

  filterElement.appendChild(filterTitle)
  filterElement.appendChild(filterInput)
  filterElement.appendChild(dateRangeWrapper)
  filterElement.appendChild(statusButtonWrapper)
  filterElement.appendChild(sortWrapper)

  if (reports.length < 1) {
    document.querySelector('.listPage .reportsList').innerHTML +=
      language.reports.list.empty
  } else {
    document.querySelector('.listPage .reportsList').appendChild(filterElement)

    await applyFilter()
  }

  async function applyFilter() {
    const newReports = []
    const searchText = filterInput.value.toLowerCase()

    function addToNewReports(report) {
      if (!newReports.includes(report)) {
        newReports.push(report)
      }
    }
    function removeFromNewReports(report) {
      const index = newReports.indexOf(report)
      if (index > -1) newReports.splice(index, 1)
    }

    const dateFrom = dateFromInput.value
      ? new Date(dateFromInput.value)
      : null
    const dateTo = dateToInput.value
      ? new Date(dateToInput.value + 'T23:59:59')
      : null

    for (const report of reports) {
      // Date range filter
      const reportDate = new Date(report.TimeStamp)
      if (dateFrom && reportDate < dateFrom) continue
      if (dateTo && reportDate > dateTo) continue

      // Text search across fields
      if (
        report.OffenderPedName?.toLowerCase().includes(searchText) ||
        report.OffenderVehicleLicensePlate?.toLowerCase().includes(searchText) ||
        report.Id.toLowerCase().includes(searchText) ||
        new Date(report.TimeStamp)
          .toLocaleDateString()
          .toLowerCase()
          .includes(searchText) ||
        `${report.Location.Postal} ${report.Location.Street}`
          .toLowerCase()
          .includes(searchText) ||
        report.Location.Area.toLowerCase().includes(searchText) ||
        (report.Notes && report.Notes.toLowerCase().includes(searchText))
      ) {
        addToNewReports(report)
      }

      // Charge name search
      if (report.Charges) {
        for (const charge of report.Charges) {
          if (charge.name?.toLowerCase().includes(searchText)) {
            addToNewReports(report)
            break
          }
        }
      }

      if (report.OffenderPedsNames) {
        for (const pedName of report.OffenderPedsNames) {
          if (pedName.toLowerCase().includes(searchText)) {
            addToNewReports(report)
            break
          }
        }
      }

      if (report.WitnessPedsNames) {
        for (const pedName of report.WitnessPedsNames) {
          if (pedName.toLowerCase().includes(searchText)) {
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

    // Apply sort
    const sortDirection =
      sortWrapper.querySelector('.selected')?.dataset.sort || 'newest'
    if (sortDirection === 'oldest') {
      newReports.sort((a, b) => new Date(a.TimeStamp) - new Date(b.TimeStamp))
    } else {
      newReports.sort((a, b) => new Date(b.TimeStamp) - new Date(a.TimeStamp))
    }

    await renderReports(newReports, button.dataset.type)
  }

  hideLoadingOnButton(button)
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
    clearDraft()
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

  const language = await getLanguage()
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

  const fillFromPriorBtn = document.createElement('button')
  fillFromPriorBtn.innerHTML =
    language.reports.create?.fillFromPrior || 'Fill from Prior Report'
  fillFromPriorBtn.classList.add('fillFromPrior')
  fillFromPriorBtn.addEventListener('click', async function () {
    if (fillFromPriorBtn.classList.contains('loading')) return
    showLoadingOnButton(fillFromPriorBtn)
    const reports = await (
      await fetch(`/data/${button.dataset.type}Reports`)
    ).json()
    if (reports.length === 0) {
      topWindow.showNotification(
        language.reports.notifications?.noPriorReport ||
          'No prior reports found',
        'info'
      )
      hideLoadingOnButton(fillFromPriorBtn)
      return
    }
    const latest = reports[reports.length - 1]
    const el = document.querySelector('.createPage .reportInformation')
    const fields = {
      '#locationSectionAreaInput': latest.Location.Area,
      '#locationSectionStreetInput': latest.Location.Street,
      '#locationSectionCountyInput': latest.Location.County,
      '#locationSectionPostalInput': latest.Location.Postal,
    }
    for (const [selector, value] of Object.entries(fields)) {
      const input = el.querySelector(selector)
      if (input) input.value = value || ''
    }
    hideLoadingOnButton(fillFromPriorBtn)
  })
  const reportInfo = document.querySelector('.createPage .reportInformation')
  reportInfo.insertBefore(fillFromPriorBtn, reportInfo.firstChild)
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
  clearDraft()

  document.querySelector('.createPage').classList.add('hidden')
  document.querySelector('.createPage .reportInformation').innerHTML = ''
  document.querySelector('.listPage').classList.remove('hidden')
  reportIsOnCreatePageBool = false

  await onListPageTypeSelectorButtonClick(type)
}

function isValidDate(date) {
  return date instanceof Date && !isNaN(date) && !isNaN(date.getTime())
}
