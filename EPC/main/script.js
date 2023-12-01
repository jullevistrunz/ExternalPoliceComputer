// create server log on initial connection
fetch(
  `/createLog?message=[New Connection] ${location.host} ${navigator.userAgent}`
)
// server log on error
window.addEventListener('error', function (errorEvent) {
  fetch(
    `/createLog?message=[Error] ${errorEvent.error} (at ${errorEvent.filename}:${errorEvent.lineno}:${errorEvent.colno})`
  )
})

// leave space cause prettier sucks (sometimes)
;(async function () {
  const config = await getConfig()
  const mapZoom = config.defaultMapZoom
  document.querySelector('.mapPage input').value = mapZoom

  document
    .querySelector('.mapPage input')
    .addEventListener('input', function () {
      document
        .querySelector('.mapPage iframe')
        .contentDocument.querySelector('img').style.zoom =
        this.value <= 3 && this.value >= 0.1
          ? this.value
          : config.defaultMapZoom
    })
})()

let lastPage = localStorage.getItem('lastPage')
if (!lastPage) {
  localStorage.setItem('lastPage', 'map')
  lastPage = 'map'
}

let mapScroll = JSON.parse(localStorage.getItem('mapScroll'))
if (!mapScroll) {
  localStorage.setItem('mapScroll', JSON.stringify({ x: 0, y: 0 }))
  mapScroll = { x: 0, y: 0 }
}

goToPage(lastPage)
document.querySelectorAll('.header button').forEach((btn) => {
  btn.addEventListener('click', function () {
    goToPage(this.classList[0])
  })
})

document
  .querySelector('.mapPage iframe')
  .addEventListener('load', async function () {
    const config = await getConfig()
    this.contentWindow.scrollTo(mapScroll.x, mapScroll.y)
    this.contentDocument.querySelector('img').style.zoom = config.defaultMapZoom
    this.contentDocument.head.innerHTML +=
      '<style>body::-webkit-scrollbar{display:none;}</style>'
  })

document
  .querySelector('.mapPage iframe')
  .contentWindow.addEventListener('scroll', function () {
    if (!document.querySelector('.mapPage').classList.contains('hidden')) {
      localStorage.setItem(
        'mapScroll',
        JSON.stringify({ x: this.scrollX, y: this.scrollY })
      )
    }
  })

document
  .querySelector('.searchPedPage .pedBtn')
  .addEventListener('click', renderPedSearch)
document
  .querySelector('.searchPedPage .pedInp')
  .addEventListener('keydown', (e) => {
    if (e.key == 'Enter') {
      renderPedSearch()
    }
  })

document
  .querySelector('.searchCarPage .carBtn')
  .addEventListener('click', renderCarSearch)
document
  .querySelector('.searchCarPage .carInp')
  .addEventListener('keydown', (e) => {
    if (e.key == 'Enter') {
      renderCarSearch()
    }
  })

document.querySelector('.courtPage .pedBtn').addEventListener('click', () => {
  findPedInCourt(document.querySelector('.courtPage .pedInp').value)
})
document
  .querySelector('.courtPage .pedInp')
  .addEventListener('keydown', function (e) {
    if (e.key == 'Enter') {
      findPedInCourt(this.value)
    }
  })

document
  .querySelector('.shiftPage .startShift')
  .addEventListener('click', function () {
    startShift()
  })

document
  .querySelector('.shiftPage .stopShift')
  .addEventListener('click', function () {
    endShift()
  })

setInterval(() => {
  updateCurrentShiftDuration()
}, 1000)

// leave space cause prettier sucks (sometimes)
;(async function () {
  // currentID handler
  const config = await getConfig()
  setInterval(() => {
    if (document.visibilityState == 'visible' && config.showCurrentID) {
      displayCurrentID(
        config.autoShowCurrentID,
        document.querySelector('.currentID').dataset.index
          ? parseInt(document.querySelector('.currentID').dataset.index)
          : 0
      )
    }
  }, 5000)

  // static language replace
  if (config.replaceStaticWithCustomLanguage) {
    const language = await getLanguage()
    for (const headerItem of Object.keys(language.header)) {
      document.querySelector(`.header .${headerItem}`).innerHTML =
        language.header[headerItem]
    }
    document
      .querySelectorAll('.content .alphabetPage .container .label')
      .forEach((label, key) => {
        const langItem =
          language.content.alphabetPage[
            Object.keys(language.content.alphabetPage)[key]
          ]
        label.querySelector('.name').innerHTML = langItem.name
        for (const i in langItem.list) {
          label.querySelectorAll('.item .word')[i].innerHTML = langItem.list[i]
        }
      })

    const pagesWithStandardInpContainer = [
      'searchPedPage',
      'searchCarPage',
      'courtPage',
    ]
    for (const page of pagesWithStandardInpContainer) {
      document.querySelector(
        `.content .${page} .inpContainer input`
      ).placeholder = language.content[page].inpContainer.input
      document.querySelector(
        `.content .${page} .inpContainer button`
      ).innerHTML = language.content[page].inpContainer.button
    }

    document.querySelector(
      '.content .shiftPage .btnContainer .startShift'
    ).innerHTML = language.content.shiftPage.btnContainer.startShift
    document.querySelector(
      '.content .shiftPage .btnContainer .stopShift'
    ).innerHTML = language.content.shiftPage.btnContainer.stopShift
    document.querySelector('.content .shiftPage .shiftsTitle').innerHTML =
      language.content.shiftPage.shifts

    document.querySelector(
      '.content .searchPedPage .citationReport .result .title > div'
    ).innerHTML = language.content.searchPedPage.citations
    document.querySelector(
      '.content .searchPedPage .arrestReport .result .title > div'
    ).innerHTML = language.content.searchPedPage.arrests
    document.querySelector(
      '.content .searchPedPage .result .title button:not(.close)'
    ).innerHTML = language.content.report.submit
    document.querySelector(
      '.content .searchPedPage .result .title button.close'
    ).innerHTML = language.content.report.close
    document.querySelector(
      '.content .searchPedPage .result .description'
    ).placeholder = language.content.report.description

    document.querySelector(
      '.content .shiftPage .result .title button.submit'
    ).innerHTML = language.content.report.submit
    document.querySelector(
      '.content .shiftPage .result .title button.close'
    ).innerHTML = language.content.report.close
    document.querySelector(
      '.content .shiftPage .result .title button.delete'
    ).innerHTML = language.content.report.delete
    document.querySelector(
      '.content .shiftPage .result label[for=incidentDescription]'
    ).innerHTML = language.content.report.description
    document.querySelector(
      '.content .shiftPage .result label[for=incidentNumber]'
    ).innerHTML = language.content.report.incidentNumber

    document.querySelector('.overlay .customizationLink').innerHTML =
      language.overlay.customizationLink
    document.querySelector('.overlay .showCurrentID').innerHTML =
      language.overlay.currentID.show
    document.querySelector('.overlay .closeCurrentID').innerHTML =
      language.overlay.currentID.close
    document.querySelector('.overlay .hideCurrentID').innerHTML =
      language.overlay.currentID.hide
    document.querySelector('.overlay .currentID .title .sa').innerHTML =
      language.overlay.currentID.sa
    document.querySelector('.overlay .currentID .title .dl').innerHTML =
      language.overlay.currentID.dl
  }
})()

