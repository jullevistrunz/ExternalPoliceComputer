async function getOffenderSection(
  offenderInformation = { pedName: null, vehicleLicensePlate: null },
  isList = false,
  canBeEdited = false
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
  if (isList && offenderInformation.pedName) {
    pedName.classList.add('clickable')
    pedName.addEventListener('click', function () {
      openInPedSearch(offenderInformation.pedName)
    })
  }
  const pedNameLabel = document.createElement('label')
  pedNameLabel.innerHTML = language.reports.sections.offender.pedName
  pedNameLabel.htmlFor = 'offenderSectionPedNameInput'
  const pedNameInput = document.createElement('input')
  pedNameInput.type = 'text'
  pedNameInput.value = offenderInformation.pedName || ''
  pedNameInput.id = 'offenderSectionPedNameInput'
  pedNameInput.autocomplete = 'off'
  pedNameInput.disabled = isList || !canBeEdited
  pedNameInput.addEventListener('blur', function () {
    checkForValidPedName(pedNameInput)
  })
  pedName.appendChild(pedNameLabel)
  pedName.appendChild(pedNameInput)

  const vehicleLicensePlate = document.createElement('div')
  vehicleLicensePlate.classList.add('vehicleLicensePlate')
  if (isList && offenderInformation.vehicleLicensePlate) {
    vehicleLicensePlate.classList.add('clickable')
    vehicleLicensePlate.addEventListener('click', function () {
      openInVehicleSearch(offenderInformation.vehicleLicensePlate)
    })
  }
  const vehicleLicensePlateLabel = document.createElement('label')
  vehicleLicensePlateLabel.innerHTML =
    language.reports.sections.offender.vehicleLicensePlate
  vehicleLicensePlateLabel.htmlFor = 'offenderSectionVehicleLicensePlateInput'
  const vehicleLicensePlateInput = document.createElement('input')
  vehicleLicensePlateInput.type = 'text'
  vehicleLicensePlateInput.value = offenderInformation.vehicleLicensePlate || ''
  vehicleLicensePlateInput.id = 'offenderSectionVehicleLicensePlateInput'
  vehicleLicensePlateInput.autocomplete = 'off'
  vehicleLicensePlateInput.disabled = isList || !canBeEdited
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
  if (isList) sectionWrapper.classList.add('searchResponseWrapper')

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
    topWindow.showNotification(
      language.reports.notifications.invalidPedName,
      'warning'
    )
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
    topWindow.showNotification(
      language.reports.notifications.invalidVehicleLicensePlate,
      'warning'
    )
  }
}
