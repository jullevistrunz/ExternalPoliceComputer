;(async function () {
  const language = await getLanguage()
  const config = await getConfig()
  if (config.updateDomWithLanguageOnLoad)
    await updateDomWithLanguage('shiftHistory')

  const shiftHistory = await (await fetch('/data/shiftHistory')).json()

  if (shiftHistory.length < 1) {
    document.querySelector('.list').innerHTML = language.shiftHistory.empty
  }

  for (const shift of shiftHistory.reverse()) {
    const listItem = document.createElement('div')
    listItem.classList.add('listItem')

    const timeWrapper = document.createElement('div')
    timeWrapper.classList.add('timeWrapper')

    const startTime = document.createElement('div')
    startTime.innerHTML = `<span>${
      language.shiftHistory.startTime
    }: </span><span>${new Date(shift.startTime).toLocaleString()}</span>`

    const endTime = document.createElement('div')
    endTime.innerHTML = `<span>${
      language.shiftHistory.endTime
    }: </span><span>${new Date(shift.endTime).toLocaleString()}</span>`

    const duration = document.createElement('div')
    duration.innerHTML = `<span>${
      language.shiftHistory.duration
    }: </span><span>${await convertMsToTimeString(
      new Date(shift.endTime) - new Date(shift.startTime)
    )}</span>`

    timeWrapper.appendChild(startTime)
    timeWrapper.appendChild(endTime)
    timeWrapper.appendChild(duration)

    const reportsTitle = document.createElement('div')
    reportsTitle.classList.add('reportsTitle')
    reportsTitle.innerHTML = language.shiftHistory.reports

    const reports = document.createElement('div')
    reports.classList.add('reportsWrapper')

    for (const reportId of shift.reports) {
      const reportItem = document.createElement('button')
      reportItem.classList.add('reportItem')
      reportItem.innerHTML = reportId
      reportItem.addEventListener('click', async function () {
        await openIdInReport(reportId)
      })
      reports.appendChild(reportItem)
    }

    listItem.appendChild(timeWrapper)
    if (shift.reports.length > 0) {
      listItem.appendChild(reportsTitle)
      listItem.appendChild(reports)
    }

    document.querySelector('.list').appendChild(listItem)
  }
})()
