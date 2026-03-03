;(async function () {
  const config = await getConfig()
  if (config.updateDomWithLanguageOnLoad) await updateDomWithLanguage('callout')
})()

const calloutEventWs = new WebSocket(`ws://${location.host}/ws`)
calloutEventWs.onopen = () => calloutEventWs.send('calloutEvent')

calloutEventWs.onmessage = async (event) => {
  const language = await getLanguage()
  const config = await getConfig()
  const data = JSON.parse(event.data).response

  document.querySelector('.calloutInfo').innerHTML = ''

  document.querySelector('#addressInput').value =
    `${data.Location.Postal} ${data.Location.Street}`
  document.querySelector('#areaInput').value = data.Location.Area
  document.querySelector('#countyInput').value = await getLanguageValue(
    data.Location.County
  )
  document.querySelector('#priorityInput').value =
    data.Priority || language.callout.defaultPriority

  const displayedTimeDiv = document.createElement('div')
  displayedTimeDiv.classList.add('halfOpacity')
  displayedTimeDiv.innerHTML = `${language.callout.calloutInfo.displayedTime} ${new Date(data.DisplayedTime).toLocaleString()}`
  document.querySelector('.calloutInfo').appendChild(displayedTimeDiv)

  if (data.Message) {
    const messageDiv = document.createElement('div')
    messageDiv.innerHTML = removeGTAColorCodesFromString(data.Message)
    document.querySelector('.calloutInfo').appendChild(messageDiv)
  }

  if (data.Advisory) {
    const advisoryDiv = document.createElement('div')
    advisoryDiv.innerHTML = removeGTAColorCodesFromString(data.Advisory)
    document.querySelector('.calloutInfo').appendChild(advisoryDiv)
  }

  const agencyString = config.showAgencyInCalloutInfo ? ` (${data.Agency})` : ''

  if (data.AcceptedTime) {
    const acceptedTimeDiv = document.createElement('div')
    acceptedTimeDiv.classList.add('halfOpacity')
    acceptedTimeDiv.innerHTML = `${language.callout.calloutInfo.unit} ${data.Callsign}${agencyString}  ${language.callout.calloutInfo.acceptedTime} ${new Date(data.AcceptedTime).toLocaleString()}`
    document.querySelector('.calloutInfo').appendChild(acceptedTimeDiv)
  }

  if (data.AdditionalMessages.length > 0) {
    for (const additionalMessage of data.AdditionalMessages) {
      const additionalMessageDiv = document.createElement('div')
      additionalMessageDiv.innerHTML =
        removeGTAColorCodesFromString(additionalMessage)
      document.querySelector('.calloutInfo').appendChild(additionalMessageDiv)
    }
  }

  if (data.FinishedTime) {
    const finishedTimeDiv = document.createElement('div')
    finishedTimeDiv.classList.add('halfOpacity')
    finishedTimeDiv.innerHTML = `${language.callout.calloutInfo.finishedTime} ${new Date(data.FinishedTime).toLocaleString()}`
    document.querySelector('.calloutInfo').appendChild(finishedTimeDiv)
  }
}