// clear localStorage's config and language
localStorage.removeItem('config')
localStorage.removeItem('language')

//funcs
async function goToPage(name) {
  const config = await getConfig()

  document.querySelectorAll('.content > *').forEach((page) => {
    page.classList.add('hidden')
  })
  document.querySelectorAll('.header button').forEach((page) => {
    page.classList.remove('selected')
  })
  document.querySelector(`.content .${name}Page`).classList.remove('hidden')
  document.querySelector(`.header .${name}`).classList.add('selected')
  localStorage.setItem('lastPage', name)

  if (!config.showCustomizationLink || name == 'map') {
    document
      .querySelector('.overlay .customizationLink')
      .classList.add('hidden')
  } else {
    document
      .querySelector('.overlay .customizationLink')
      .classList.remove('hidden')
  }

  if (name == 'map') {
    mapScroll = JSON.parse(localStorage.getItem('mapScroll'))
    document
      .querySelector('.mapPage iframe')
      .contentWindow.scrollTo(mapScroll.x, mapScroll.y)
  } else if (name == 'searchPed') {
    document.querySelector('.searchPedPage .pedInp').focus()
    document.querySelector('.searchPedPage .pedInp').select()
  } else if (name == 'searchCar') {
    document.querySelector('.searchCarPage .carInp').focus()
    document.querySelector('.searchCarPage .carInp').select()
  } else if (name == 'court') {
    await renderCourt()
  } else if (name == 'shift') {
    await renderShiftPage()
  }
}

async function searchForPed(pedName) {
  const pedData = await (await fetch('/data/peds')).json()
  for (ped of pedData) {
    if (ped.name.toLowerCase() == pedName.toLowerCase()) {
      return ped
    }
  }
  return null
}

async function searchForCar(licensePlate) {
  const carData = await (await fetch('/data/cars')).json()
  for (car of carData) {
    if (car.licensePlate.toLowerCase() == licensePlate.toLowerCase()) {
      return car
    }
  }
  return null
}

function createLabelElement(key, value, onClick = null) {
  const labelEl = document.createElement('div')
  labelEl.classList.add('label')
  const keyEl = document.createElement('div')
  keyEl.classList.add('key')
  keyEl.innerHTML = key
  const valueEl = document.createElement('div')
  valueEl.classList.add('value')
  valueEl.innerHTML = value
  labelEl.appendChild(keyEl)
  labelEl.appendChild(valueEl)
  if (typeof onClick == 'function') {
    labelEl.id = Math.random().toString(36).replace(/^0\./, '_')
    labelEl.addEventListener('click', onClick)
    labelEl.style.cursor = 'pointer'
    labelEl.style.transition = '50ms linear'
    const style = document.createElement('style')
    style.innerHTML = `#${labelEl.id} { border: 2px solid transparent; } #${labelEl.id}:hover { border-color: var(--second-accent-color);  }`
    document.body.appendChild(style)
  }
  return labelEl
}

