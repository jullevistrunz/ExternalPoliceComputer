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
  statusLabel.htmlFor = 'generalInformationSectionStatusInput'
  statusLabel.innerHTML = language.reports.sections.generalInformation.status
  status.appendChild(statusLabel)

  if (isList) {
    const statusInput = document.createElement('input')
    statusInput.type = 'text'
    statusInput.value = language.reports.statusMap[generalInformation.status]
    statusInput.id = 'generalInformationSectionStatusInput'
    statusInput.disabled = true
    statusInput.style.color = `var(--color-${
      statusColorMap[generalInformation.status]
    })`
    status.appendChild(statusInput)
  } else {
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

    statusInput.appendChild(statusClosed)
    statusInput.appendChild(statusOpen)
    statusInput.appendChild(statusCanceled)
    status.appendChild(statusInput)
  }

  const dateMatch = generalInformation.timeStamp
    .toISOString()
    .match(/\d{4}-\d\d-\d\d/)
  const timeMatch = generalInformation.timeStamp
    .toISOString()
    .match(/\d\d:\d\d:\d\d/)

  const date = document.createElement('div')
  date.classList.add('date')
  const dateLabel = document.createElement('label')
  dateLabel.innerHTML = language.reports.sections.generalInformation.date
  dateLabel.htmlFor = 'generalInformationSectionDateInput'
  const dateInput = document.createElement('input')
  dateInput.type = 'date'
  dateInput.value = dateMatch?.[0] || null
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
  timeInput.type = 'time'
  timeInput.step = 1
  timeInput.value = timeMatch?.[0] || ''
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
  if (isList) sectionWrapper.classList.add('searchResponseWrapper')

  sectionWrapper.appendChild(title)
  sectionWrapper.appendChild(inputWrapper)

  return sectionWrapper
}
