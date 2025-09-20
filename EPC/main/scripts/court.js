;(async function () {
  const language = await getLanguage()
  const config = await getConfig()
  if (config.updateDomWithLanguageOnLoad) await updateDomWithLanguage('court')

  const courtCases = await (await fetch('/data/court')).json()

  if (courtCases.length < 1) {
    document.querySelector('.list').innerHTML = language.court.empty
  }

  for (const courtCase of courtCases.reverse()) {
    const listItem = document.createElement('div')
    listItem.classList.add('listItem')

    const chargesSearchResponseWrapper = document.createElement('div')
    chargesSearchResponseWrapper.classList.add('searchResponseWrapper')
    chargesSearchResponseWrapper.classList.add('chargesWrapper')
    chargesSearchResponseWrapper.classList.add('section')

    const chargesSearchResponseTitle = document.createElement('div')
    chargesSearchResponseTitle.classList.add('searchResponseSectionTitle')
    chargesSearchResponseTitle.innerHTML = language.court.charges
    chargesSearchResponseWrapper.appendChild(chargesSearchResponseTitle)

    const chargesInputWrapper = document.createElement('div')
    chargesInputWrapper.classList.add('inputWrapper')
    chargesInputWrapper.classList.add('grid')

    let totalFine = 0
    let totalTime = 0
    let lifeSentences = 0
    for (const charge of courtCase.Charges) {
      totalFine += charge.Fine
      totalTime += charge.Time
      if (charge.Time === null) lifeSentences++

      const chargeWrapper = document.createElement('div')
      const chargeLabel = document.createElement('label')
      chargeLabel.innerHTML = charge.Name
      chargeWrapper.appendChild(chargeLabel)
      const chargeInput = document.createElement('input')
      chargeInput.value = await getChargeDetailsString(charge.Fine, charge.Time)
      chargeInput.type = 'text'
      chargeInput.disabled = true
      chargeWrapper.appendChild(chargeInput)
      chargesInputWrapper.appendChild(chargeWrapper)
    }

    const searchResponseWrapper = document.createElement('div')
    searchResponseWrapper.classList.add('searchResponseWrapper')
    searchResponseWrapper.classList.add('section')

    const searchResponseTitle = document.createElement('div')
    searchResponseTitle.classList.add('searchResponseSectionTitle')
    searchResponseTitle.innerHTML = `${language.court.number}: ${courtCase.Number}`
    searchResponseWrapper.appendChild(searchResponseTitle)

    const inputWrapper = document.createElement('div')
    inputWrapper.classList.add('inputWrapper')
    inputWrapper.classList.add('grid')

    const pedNameWrapper = document.createElement('div')
    pedNameWrapper.classList.add('clickable')
    pedNameWrapper.addEventListener('click', async function () {
      await openInPedSearch(courtCase.PedName)
    })
    const pedNameLabel = document.createElement('label')
    pedNameLabel.innerHTML = language.court.pedName
    pedNameWrapper.appendChild(pedNameLabel)
    const pedNameInput = document.createElement('input')
    pedNameInput.value = courtCase.PedName
    pedNameInput.type = 'text'
    pedNameInput.disabled = true
    pedNameWrapper.appendChild(pedNameInput)
    inputWrapper.appendChild(pedNameWrapper)

    const reportWrapper = document.createElement('div')
    reportWrapper.classList.add('clickable')
    reportWrapper.addEventListener('click', async function () {
      await openIdInReport(courtCase.ReportId)
    })
    const reportLabel = document.createElement('label')
    reportLabel.innerHTML = language.court.report
    reportWrapper.appendChild(reportLabel)
    const reportInput = document.createElement('input')
    reportInput.value = courtCase.ReportId
    reportInput.type = 'text'
    reportInput.disabled = true
    reportWrapper.appendChild(reportInput)
    inputWrapper.appendChild(reportWrapper)

    const totalFineWrapper = document.createElement('div')
    const totalFineLabel = document.createElement('label')
    totalFineLabel.innerHTML = language.court.totalFine
    totalFineWrapper.appendChild(totalFineLabel)
    const totalFineInput = document.createElement('input')
    totalFineInput.value = await getCurrencyString(totalFine)
    totalFineInput.type = 'text'
    totalFineInput.disabled = true
    totalFineWrapper.appendChild(totalFineInput)
    inputWrapper.appendChild(totalFineWrapper)

    const totalTimeWrapper = document.createElement('div')
    const totalTimeLabel = document.createElement('label')
    totalTimeLabel.innerHTML = language.court.totalIncarceration
    totalTimeWrapper.appendChild(totalTimeLabel)
    const totalTimeInput = document.createElement('input')
    totalTimeInput.value = await getTotalTimeString(totalTime, lifeSentences)
    totalTimeInput.type = 'text'
    totalTimeInput.disabled = true
    totalTimeWrapper.appendChild(totalTimeInput)
    if (totalTime > 0) inputWrapper.appendChild(totalTimeWrapper)

    searchResponseWrapper.appendChild(inputWrapper)
    chargesSearchResponseWrapper.appendChild(chargesInputWrapper)
    listItem.appendChild(searchResponseWrapper)
    listItem.appendChild(chargesSearchResponseWrapper)

    document.querySelector('.list').appendChild(listItem)
  }
})()

async function getChargeDetailsString(fine, time) {
  const language = await getLanguage()

  let fineString = `${language.court.fine}: ${await getCurrencyString(fine)}`
  let timeString = `${language.court.incarceration}: ${
    time === null ? language.units.life : await convertDaysToYMD(time)
  }`

  return time > 0 || time === null
    ? `${fineString} | ${timeString}`
    : fineString
}

async function getTotalTimeString(time, lifeSentences) {
  const language = await getLanguage()

  const timeString = await convertDaysToYMD(time)
  if (lifeSentences < 1) return timeString
  if (lifeSentences == 1) return `${language.units.life} + ${timeString}`
  return `${lifeSentences}x ${language.units.life} + ${timeString}`
}