async function renderPedSearch() {
  const config = await getConfig()
  const language = await getLanguage()
  const langPed = language.content.searchPedPage
  const langValues = language.content.values

  const ped = await searchForPed(
    document.querySelector('.searchPedPage .pedInp').value
  )

  const lc = document.querySelector(
    '.searchPedPage .resultContainer .labelContainer'
  )
  lc.innerHTML = ''

  const cac = document.querySelector(
    '.searchPedPage .resultContainer .citationArrestContainer'
  )
  cac.innerHTML = ''

  if (!ped) {
    return (document.querySelector(
      '.searchPedPage .resultContainer .name'
    ).innerHTML = langPed.resultContainer.pedNotFound)
  }
  document.querySelector('.searchPedPage .resultContainer .name').innerHTML =
    ped.name

  lc.appendChild(
    createLabelElement(langPed.resultContainer.dateOfBirth, ped.birthday)
  )
  lc.appendChild(
    createLabelElement(
      langPed.resultContainer.gender,
      tryLanguageValue(ped.gender, langValues)
    )
  )
  lc.appendChild(
    createLabelElement(
      langPed.resultContainer.licenseStatus,
      ped.licenseStatus != 'Valid' && config.warningColorsForPedCarSearch
        ? ped.licenseData
          ? `<a style="color: var(--warning-color); pointer-events: none;">${tryLanguageValue(
              ped.licenseStatus,
              langValues
            )} ${langPed.resultContainer.for} ${ped.licenseData}</a>`
          : `<a style="color: var(--warning-color); pointer-events: none;">${tryLanguageValue(
              ped.licenseStatus,
              langValues
            )}</a>`
        : tryLanguageValue(ped.licenseStatus, langValues)
    )
  )
  lc.appendChild(
    createLabelElement(
      langPed.resultContainer.warrant,
      ped.isWanted == 'True'
        ? config.warningColorsForPedCarSearch
          ? `<a style="color: var(--warning-color); pointer-events: none;">${ped.warrantText}</a>`
          : ped.warrantText
        : langValues.none
    )
  )
  lc.appendChild(
    createLabelElement(
      langPed.resultContainer.probation,
      ped.probation != 'No' && config.warningColorsForPedCarSearch
        ? `<a style="color: var(--warning-color); pointer-events: none;">${tryLanguageValue(
            ped.probation,
            langValues
          )}</a>`
        : tryLanguageValue(ped.probation, langValues)
    )
  )
  lc.appendChild(
    createLabelElement(
      langPed.resultContainer.parole,
      ped.parole != 'No' && config.warningColorsForPedCarSearch
        ? `<a style="color: var(--warning-color); pointer-events: none;">${tryLanguageValue(
            ped.parole,
            langValues
          )}</a>`
        : tryLanguageValue(ped.parole, langValues)
    )
  )
  const cautions = []

  if (
    ped.relationshipGroup &&
    ped.relationshipGroup.toLowerCase().includes('gang')
  ) {
    cautions.push(
      langPed.resultContainer.cautions.gangAffiliation
        ? langPed.resultContainer.cautions.gangAffiliation
        : 'Gang Affiliation'
    )
  }

  if (cautions.length) {
    for (const i in cautions) {
      cautions[
        i
      ] = `<a style="color: var(--warning-color); pointer-events: none;">• ${cautions[i]}</a>`
    }

    lc.appendChild(
      createLabelElement(langPed.resultContainer.caution, cautions.join('<br>'))
    )
  }

  const citations = ped.citations.length ? ped.citations : [langValues.none]
  for (let i in citations) {
    citations[i] = `• ${citations[i]}`
  }
  const arrests = ped.arrests.length ? ped.arrests : [langValues.none]
  for (let i in arrests) {
    arrests[i] = `• ${arrests[i]}`
  }
  cac.appendChild(
    createLabelElement(langPed.citations, citations.join('<br>'), () => {
      openCitationReport()
    })
  )
  cac.appendChild(
    createLabelElement(langPed.arrests, arrests.join('<br>'), () => {
      openArrestReport()
    })
  )
}

async function renderCarSearch() {
  const config = await getConfig()
  const language = await getLanguage()
  const langCar = language.content.searchCarPage
  const langValues = language.content.values

  const car = await searchForCar(
    document.querySelector('.searchCarPage .carInp').value
  )
  const lc = document.querySelector(
    '.searchCarPage .resultContainer .labelContainer'
  )
  lc.innerHTML = ''

  if (!car || car.plateStatus == 'Invalid') {
    return (document.querySelector(
      '.searchCarPage .resultContainer .name'
    ).innerHTML = langCar.resultContainer.vehicleNotFound)
  }
  document.querySelector('.searchCarPage .resultContainer .name').innerHTML =
    car.licensePlate

  lc.appendChild(createLabelElement(langCar.resultContainer.model, car.model))
  lc.appendChild(
    createLabelElement(
      langCar.resultContainer.color,
      car.color
        ? `<div style="background-color: rgb(${car.color.split('-')[0]},${
            car.color.split('-')[1]
          },${
            car.color.split('-')[2]
          }); width: 150px; height: 25px;  border: 2px solid var(--main-color)"></div>`
        : language.content.values.unknown
    )
  )
  lc.appendChild(
    createLabelElement(
      langCar.resultContainer.registration,
      car.registration != 'Valid' && config.warningColorsForPedCarSearch
        ? `<a style="color: var(--warning-color); pointer-events: none;">${tryLanguageValue(
            car.registration,
            langValues
          )}</a>`
        : tryLanguageValue(car.registration, langValues)
    )
  )
  lc.appendChild(
    createLabelElement(
      langCar.resultContainer.insurance,
      car.insurance != 'Valid' && config.warningColorsForPedCarSearch
        ? `<a style="color: var(--warning-color); pointer-events: none;">${tryLanguageValue(
            car.insurance,
            langValues
          )}</a>`
        : tryLanguageValue(car.insurance, langValues)
    )
  )
  lc.appendChild(
    createLabelElement(
      langCar.resultContainer.stolen,
      car.stolen != 'No' && config.warningColorsForPedCarSearch
        ? `<a style="color: var(--warning-color); pointer-events: none;">${tryLanguageValue(
            car.stolen,
            langValues
          )}</a>`
        : tryLanguageValue(car.stolen, langValues)
    )
  )
  lc.appendChild(
    createLabelElement(langCar.resultContainer.owner, car.owner, () => {
      openPedInSearchPedPage(car.owner)
    })
  )
}

function openPedInSearchPedPage(name) {
  goToPage('searchPed')
  document.querySelector('.searchPedPage .pedInp').value = name
  document.querySelector('.searchPedPage .pedBtn').click()
}

