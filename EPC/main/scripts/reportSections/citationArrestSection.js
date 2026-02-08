async function getCitationArrestSection(type, isList = false, list = []) {
  const language = await getLanguage()
  const options =
    type == 'citation' ? await getCitationOptions() : await getArrestOptions()

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
  if (isList) sectionWrapper.classList.add('searchResponseWrapper')

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
    if (list.length < 1) chargeWrapper.appendChild(deleteChargeButton)

    optionsList.appendChild(chargeWrapper)
  }

  if (list.length > 0) {
    for (const charge of list) {
      charge.addedByReportInEdit = true
      await addChargeToOptionsList(charge)
    }
  }

  sectionWrapper.appendChild(title)
  if (list.length < 1) additionalWrapper.appendChild(optionsWrapper)
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
