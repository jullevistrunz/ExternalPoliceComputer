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

    const startDate = new Date(shift.startTime)
    const endDate = new Date(shift.endTime)

    timeWrapper.innerHTML = `<span>${startDate.toLocaleString()}</span><span style="font-size: 24px; transform: translateY(-2px); margin: 0 5px;">&rarr;</span><span>${endDate.toLocaleString()}</span><span class="half">(${await convertMsToTimeString(
      endDate - startDate
    )})</span>`

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

const shiftHistoryWS = new WebSocket(`ws://${location.host}/ws`)
shiftHistoryWS.onopen = () => shiftHistoryWS.send('shiftHistoryUpdated')

shiftHistoryWS.onmessage = (event) => {
  if (JSON.parse(event.data).response == 'Shift history updated')
    location.reload()
}