async function openCitationReport() {
  const language = await getLanguage()

  document
    .querySelector('.searchPedPage .citationReport')
    .classList.remove('hidden')
  const options = document.querySelector(
    '.searchPedPage .citationReport .options'
  )
  options.innerHTML = ''

  const citationOptions = await (await fetch('/data/citationOptions')).json()

  document
    .querySelectorAll('.searchPedPage .citationReport .result .btn')
    .forEach((oldBtn) => {
      oldBtn.remove()
    })

  disableCitationSubmitButton()

  document.querySelector(
    '.searchPedPage .citationReport .result .description'
  ).value = ''

  for (group of citationOptions) {
    const details = document.createElement('details')
    const summary = document.createElement('summary')
    summary.innerHTML = group.name
    details.appendChild(summary)
    for (charge of group.charges) {
      const btn = document.createElement('button')
      btn.dataset.charge = JSON.stringify(charge)
      btn.innerHTML = charge.name
      btn.addEventListener('click', function () {
        this.blur()
        addCitation(this.dataset.charge)
        disableCitationSubmitButton()
      })
      btn.addEventListener('mouseover', async function () {
        this.dataset.open = 'true'
        await sleep(150)
        if (this.dataset.open == 'false') return
        this.innerHTML =
          JSON.parse(this.dataset.charge).minFine ==
          JSON.parse(this.dataset.charge).maxFine
            ? `${
                JSON.parse(this.dataset.charge).name
              }<br><a style="opacity: 0.75; pointer-events: none;">${
                language.content.fine
              }: ${language.content.currency}${
                JSON.parse(this.dataset.charge).minFine
              }</a>`
            : `${
                JSON.parse(this.dataset.charge).name
              }<br><a style="opacity: 0.75; pointer-events: none;">${
                language.content.fine
              }: ${language.content.currency}${
                JSON.parse(this.dataset.charge).minFine
              }-${language.content.currency}${
                JSON.parse(this.dataset.charge).maxFine
              }</a>`
      })
      btn.addEventListener('mouseleave', function () {
        this.innerHTML = JSON.parse(this.dataset.charge).name
        this.dataset.open = 'false'
      })
      details.appendChild(btn)
    }
    options.appendChild(details)
  }
}

async function openArrestReport() {
  const language = await getLanguage()

  document
    .querySelector('.searchPedPage .arrestReport')
    .classList.remove('hidden')
  const options = document.querySelector(
    '.searchPedPage .arrestReport .options'
  )
  options.innerHTML = ''

  const arrestOptions = await (await fetch('/data/arrestOptions')).json()

  document
    .querySelectorAll('.searchPedPage .arrestReport .result .btn')
    .forEach((oldBtn) => {
      oldBtn.remove()
    })

  disableArrestSubmitButton()

  document.querySelector(
    '.searchPedPage .arrestReport .result .description'
  ).value = ''

  for (group of arrestOptions) {
    const details = document.createElement('details')
    const summary = document.createElement('summary')
    summary.innerHTML = group.name
    details.appendChild(summary)
    for (charge of group.charges) {
      const btn = document.createElement('button')
      btn.dataset.charge = JSON.stringify(charge)
      btn.innerHTML = charge.name
      btn.addEventListener('click', function () {
        this.blur()
        addArrest(this.dataset.charge)
        disableArrestSubmitButton()
      })
      btn.addEventListener('mouseover', async function () {
        this.dataset.open = 'true'
        await sleep(150)
        if (this.dataset.open == 'false') return
        const fineString =
          JSON.parse(this.dataset.charge).minFine ==
          JSON.parse(this.dataset.charge).maxFine
            ? `${language.content.fine}: ${language.content.currency}${
                JSON.parse(this.dataset.charge).minFine
              }`
            : `${language.content.fine}: ${language.content.currency}${
                JSON.parse(this.dataset.charge).minFine
              } - ${language.content.currency}${
                JSON.parse(this.dataset.charge).maxFine
              }`
        const jailString =
          JSON.parse(this.dataset.charge).minMonths ==
          JSON.parse(this.dataset.charge).maxMonths
            ? `${language.content.jail}: ${monthsToYearsAndMonths(
                JSON.parse(this.dataset.charge).minMonths,
                language
              )}`
            : `${language.content.jail}: ${monthsToYearsAndMonths(
                JSON.parse(this.dataset.charge).minMonths,
                language
              )} - ${monthsToYearsAndMonths(
                JSON.parse(this.dataset.charge).maxMonths,
                language
              )}`
        this.innerHTML = `${
          JSON.parse(this.dataset.charge).name
        }<br><a style="opacity: 0.75; pointer-events: none;">${fineString} | ${jailString}</a>`
      })
      btn.addEventListener('mouseleave', function () {
        this.innerHTML = JSON.parse(this.dataset.charge).name
        this.dataset.open = 'false'
      })
      details.appendChild(btn)
    }
    options.appendChild(details)
  }
}

function addCitation(charge) {
  const resultEl = document.querySelector(
    '.searchPedPage .citationReport .result .charges'
  )
  const btn = document.createElement('button')
  btn.innerHTML = JSON.parse(charge).name
  btn.dataset.charge = charge
  btn.classList.add('btn')
  btn.addEventListener('click', function () {
    this.remove()
    disableCitationSubmitButton()
  })
  resultEl.append(btn)
}

function addArrest(charge) {
  const resultEl = document.querySelector(
    '.searchPedPage .arrestReport .result .charges'
  )
  const btn = document.createElement('button')
  btn.innerHTML = JSON.parse(charge).name
  btn.dataset.charge = charge
  btn.classList.add('btn')
  btn.addEventListener('click', function () {
    this.remove()
    disableArrestSubmitButton()
  })
  resultEl.append(btn)
}

async function submitCitations() {
  const currentPed = document.querySelector(
    '.searchPedPage .resultContainer .name'
  ).innerHTML
  const citations = []
  const citationsData = []
  for (el of document.querySelectorAll(
    '.searchPedPage .citationReport .result .btn'
  )) {
    citations.push(el.innerHTML)
    citationsData.push(el.dataset.charge)
  }
  await fetch('/post/addCitations', {
    method: 'post',
    body: JSON.stringify({
      name: currentPed,
      citations: citations,
    }),
  })
  const description = document.querySelector(
    '.searchPedPage .citationReport .result .description'
  ).value
  addCitationToCourt(citationsData, currentPed, description)
  closeCitations()
  openPedInSearchPedPage(currentPed)
}

function closeCitations() {
  document
    .querySelector('.searchPedPage .citationReport')
    .classList.add('hidden')
}

async function submitArrests() {
  const currentPed = document.querySelector(
    '.searchPedPage .resultContainer .name'
  ).innerHTML
  const arrests = []
  const arrestsData = []
  for (el of document.querySelectorAll(
    '.searchPedPage .arrestReport .result .btn'
  )) {
    arrests.push(el.innerHTML)
    arrestsData.push(el.dataset.charge)
  }
  await fetch('/post/addArrests', {
    method: 'post',
    body: JSON.stringify({
      name: currentPed,
      arrests: arrests,
    }),
  })
  const description = document.querySelector(
    '.searchPedPage .arrestReport .result .description'
  ).value
  addArrestToCourt(arrestsData, currentPed, description)
  closeArrests()
  openPedInSearchPedPage(currentPed)
}

function closeArrests() {
  document.querySelector('.searchPedPage .arrestReport').classList.add('hidden')
}

async function addCitationToCourt(charges, pedName, description) {
  const language = await getLanguage()
  const nameList = []
  let fullFine = 0
  for (let charge of charges) {
    charge = JSON.parse(charge)
    const fine =
      charge.minFine +
      Math.floor(Math.random() * (charge.maxFine - charge.minFine))
    const outcome = `${language.content.fine}: ${
      language.content.currency
    }${bigNumberToNiceString(fine)}`
    nameList.push(
      `<details><summary onclick="this.blur()">${charge.name}</summary><div style="opacity: 0.75">${outcome}</div></details>`
    )
    fullFine += fine
  }
  const caseNumber = `SA${Math.random().toString().slice(2, 10)}`

  await fetch('/post/addToCourt', {
    method: 'post',
    body: JSON.stringify({
      ped: pedName,
      number: caseNumber,
      charge: nameList.join(''),
      outcome: `${language.content.fine}: ${
        language.content.currency
      }${bigNumberToNiceString(fullFine)}`,
      description: description,
    }),
  })
}

async function addArrestToCourt(charges, pedName, description) {
  const language = await getLanguage()
  const nameList = []
  let fullFine = 0
  let fullJailTimeArr = []
  for (let charge of charges) {
    charge = JSON.parse(charge)
    const jailTime =
      Math.floor(Math.random() * (1 / charge.probation)) != 0
        ? charge.maxMonths == null
          ? Math.floor(Math.random() * 4) != 0
            ? charge.minMonths +
              Math.floor(Math.random() * charge.minMonths * 2)
            : language.content.lifeInPrison
          : charge.minMonths +
            Math.floor(Math.random() * (charge.maxMonths - charge.minMonths))
        : language.content.grantedProbation

    const fine =
      charge.minFine +
      Math.floor(Math.random() * (charge.maxFine - charge.minFine))

    const jailTimeString =
      typeof jailTime == 'number'
        ? monthsToYearsAndMonths(jailTime, language)
        : jailTime

    const outcome = `${language.content.fine}: ${
      language.content.currency
    }${bigNumberToNiceString(fine)}<br>${
      language.content.jail
    }: ${jailTimeString}`
    nameList.push(
      `<details><summary onclick="this.blur()">${charge.name}</summary><div style="opacity: 0.75">${outcome}</div></details>`
    )
    fullFine += fine
    fullJailTimeArr.push(jailTime)
  }
  let fullJailTime = 0
  for (const jailTimeEl of fullJailTimeArr) {
    if (jailTimeEl == language.content.lifeInPrison) {
      fullJailTime = language.content.lifeInPrison
      break
    }
    if (jailTimeEl == language.content.grantedProbation) continue
    fullJailTime += jailTimeEl
  }

  const caseNumber = `SA${Math.random().toString().slice(2, 10)}`

  await fetch('/post/addToCourt', {
    method: 'post',
    body: JSON.stringify({
      ped: pedName,
      number: caseNumber,
      charge: nameList.join(''),
      outcome: `${language.content.fine}: ${
        language.content.currency
      }${bigNumberToNiceString(fullFine)}<br>${language.content.jail}: ${
        typeof fullJailTime == 'number'
          ? monthsToYearsAndMonths(fullJailTime, language)
          : fullJailTime
      }`,
      description: description,
    }),
  })
}

async function renderCourt() {
  const list = document.querySelector('.courtPage .list')
  list.innerHTML = ''
  const court = await (await fetch('/data/court')).json()
  const language = await getLanguage()
  const langCourt = language.content.courtPage

  court.reverse()
  if (!court.length) {
    const title = document.createElement('div')
    title.classList.add('title')
    title.innerHTML = langCourt.resultContainer.courtCaseNotFound
    list.appendChild(title)
    return
  }
  for (const courtCase of court) {
    const el = document.createElement('div')
    el.classList.add('container')
    el.appendChild(
      createLabelElement(langCourt.resultContainer.caseNumber, courtCase.number)
    ).classList.add('caseNumber')
    el.appendChild(
      createLabelElement(
        langCourt.resultContainer.defendant,
        courtCase.ped,
        () => {
          openPedInSearchPedPage(courtCase.ped)
        }
      )
    ).classList.add('pedName')
    el.appendChild(
      createLabelElement(langCourt.resultContainer.offense, courtCase.charge)
    )
    el.appendChild(
      createLabelElement(langCourt.resultContainer.outcome, courtCase.outcome)
    )
    if (courtCase.description) {
      el.appendChild(
        createLabelElement(
          langCourt.resultContainer.description,
          `<div contenteditable class="description">${courtCase.description
            .split('\n')
            .join('<br>')}</div>`
        )
      )
      el.querySelector('.description').addEventListener(
        'input',
        async function () {
          await fetch('/post/updateCourtDescription', {
            method: 'POST',
            body: JSON.stringify({
              number: el.querySelector('.caseNumber .value').innerHTML,
              description: this.innerHTML,
            }),
          })
        }
      )
    }
    list.appendChild(el)
  }
}

function monthsToYearsAndMonths(input, language) {
  if (input == null) return language.content.life
  return input % 12 != 0
    ? Math.floor(input / 12) != 0
      ? `${Math.floor(input / 12)}${language.content.year} ${input % 12}${
          language.content.month
        }`
      : `${input % 12}${language.content.month}`
    : `${input / 12}${language.content.year}`
}

function bigNumberToNiceString(number) {
  const arr = number.toString().split('').reverse()
  for (const i in arr) {
    if (i % 3 == 0 && i != 0) {
      arr[i] += ','
    }
  }
  return arr.reverse().join('')
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function findPedInCourt(pedName) {
  if (!pedName) return renderCourt()
  await renderCourt()
  const language = await getLanguage()

  const courtContainers = document.querySelectorAll(
    '.courtPage .list .container'
  )
  const elements = []
  for (const caseContainer of courtContainers) {
    if (
      caseContainer.querySelector('.pedName .value').innerHTML.toLowerCase() ==
      pedName.toLowerCase()
    ) {
      elements.push(caseContainer)
    }
  }
  const list = document.querySelector('.courtPage .list')
  list.innerHTML = ''
  if (!elements.length) {
    const title = document.createElement('div')
    title.classList.add('title')
    title.innerHTML =
      language.content.courtPage.resultContainer.courtCaseNotFoundForDefendant
    list.appendChild(title)
    return
  }
  for (container of elements) {
    list.appendChild(container)
  }
}

async function startShift() {
  const currentDate = new Date()
  await fetch('/post/updateCurrentShift', {
    method: 'post',
    body: JSON.stringify({
      start: currentDate.getTime(),
      notes: '',
      courtCases: [],
      incidents: [],
    }),
  })
  renderShiftPage()
}

async function endShift() {
  const currentDate = new Date()
  const currentData = await (await fetch('/data/shift')).json()
  await fetch('/post/updateCurrentShift', {
    method: 'post',
    body: JSON.stringify(null),
  })
  await fetch('/post/addShift', {
    method: 'post',
    body: JSON.stringify({
      ...currentData.currentShift,
      end: currentDate.getTime(),
    }),
  })
  renderShiftPage()
}

async function renderShiftPage() {
  const currentShiftEl = document.querySelector('.shiftPage .currentShift')
  const list = document.querySelector('.shiftPage .list')
  list.innerHTML = ''
  currentShiftEl.innerHTML = ''

  const data = await (await fetch('/data/shift')).json()
  const language = await getLanguage()
  const langShift = language.content.shiftPage

  document.querySelector('.shiftPage .startShift').disabled =
    !!data.currentShift
  document.querySelector('.shiftPage .stopShift').disabled = !data.currentShift

  if (data.currentShift) {
    const date = new Date(data.currentShift.start)
    currentShiftEl.dataset.currentShift = JSON.stringify(data.currentShift)
    currentShiftEl.appendChild(
      createLabelElement(
        langShift.resultContainer.start,
        `${date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()}:${
          date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()
        }`
      )
    )
    currentShiftEl
      .appendChild(
        createLabelElement(
          langShift.resultContainer.duration,
          msToDisplay(getDuration(date.getTime()))
        )
      )
      .classList.add('currentShiftDuration')
    const courtCases = []
    for (const courtCase of data.currentShift.courtCases) {
      courtCases.push(
        `<a class="courtCaseValue" onclick="goToCourtCaseFromValue('${courtCase}')">${courtCase}</a>`
      )
    }
    currentShiftEl.appendChild(
      createLabelElement(
        langShift.resultContainer.courtCases,
        data.currentShift.courtCases.length
          ? courtCases.join('<br>')
          : language.content.values.none
      )
    )
    const incidents = []
    for (const incident of data.currentShift.incidents) {
      incidents.push(`• ${incident.number}`)
    }
    currentShiftEl.appendChild(
      createLabelElement(
        langShift.resultContainer.incidents,
        data.currentShift.incidents.length
          ? incidents.join('<br>')
          : language.content.values.none,
        function () {
          openIncidentReports(false, data.currentShift)
        }
      )
    )
    currentShiftEl.appendChild(
      createLabelElement(
        langShift.resultContainer.notes,
        `<textarea class="currentShiftNotes">${data.currentShift.notes}</textarea>`
      )
    )
    document
      .querySelector('.shiftPage .currentShift .currentShiftNotes')
      .addEventListener('input', async function () {
        await fetch('/post/updateCurrentShiftNotes', {
          method: 'post',
          body: this.value,
        })
      })
    document.querySelector('.shiftPage .currentShiftTitle').innerHTML =
      langShift.currentShift
    document.querySelector('.shiftPage .currentShiftTitle').style.color =
      'unset'
  } else {
    document.querySelector('.shiftPage .currentShiftTitle').innerHTML =
      langShift.offDuty
    document.querySelector('.shiftPage .currentShiftTitle').style.color =
      'var(--warning-color)'
  }

  data.shifts.length
    ? document
        .querySelector('.shiftPage .shiftsTitle')
        .classList.remove('hidden')
    : document.querySelector('.shiftPage .shiftsTitle').classList.add('hidden')

  for (const shift of data.shifts.reverse()) {
    const labelContainer = document.createElement('div')
    labelContainer.classList.add('container')
    const startDate = new Date(shift.start)
    const endDate = new Date(shift.end)
    const duration = shift.end - shift.start
    labelContainer.appendChild(
      createLabelElement(
        langShift.resultContainer.start,
        `${
          startDate.getHours() < 10
            ? `0${startDate.getHours()}`
            : startDate.getHours()
        }:${
          startDate.getMinutes() < 10
            ? `0${startDate.getMinutes()}`
            : startDate.getMinutes()
        }`
      )
    )
    labelContainer.appendChild(
      createLabelElement(
        langShift.resultContainer.end,
        `${
          endDate.getHours() < 10
            ? `0${endDate.getHours()}`
            : endDate.getHours()
        }:${
          endDate.getMinutes() < 10
            ? `0${endDate.getMinutes()}`
            : endDate.getMinutes()
        }`
      )
    )
    labelContainer.appendChild(
      createLabelElement(
        langShift.resultContainer.duration,
        msToDisplay(duration)
      )
    )
    const courtCases = []
    for (const courtCase of shift.courtCases) {
      courtCases.push(
        `<a class="courtCaseValue" onclick="goToCourtCaseFromValue('${courtCase}')">${courtCase}</a>`
      )
    }
    labelContainer.appendChild(
      createLabelElement(
        langShift.resultContainer.courtCases,
        courtCases.length
          ? courtCases.join('<br>')
          : language.content.values.none
      )
    )

    const incidents = []
    if (shift.incidents && shift.incidents.length) {
      for (const incident of shift.incidents) {
        incidents.push(`• ${incident.number}`)
      }
      labelContainer.appendChild(
        createLabelElement(
          langShift.resultContainer.incidents,
          incidents.join('<br>'),
          function () {
            openIncidentReports(true, shift)
          }
        )
      )
    } else {
      labelContainer.appendChild(
        createLabelElement(
          langShift.resultContainer.incidents,
          language.content.values.none
        )
      )
    }

    labelContainer.appendChild(
      createLabelElement(
        langShift.resultContainer.notes,
        `${
          shift.notes
            ? `<div class="shiftNotes">${shift.notes
                .split('\n')
                .join('<br>')}</div>`
            : language.content.values.none
        }`
      )
    )
    list.appendChild(labelContainer)
  }
}

async function openIncidentReports(disableAddIncidentButton = false, shift) {
  const incidentReportEl = document.querySelector('.shiftPage .incidentReport')
  incidentReportEl.classList.remove('hidden')
  updateIncidentReportOptions(disableAddIncidentButton, shift)
}

async function updateIncidentReportOptions(
  disableAddIncidentButton = false,
  shift
) {
  const language = await getLanguage()
  const incidentReportEl = document.querySelector('.shiftPage .incidentReport')
  incidentReportEl.querySelector('.options').innerHTML = ''
  incidentReportEl
    .querySelector('.result #incidentDescription')
    .setAttribute('readonly', true)
  incidentReportEl.querySelector('.result #incidentDescription').value = ''
  incidentReportEl.querySelector('.result #incidentNumber').value = ''
  incidentReportEl.querySelector('.result .title .submit').disabled = true
  incidentReportEl.querySelector('.result .title .delete').disabled = true
  if (!disableAddIncidentButton) {
    const addIncidentBtn = document.createElement('button')
    addIncidentBtn.innerHTML = language.content.report.newIncident
    addIncidentBtn.addEventListener('click', function () {
      this.blur()
      createNewIncidentReport()
    })
    incidentReportEl.querySelector('.options').appendChild(addIncidentBtn)
    const line = document.createElement('div')
    line.classList.add('line')
    incidentReportEl.querySelector('.options').appendChild(line)
  }
  for (const incident of shift.incidents) {
    const button = document.createElement('button')
    button.innerHTML = incident.number
    button.addEventListener('click', function () {
      incidentReportEl.querySelector('.result #incidentNumber').value =
        incident.number
      incidentReportEl.querySelector('.result #incidentDescription').value =
        incident.description
      disableAddIncidentButton
        ? incidentReportEl
            .querySelector('.result #incidentDescription')
            .setAttribute('readonly', true)
        : incidentReportEl
            .querySelector('.result #incidentDescription')
            .removeAttribute('readonly')
      incidentReportEl.querySelector('.result .title .submit').disabled =
        disableAddIncidentButton
      incidentReportEl.querySelector('.result .title .delete').disabled =
        disableAddIncidentButton
    })
    incidentReportEl.querySelector('.options').appendChild(button)
  }
}

async function submitIncident() {
  const shift = await (await fetch('/data/shift')).json()
  const oldCurrentShift = shift.currentShift
  const numberInpEl = document.querySelector(
    '.shiftPage .incidentReport .result #incidentNumber'
  )
  const descriptionInpEl = document.querySelector(
    '.shiftPage .incidentReport .result #incidentDescription'
  )
  for (const i in oldCurrentShift.incidents) {
    if (oldCurrentShift.incidents[i].number == numberInpEl.value) {
      oldCurrentShift.incidents[i] = {
        number: numberInpEl.value,
        description: descriptionInpEl.value,
      }
      await fetch('/post/updateCurrentShift', {
        method: 'post',
        body: JSON.stringify(oldCurrentShift),
      })
      updateIncidentReportOptions(false, oldCurrentShift)
      break
    }
  }
}

async function deleteIncident() {
  const shift = await (await fetch('/data/shift')).json()
  const oldCurrentShift = shift.currentShift
  const numberInpEl = document.querySelector(
    '.shiftPage .incidentReport .result #incidentNumber'
  )
  for (const i in oldCurrentShift.incidents) {
    if (oldCurrentShift.incidents[i].number == numberInpEl.value) {
      oldCurrentShift.incidents.splice(i, 1)
      await fetch('/post/updateCurrentShift', {
        method: 'post',
        body: JSON.stringify(oldCurrentShift),
      })
      updateIncidentReportOptions(false, oldCurrentShift)
      break
    }
  }
}

async function createNewIncidentReport() {
  const number = `${new Date()
    .getFullYear()
    .toString()
    .slice(2)}-${Math.random().toString().slice(2, 7)}`

  const shift = await (await fetch('/data/shift')).json()
  const currentShift = shift.currentShift
  currentShift.incidents.push({ number: number, description: '' })
  await fetch('/post/updateCurrentShift', {
    method: 'post',
    body: JSON.stringify(currentShift),
  })
  updateIncidentReportOptions(false, currentShift)
}

async function goToCourtCaseFromValue(caseNumber) {
  await goToPage('court')
  if (!caseNumber) return renderCourt()
  const courtContainers = document.querySelectorAll(
    '.courtPage .list .container'
  )
  const elements = []
  for (const caseContainer of courtContainers) {
    if (
      caseContainer.querySelector('.caseNumber .value').innerHTML == caseNumber
    ) {
      elements.push(caseContainer)
    }
  }
  const list = document.querySelector('.courtPage .list')
  list.innerHTML = ''
  if (!elements.length) {
    const title = document.createElement('div')
    title.classList.add('title')
    title.innerHTML = 'No Court Cases Found With This Number'
    list.appendChild(title)
    return
  }
  for (container of elements) {
    list.appendChild(container)
  }
}

function msToDisplay(ms) {
  let seconds = (ms / 1000).toFixed(0)
  let minutes = Math.round(seconds / 60)
  let hours = '00'

  hours = Math.floor(minutes / 60)
  hours = hours >= 10 ? hours : '0' + hours
  minutes = minutes - hours * 60
  minutes = minutes >= 10 ? minutes : '0' + minutes

  seconds = Math.floor(seconds % 60)
  seconds = seconds >= 10 ? seconds : '0' + seconds
  return hours + ':' + minutes
}

function getDuration(start) {
  return new Date().getTime() - start
}

function updateCurrentShiftDuration() {
  const el = document.querySelector(
    '.shiftPage .currentShift .currentShiftDuration .value'
  )
  if (el) {
    const currentShiftData = JSON.parse(
      document.querySelector('.shiftPage .currentShift').dataset.currentShift
    )
    el.innerHTML = msToDisplay(getDuration(currentShiftData.start))
  }
}

function disableCitationSubmitButton() {
  document.querySelector(
    '.searchPedPage .citationReport .result .title button:not(.close)'
  ).disabled = !document.querySelectorAll(
    '.searchPedPage .citationReport .result .charges button'
  ).length
}

function disableArrestSubmitButton() {
  document.querySelector(
    '.searchPedPage .arrestReport .result .title button:not(.close)'
  ).disabled = !document.querySelectorAll(
    '.searchPedPage .arrestReport .result .charges button'
  ).length
}

async function displayCurrentID(autoShowCurrentID, index) {
  const file = await (await fetch('/data/currentID')).text()

  document.querySelector('.currentID').dataset.index = index

  if (!file) {
    document.querySelector('.currentID').classList.add('hidden')
    document.querySelector('.showCurrentID-container').classList.add('hidden')
  } else {
    const language = await getLanguage()
    if (!file.split(';')[index]) return displayCurrentID(autoShowCurrentID, 0)
    const el = document.querySelector('.currentID')
    if (el.classList.contains('hidden') && !autoShowCurrentID) {
      document
        .querySelector('.showCurrentID-container')
        .classList.remove('hidden')
      document
        .querySelector('.currentID .hideCurrentID')
        .classList.remove('hidden')
    } else {
      el.classList.remove('hidden')
    }
    const data = file.split(';')[index].split(',')
    el.querySelector('.properties .lname').innerHTML = data[0].split(' ')[1]
    el.querySelector('.properties .fname').innerHTML = data[0].split(' ')[0]
    el.querySelector('.properties .dob').innerHTML = data[1]
    el.querySelector('.properties .gender').innerHTML = tryLanguageValue(
      data[2],
      language.content.values
    )

    if (file.split(';').length - 1 > 1) {
      document
        .querySelector('.currentID .nextCurrentID')
        .classList.remove('hidden')
      document.querySelector('.currentID .nextCurrentID').innerHTML = `${
        language.overlay.currentID.next
      } [${index + 1}/${file.split(';').length - 1}]`
    } else {
      document
        .querySelector('.currentID .nextCurrentID')
        .classList.add('hidden')
    }

    const pedTypeArr = [
      'driver',
      'frontPassenger',
      'rlPassenger',
      'rrPassenger',
    ]

    document.querySelector('.currentID .currentIDPedType').innerHTML =
      data[3] != 0
        ? data[3] - 1 < pedTypeArr.length
          ? language.overlay.currentID.pedTypes[pedTypeArr[data[3] - 1]]
          : language.overlay.currentID.pedTypes.passenger
        : language.overlay.currentID.pedTypes.stoppedPed
  }
}

function showCurrentID() {
  document.querySelector('.currentID').classList.remove('hidden')
  document.querySelector('.showCurrentID-container').classList.add('hidden')
}

async function closeCurrentID() {
  await fetch('/post/removeCurrentID', {
    method: 'POST',
    body: parseInt(document.querySelector('.currentID').dataset.index),
  })
  displayCurrentID(
    null,
    parseInt(document.querySelector('.currentID').dataset.index)
  )
}

function nextCurrentID() {
  displayCurrentID(
    null,
    parseInt(document.querySelector('.currentID').dataset.index) + 1
  )
}

function hideCurrentID() {
  document.querySelector('.currentID').classList.add('hidden')
  document.querySelector('.showCurrentID-container').classList.remove('hidden')
}

//? mainly for custom.js
function reassignEventListener(
  selector = '*',
  eventType = 'click',
  cb = function () {
    console.warn('Empty Callback')
  }
) {
  const el = document.querySelector(selector)
  el.parentNode.replaceChild(el.cloneNode(true), el)
  document.querySelector(selector).addEventListener(eventType, cb)
}

function tryLanguageValue(value, langValues) {
  return langValues[value.toLowerCase()]
    ? langValues[value.toLowerCase()]
    : value
}

async function getConfig() {
  if (localStorage.getItem('config')) {
    return JSON.parse(localStorage.getItem('config'))
  }
  const config = await (await fetch('/data/config')).json()
  localStorage.setItem('config', JSON.stringify(config))
  return config
}

async function getLanguage() {
  if (localStorage.getItem('language')) {
    return JSON.parse(localStorage.getItem('language'))
  }
  const language = await (await fetch('/data/language')).json()
  localStorage.setItem('language', JSON.stringify(language))
  return language
}
