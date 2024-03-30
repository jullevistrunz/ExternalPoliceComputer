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
  localStorage.setItem('lastPage', 'shift')
  lastPage = 'shift'
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

  // calloutPage handler
  if (!config.showCalloutPage) {
    document.querySelector('.header .callout').classList.add('hidden')
  } else if (config.autoShowCalloutPage) {
    updateCalloutPage()
    setInterval(() => {
      updateCalloutPage()
    }, config.updateCalloutPageInterval)
  }

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
      '.content .searchPedPage .citationReport .result .headerButtonContainer > div'
    ).innerHTML = language.content.searchPedPage.citations
    document.querySelector(
      '.content .searchPedPage .arrestReport .result .headerButtonContainer > div'
    ).innerHTML = language.content.searchPedPage.arrests
    document.querySelector(
      '.content .searchPedPage .result .headerButtonContainer button:not(.close)'
    ).innerHTML = language.content.report.submit
    document.querySelector(
      '.content .searchPedPage .result .headerButtonContainer button.close'
    ).innerHTML = language.content.report.close
    document.querySelector(
      '.content .searchPedPage .result .description'
    ).placeholder = language.content.report.description
    document.querySelector(
      '.content .searchPedPage .citationReport .searchCharge'
    ).placeholder = language.content.report.searchCitation
    document.querySelector(
      '.content .searchPedPage .arrestReport .searchCharge'
    ).placeholder = language.content.report.searchArrest

    document.querySelector(
      '.content .shiftPage .result .headerButtonContainer button.submit'
    ).innerHTML = language.content.report.submit
    document.querySelector(
      '.content .shiftPage .result .headerButtonContainer button.close'
    ).innerHTML = language.content.report.close
    document.querySelector(
      '.content .shiftPage .result .headerButtonContainer button.delete'
    ).innerHTML = language.content.report.delete
    document.querySelector(
      '.content .shiftPage .result .incidentDescriptionLabel'
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

// search charges
document
  .querySelector('.searchPedPage .citationReport .searchCharge')
  .addEventListener('input', function () {
    renderCitationArrestOptions('citation', this.value)
  })
document
  .querySelector('.searchPedPage .arrestReport .searchCharge')
  .addEventListener('input', function () {
    renderCitationArrestOptions('arrest', this.value)
  })

let calloutPageInterval

  // load active plugins
;(async function () {
  const plugins = await (await fetch('/data/activePlugins')).json()
  for (const plugin of plugins) {
    const files = await (
      await fetch(`data/filesInPluginDir?name=${plugin}`)
    ).json()

    for (const file of files) {
      if (file.endsWith('.css')) {
        const el = document.createElement('link')
        el.rel = 'stylesheet'
        el.href = `/plugins/${plugin}/${file}`
        document.head.appendChild(el)
      } else if (file.endsWith('.js')) {
        const el = document.createElement('script')
        el.src = `/plugins/${plugin}/${file}`
        document.body.appendChild(el)
      }
    }
  }
})()

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
  } else if (name == 'callout') {
    if (!config.autoShowCalloutPage) {
      updateCalloutPage()
      calloutPageInterval = setInterval(() => {
        updateCalloutPage()
      }, config.updateCalloutPageInterval)
    }
  }
  if (calloutPageInterval && name != 'callout') {
    clearInterval(calloutPageInterval)
  }
}

async function searchForPed(pedName) {
  const pedData = await (await fetch('/data/peds')).json()
  for (const ped of pedData) {
    if (ped.name.toLowerCase() == pedName.toLowerCase()) {
      return ped
    }
  }
  return null
}

async function searchForCar(licensePlate) {
  const carData = await (await fetch('/data/cars')).json()
  for (const car of carData) {
    if (car.licensePlate.toLowerCase() == licensePlate.toLowerCase()) {
      return car
    }
  }
  return null
}

async function renderPedSearch() {
  const config = await getConfig()
  const language = await getLanguage()
  const langPed = language.content.searchPedPage
  const langValues = language.content.values

  const informationLabelContainer = document.querySelector(
    '.searchPedPage .resultContainer .informationLabelContainer'
  )
  const citationArrestContainer = document.querySelector(
    '.searchPedPage .resultContainer .citationArrestContainer'
  )
  citationArrestContainer.innerHTML = ''

  const ped = await searchForPed(
    document.querySelector('.searchPedPage .pedInp').value
  )
  if (!ped) {
    document.querySelector('.searchPedPage .resultContainer .name').innerHTML =
      langPed.resultContainer.pedNotFound
    informationLabelContainer.innerHTML = ''
    return
  }

  document.querySelector('.searchPedPage .resultContainer .name').innerHTML =
    ped.name

  const informationLabels = [
    elements.informationLabel(
      langPed.resultContainer.dateOfBirth,
      ped.birthday
    ),
    elements.informationLabel(
      langPed.resultContainer.gender,
      tryLanguageValue(ped.gender, langValues)
    ),
    elements.informationLabel(
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
    ),
    elements.informationLabel(
      langPed.resultContainer.warrant,
      ped.isWanted == 'True'
        ? config.warningColorsForPedCarSearch
          ? `<a style="color: var(--warning-color); pointer-events: none;">${ped.warrantText}</a>`
          : ped.warrantText
        : langValues.none
    ),
    elements.informationLabel(
      langPed.resultContainer.probation,
      ped.probation != 'No' && config.warningColorsForPedCarSearch
        ? `<a style="color: var(--warning-color); pointer-events: none;">${tryLanguageValue(
            ped.probation,
            langValues
          )}</a>`
        : tryLanguageValue(ped.probation, langValues)
    ),
    elements.informationLabel(
      langPed.resultContainer.parole,
      ped.parole != 'No' && config.warningColorsForPedCarSearch
        ? `<a style="color: var(--warning-color); pointer-events: none;">${tryLanguageValue(
            ped.parole,
            langValues
          )}</a>`
        : tryLanguageValue(ped.parole, langValues)
    ),
  ]

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
  if (ped.cautions) {
    for (const caution of ped.cautions) {
      cautions.push(caution)
    }
  }

  if (cautions.length) {
    for (const i in cautions) {
      cautions[i] = config.warningColorsForPedCarSearch
        ? `<a style="color: var(--warning-color); pointer-events: none;">• ${cautions[i]}</a>`
        : `• ${cautions[i]}`
    }
    informationLabels.push(
      elements.informationLabel(
        langPed.resultContainer.caution,
        cautions.join('<br>')
      )
    )
  }
  informationLabelContainer.replaceWith(
    elements.informationLabelContainer(informationLabels)
  )

  const citations = ped.citations.length ? ped.citations : [langValues.none]
  for (const i in citations) {
    citations[i] = `• ${citations[i]}`
  }
  const arrests = ped.arrests.length ? ped.arrests : [langValues.none]
  for (const i in arrests) {
    arrests[i] = `• ${arrests[i]}`
  }
  citationArrestContainer.appendChild(
    elements.informationLabel(langPed.citations, citations.join('<br>'), () => {
      openCitationReport()
    })
  )
  citationArrestContainer.appendChild(
    elements.informationLabel(langPed.arrests, arrests.join('<br>'), () => {
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
  const informationLabelContainer = document.querySelector(
    '.searchCarPage .resultContainer .informationLabelContainer'
  )

  if (!car || car.plateStatus == 'Invalid') {
    document.querySelector('.searchCarPage .resultContainer .name').innerHTML =
      langCar.resultContainer.vehicleNotFound
    informationLabelContainer.innerHTML = ''
    return
  }
  document.querySelector('.searchCarPage .resultContainer .name').innerHTML =
    car.licensePlate

  const informationLabels = [
    elements.informationLabel(langCar.resultContainer.model, car.model),
    elements.informationLabel(
      langCar.resultContainer.color,
      car.color
        ? `<div style="background-color: rgb(${car.color.split('-')[0]},${
            car.color.split('-')[1]
          },${
            car.color.split('-')[2]
          }); width: 150px; height: 25px;  border: 2px solid var(--main-color)"></div>`
        : language.content.values.unknown
    ),
    elements.informationLabel(
      langCar.resultContainer.registration,
      car.registration != 'Valid' && config.warningColorsForPedCarSearch
        ? `<a style="color: var(--warning-color); pointer-events: none;">${tryLanguageValue(
            car.registration,
            langValues
          )}</a>`
        : tryLanguageValue(car.registration, langValues)
    ),
    elements.informationLabel(
      langCar.resultContainer.insurance,
      car.insurance != 'Valid' && config.warningColorsForPedCarSearch
        ? `<a style="color: var(--warning-color); pointer-events: none;">${tryLanguageValue(
            car.insurance,
            langValues
          )}</a>`
        : tryLanguageValue(car.insurance, langValues)
    ),
    elements.informationLabel(
      langCar.resultContainer.stolen,
      car.stolen != 'No' && config.warningColorsForPedCarSearch
        ? `<a style="color: var(--warning-color); pointer-events: none;">${tryLanguageValue(
            car.stolen,
            langValues
          )}</a>`
        : tryLanguageValue(car.stolen, langValues)
    ),
    elements.informationLabel(langCar.resultContainer.owner, car.owner, () => {
      openPedInSearchPedPage(car.owner)
    }),
  ]

  if (car.cautions.length) {
    for (const i in car.cautions) {
      car.cautions[i] = config.warningColorsForPedCarSearch
        ? `<a style="color: var(--warning-color); pointer-events: none;">• ${car.cautions[i]}</a>`
        : `• ${car.cautions[i]}`
    }
    informationLabels.push(
      elements.informationLabel(
        langCar.resultContainer.caution,
        car.cautions.join('<br>')
      )
    )
  }

  informationLabelContainer.replaceWith(
    elements.informationLabelContainer(informationLabels)
  )
}

function openPedInSearchPedPage(name) {
  goToPage('searchPed')
  document.querySelector('.searchPedPage .pedInp').value = name
  document.querySelector('.searchPedPage .pedBtn').click()
}

async function renderCitationArrestOptions(type, search = null) {
  const language = await getLanguage()
  const options = await (await fetch(`/data/${type}Options`)).json()
  const optionsEl = document.querySelector(
    `.searchPedPage .${type}Report .options`
  )
  optionsEl.querySelectorAll('.mainDropDown').forEach((el) => {
    el.remove()
  })

  for (const group of options) {
    const details = document.createElement('details')
    details.classList.add('mainDropDown')
    if (search) {
      details.open = true
    }
    const summary = document.createElement('summary')
    summary.innerHTML = group.name
    details.appendChild(summary)
    for (charge of group.charges) {
      if (search && !charge.name.toLowerCase().includes(search.toLowerCase())) {
        continue
      }
      const btn = document.createElement('button')
      btn.dataset.charge = JSON.stringify(charge)
      btn.innerHTML = charge.name
      btn.addEventListener('click', function () {
        this.blur()
        if (type == 'citation') {
          addCitation(this.dataset.charge)
          disableCitationSubmitButton()
        } else {
          addArrest(this.dataset.charge)
          disableArrestSubmitButton()
        }
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
        this.innerHTML =
          type == 'arrest'
            ? `${
                JSON.parse(this.dataset.charge).name
              }<br><a style="opacity: 0.75; pointer-events: none;">${fineString} | ${jailString}</a>`
            : `${
                JSON.parse(this.dataset.charge).name
              }<br><a style="opacity: 0.75; pointer-events: none;">${fineString}</a>`
      })
      btn.addEventListener('mouseleave', function () {
        this.innerHTML = JSON.parse(this.dataset.charge).name
        this.dataset.open = 'false'
      })
      details.appendChild(btn)
    }
    optionsEl.appendChild(details)
  }
  if (search) {
    optionsEl.querySelectorAll('details').forEach((el) => {
      if (el.querySelectorAll('button').length < 1) el.remove()
    })
  }
}

async function openCitationReport() {
  document
    .querySelector('.searchPedPage .citationReport')
    .classList.remove('hidden')

  document.querySelector(
    '.searchPedPage .citationReport .options .searchCharge'
  ).value = ''

  renderCitationArrestOptions('citation')

  document
    .querySelectorAll('.searchPedPage .citationReport .result .btn')
    .forEach((oldBtn) => {
      oldBtn.remove()
    })

  disableCitationSubmitButton()

  document.querySelector(
    '.searchPedPage .citationReport .result .description'
  ).value = ''
}

async function openArrestReport() {
  document
    .querySelector('.searchPedPage .arrestReport')
    .classList.remove('hidden')

  document.querySelector(
    '.searchPedPage .arrestReport .options .searchCharge'
  ).value = ''

  renderCitationArrestOptions('arrest')

  document
    .querySelectorAll('.searchPedPage .arrestReport .result .btn')
    .forEach((oldBtn) => {
      oldBtn.remove()
    })

  disableArrestSubmitButton()

  document.querySelector(
    '.searchPedPage .arrestReport .result .description'
  ).value = ''
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
      `<details class="mainDropDown"><summary onclick="this.blur()">${charge.name}</summary><div style="opacity: 0.75">${outcome}</div></details>`
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
      `<details class="mainDropDown"><summary onclick="this.blur()">${charge.name}</summary><div style="opacity: 0.75">${outcome}</div></details>`
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
  court.reverse()
  const language = await getLanguage()
  const langCourt = language.content.courtPage

  if (!court.length) {
    const title = document.createElement('div')
    title.classList.add('title')
    title.innerHTML = langCourt.resultContainer.courtCaseNotFound
    list.appendChild(title)
    return
  }
  for (const courtCase of court) {
    const informationLabels = [
      elements.informationLabel(
        langCourt.resultContainer.caseNumber,
        courtCase.number,
        null,
        ['caseNumber']
      ),
      elements.informationLabel(
        langCourt.resultContainer.defendant,
        courtCase.ped,
        () => {
          openPedInSearchPedPage(courtCase.ped)
        },
        ['pedName']
      ),
      elements.informationLabel(
        langCourt.resultContainer.offense,
        courtCase.charge
      ),
      elements.informationLabel(
        langCourt.resultContainer.outcome,
        courtCase.outcome
      ),
    ]

    if (courtCase.description) {
      const descriptionLabel = elements.informationLabel(
        langCourt.resultContainer.description,
        `<div contenteditable class="description">${courtCase.description
          .split('\n')
          .join('<br>')}</div>`
      )
      descriptionLabel
        .querySelector('.description')
        .addEventListener('input', async function () {
          await fetch('/post/updateCourtDescription', {
            method: 'POST',
            body: JSON.stringify({
              number: courtCase.number,
              description: this.innerHTML,
            }),
          })
        })
      informationLabels.push(descriptionLabel)
    }

    const informationLabelContainer =
      elements.informationLabelContainer(informationLabels)
    list.appendChild(informationLabelContainer)
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
    '.courtPage .list .informationLabelContainer'
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
  for (const container of elements) {
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
      elements.informationLabel(
        langShift.resultContainer.start,
        date.toLocaleString().replace(/(.*)\D\d+/, '$1')
      )
    )
    currentShiftEl
      .appendChild(
        elements.informationLabel(
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
      elements.informationLabel(
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
      elements.informationLabel(
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
      elements.informationLabel(
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
    const startDate = new Date(shift.start)
    const endDate = new Date(shift.end)
    const duration = shift.end - shift.start

    const informationLabels = [
      elements.informationLabel(
        langShift.resultContainer.start,
        startDate.toLocaleString().replace(/(.*)\D\d+/, '$1')
      ),
      elements.informationLabel(
        langShift.resultContainer.end,
        endDate.toLocaleString().replace(/(.*)\D\d+/, '$1')
      ),
      elements.informationLabel(
        langShift.resultContainer.duration,
        msToDisplay(duration)
      ),
    ]

    const courtCases = []
    for (const courtCase of shift.courtCases) {
      courtCases.push(
        `<a class="courtCaseValue" onclick="goToCourtCaseFromValue('${courtCase}')">${courtCase}</a>`
      )
    }
    informationLabels.push(
      elements.informationLabel(
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
      informationLabels.push(
        elements.informationLabel(
          langShift.resultContainer.incidents,
          incidents.join('<br>'),
          function () {
            openIncidentReports(true, shift)
          }
        )
      )
    } else {
      informationLabels.push(
        elements.informationLabel(
          langShift.resultContainer.incidents,
          language.content.values.none
        )
      )
    }

    informationLabels.push(
      elements.informationLabel(
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
    list.appendChild(elements.informationLabelContainer(informationLabels))
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
    .setAttribute('contenteditable', true)
  incidentReportEl.querySelector('.result #incidentDescription').innerHTML = ''
  incidentReportEl.querySelector('.result #incidentNumber').value = ''
  incidentReportEl.querySelector(
    '.result .headerButtonContainer .submit'
  ).disabled = true
  incidentReportEl.querySelector(
    '.result .headerButtonContainer .delete'
  ).disabled = true
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
    button.addEventListener('click', async function () {
      document
        .querySelector('.overlay .incidentReportLinkSuggestions')
        .classList.add('hidden')

      incidentReportEl.querySelector('.result #incidentNumber').value =
        incident.number

      incidentReportEl.querySelector('.result #incidentDescription').innerHTML =
        convertCleanTextToRenderedText(incident.description)

      removeAllEventListeners(
        incidentReportEl.querySelector('.result #incidentDescription')
      )

      incidentReportEl
        .querySelector('.result #incidentDescription')
        .addEventListener('keypress', function (e) {
          if (e.key == 'Enter' && e.shiftKey) {
            e.preventDefault()
          }
        })

      incidentReportEl
        .querySelector('.result #incidentDescription')
        .addEventListener('input', function () {
          for (let i = 0; i < this.children.length; i++) {
            for (let j = 0; j < this.children[i].childNodes.length; j++) {
              if (this.children[i].childNodes[j].nodeType == 3) {
                // convert textNodes to spans
                const newSpan = document.createElement('span')
                newSpan.innerHTML = this.children[i].childNodes[j].nodeValue
                this.children[i].childNodes[j].replaceWith(newSpan)
                moveCursorToElement(newSpan)
              }
            }
          }
        })

      incidentReportEl
        .querySelector('.result #incidentDescription')
        .addEventListener('keydown', function (e) {
          if (e.key == 'Backspace') {
            const selection = window.getSelection()
            const range = selection.getRangeAt(0)
            const selectedNode =
              selection.anchorNode.nodeType == 3
                ? selection.anchorNode.parentNode.parentNode
                : selection.anchorNode
            const previousNode = selectedNode.previousSibling
            if (
              selectedNode.tagName == 'DIV' &&
              previousNode &&
              range.startOffset == 0
            ) {
              const tempEl = document.createElement('span')
              tempEl.id = 'temp'
              previousNode.appendChild(tempEl)
              previousNode.innerHTML += selectedNode.innerHTML
              moveCursorToElement(document.getElementById('temp'))
              document.getElementById('temp').remove()
              selectedNode.remove()
              e.preventDefault()
            }
          }

          if (
            e.key == ' ' ||
            e.key == 'Enter' ||
            e.key == 'Tab' ||
            e.key.startsWith('Arrow') ||
            e.key == 'Delete'
          ) {
            if (typingLink) {
              e.preventDefault()
            }
          }
        })

      const court = await (await fetch('/data/court')).json()
      const incidentReportLinkPrefixes = ['$', '@', '#']
      let typingLink = false
      let typeOfLink
      let currentLinkLength = 0

      function resetLink() {
        typingLink = false
        typeOfLink = null
        currentLinkLength = 0
        document
          .querySelector('.overlay .incidentReportLinkSuggestions')
          .classList.add('hidden')

        incidentReportEl
          .querySelectorAll('.result #incidentDescription .link')
          .forEach((el) => {
            el.style.pointerEvents = 'all'
          })
      }

      incidentReportEl
        .querySelector('.result #incidentDescription')
        .addEventListener('input', function (e) {
          if (incidentReportLinkPrefixes.includes(e.data) && !typingLink) {
            typingLink = true
            typeOfLink = e.data
            moveCursorBehindCurrentIncidentReportLink()
          }
          if (typingLink) {
            document.querySelector(
              '.shiftPage .incidentReport .result .submit'
            ).disabled = true
            this.querySelectorAll('.link').forEach((el) => {
              el.style.pointerEvents = 'none'
            })
            for (let i = 0; i < this.children.length; i++) {
              for (let j = 0; j < this.children[i].children.length; j++) {
                const childEl = this.children[i].children[j]
                if (childEl.innerHTML.includes('$')) {
                  const words = childEl.innerHTML.split(' ')
                  for (let k = 0; k < words.length; k++) {
                    if (words[k].startsWith(typeOfLink)) {
                      if (e.data) {
                        currentLinkLength = words[k].length
                      }
                      const restOfWord = words[k].slice(1)

                      const suggestionEl = document.querySelector(
                        '.overlay .incidentReportLinkSuggestions'
                      )
                      suggestionEl.innerHTML = ''

                      const resizeSuggestionEl = () => {
                        const divBounds =
                          this.children[i].getBoundingClientRect()
                        suggestionEl.style.width = `${
                          this.children[i].clientWidth - 4 - 10
                        }px`
                        suggestionEl.style.top = `${
                          divBounds.top + divBounds.height + 2
                        }px`
                        suggestionEl.style.left = `${divBounds.left}px`
                      }

                      window.addEventListener('resize', resizeSuggestionEl)
                      resizeSuggestionEl()

                      this.removeEventListener(
                        'mousedown',
                        moveCursorBehindCurrentIncidentReportLink
                      )
                      this.removeEventListener(
                        'touchstart',
                        moveCursorBehindCurrentIncidentReportLink
                      )
                      this.addEventListener(
                        'mousedown',
                        moveCursorBehindCurrentIncidentReportLink
                      )
                      this.addEventListener(
                        'touchstart',
                        moveCursorBehindCurrentIncidentReportLink
                      )

                      if (typeOfLink == '$') {
                        const courtCases = shift.courtCases
                        for (const courtCase of courtCases) {
                          const btn = document.createElement('div')
                          const pedName = court.find(
                            (x) => x.number == courtCase
                          ).ped
                          if (
                            !pedName
                              .toLowerCase()
                              .includes(
                                restOfWord.toLowerCase().replace(/[_]/g, ' ')
                              ) &&
                            !courtCase
                              .toLowerCase()
                              .includes(restOfWord.toLowerCase())
                          ) {
                            continue
                          }
                          btn.innerHTML = `${courtCase} - ${pedName}`
                          btn.addEventListener('click', () => {
                            const plainTextArr = this.children[i].children[
                              j
                            ].innerHTML.split(`${typeOfLink}${restOfWord}`)
                            const link = `<span class="link" data-type="courtCase" contenteditable="false" onclick="goToCourtCaseFromValue('${courtCase}')">${courtCase}</span>`
                            this.children[i].children[
                              j
                            ].outerHTML = `<span>${plainTextArr[0]}</span>${link}<span>${plainTextArr[1]}</span>`
                            resetLink()
                            document.querySelector(
                              '.shiftPage .incidentReport .result .submit'
                            ).disabled = false
                          })
                          suggestionEl.appendChild(btn)
                        }
                      }
                      suggestionEl.classList.remove('hidden')
                    }
                  }
                }
              }
            }
          } else {
            document.querySelector(
              '.shiftPage .incidentReport .result .submit'
            ).disabled = false
          }
        })

      incidentReportEl
        .querySelector('.result #incidentDescription')
        .addEventListener('keyup', function (e) {
          if (e.key == 'Backspace') {
            if (typingLink) {
              currentLinkLength--
              if (currentLinkLength <= 0) {
                document
                  .querySelector('.overlay .incidentReportLinkSuggestions')
                  .classList.add('hidden')
                resetLink()
                document.querySelector(
                  '.shiftPage .incidentReport .result .submit'
                ).disabled = false
              }
            }
          }
        })

      !disableAddIncidentButton
        ? incidentReportEl
            .querySelector('.result #incidentDescription')
            .setAttribute('contenteditable', true)
        : incidentReportEl
            .querySelector('.result #incidentDescription')
            .removeAttribute('contenteditable')
      incidentReportEl.querySelector(
        '.result .headerButtonContainer .submit'
      ).disabled = disableAddIncidentButton
      incidentReportEl.querySelector(
        '.result .headerButtonContainer .delete'
      ).disabled = disableAddIncidentButton
    })
    incidentReportEl.querySelector('.options').appendChild(button)
  }
}

// https://stackoverflow.com/a/4812022
function getCaretCharacterOffsetWithin(element) {
  var caretOffset = 0
  var doc = element.ownerDocument || element.document
  var win = doc.defaultView || doc.parentWindow
  var sel
  if (typeof win.getSelection != 'undefined') {
    sel = win.getSelection()
    if (sel.rangeCount > 0) {
      var range = win.getSelection().getRangeAt(0)
      var preCaretRange = range.cloneRange()
      preCaretRange.selectNodeContents(element)
      preCaretRange.setEnd(range.endContainer, range.endOffset)
      caretOffset = preCaretRange.toString().length
    }
  } else if ((sel = doc.selection) && sel.type != 'Control') {
    var textRange = sel.createRange()
    var preCaretTextRange = doc.body.createTextRange()
    preCaretTextRange.moveToElementText(element)
    preCaretTextRange.setEndPoint('EndToEnd', textRange)
    caretOffset = preCaretTextRange.text.length
  }
  return caretOffset
}

function convertCleanTextToRenderedText(text) {
  const textArr = text.split('\n')
  for (const i in textArr) {
    const div = document.createElement('div')
    const divArr = textArr[i].split(' ')
    if (!textArr[i]) {
      divArr[0] = `<br>`
    }
    if (!/^[$@#]/i.test(divArr[0])) {
      divArr[0] = `<span>${divArr[0]}`
    }
    if (!/^[$@#]/i.test(divArr[divArr.length - 1])) {
      divArr[divArr.length - 1] = `${divArr[divArr.length - 1]}</span>`
    }
    for (const j in divArr) {
      if (divArr[j].startsWith('$')) {
        if (divArr[j - 1]) {
          divArr[j - 1] = `${divArr[j - 1]}</span>`
        }

        divArr[
          j
        ] = `<span class="link" data-type="courtCase" contenteditable="false" onclick="goToCourtCaseFromValue('${divArr[
          j
        ].slice(1)}')">${divArr[j].slice(1)}</span>`

        if (divArr[parseInt(j) + 1]) {
          divArr[parseInt(j) + 1] = `<span> ${divArr[parseInt(j) + 1]}`
        }
      } else {
        if (!divArr[j].endsWith('</span>')) {
          divArr[j] += ' '
        }
      }
    }
    div.innerHTML = divArr.join('')
    textArr[i] = div.outerHTML
  }
  return textArr.join('')
}

function convertRenderedTextToCleanText(el) {
  const lines = []
  for (const child of el.children) {
    const line = []
    for (const childChild of child.children) {
      let word
      if (childChild.dataset.type == 'courtCase') {
        word = `$${childChild.innerHTML}`
      } else {
        word = childChild.innerHTML
      }
      line.push(word)
    }
    lines.push(line.join(''))
  }
  return lines.join('\n')
}

function moveCursorToElement(el, addSpace = false) {
  const range = document.createRange()
  range.setStartAfter(el)
  range.collapse(true)

  const selection = window.getSelection()
  selection.removeAllRanges()
  selection.addRange(range)

  if (addSpace) {
    range.setStart(range.startContainer, range.startOffset + 1)
    range.collapse(true)
    selection.removeAllRanges()
    selection.addRange(range)
  }
}

async function moveCursorBehindCurrentIncidentReportLink() {
  await sleep()
  const el = document.querySelector(
    '.shiftPage .incidentReport .result #incidentDescription'
  )
  for (let i = 0; i < el.children.length; i++) {
    for (let j = 0; j < el.children[i].children.length; j++) {
      if (
        el.children[i].children[j].innerHTML.includes('$') ||
        el.children[i].children[j].innerHTML.includes('@') ||
        el.children[i].children[j].innerHTML.includes('#')
      ) {
        const words = el.children[i].children[j].innerHTML.split(' ')
        let offset = 0
        for (let k = 0; k < words.length; k++) {
          if (
            words[k].startsWith('$') ||
            words[k].startsWith('@') ||
            words[k].startsWith('#')
          ) {
            offset += words[k].length
            const range = document.createRange()
            range.setStart(el.children[i].children[j].firstChild, offset)
            range.collapse(true)

            const selection = window.getSelection()
            selection.removeAllRanges()
            selection.addRange(range)
            return
          }
          offset += words[k].length + 1
        }
      }
    }
  }
}

function removeAllEventListeners(element) {
  const clonedElement = element.cloneNode(true)
  element.replaceWith(clonedElement)
  return clonedElement
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
        description: descriptionInpEl.innerHTML,
      }
      await fetch('/post/updateCurrentShift', {
        method: 'post',
        body: JSON.stringify(oldCurrentShift),
      })
      updateIncidentReportOptions(false, oldCurrentShift)
      break
    }
  }
  document.querySelector('.shiftPage .incidentReport').classList.add('hidden')
  renderShiftPage()
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

async function createNewIncidentReport(
  id = Math.floor(Math.random() * 90000) + 10000,
  description = ''
) {
  const number = `${new Date().getFullYear().toString().slice(2)}-${id}`
  const shift = await (await fetch('/data/shift')).json()
  const currentShift = shift.currentShift
  currentShift.incidents.push({ number: number, description: description })
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
    '.courtPage .list .informationLabelContainer'
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
  for (const container of elements) {
    list.appendChild(container)
  }
}

function msToDisplay(ms) {
  let seconds = (ms / 1000).toFixed(0)
  let minutes = Math.round(seconds / 60)
  let hours = 0

  hours = Math.floor(minutes / 60)
  minutes = minutes - hours * 60

  return `${hours > 0 ? `${hours}h ` : ''}${minutes}min`
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
    '.searchPedPage .citationReport .result .headerButtonContainer button:not(.close)'
  ).disabled = !document.querySelectorAll(
    '.searchPedPage .citationReport .result .charges button'
  ).length
}

function disableArrestSubmitButton() {
  document.querySelector(
    '.searchPedPage .arrestReport .result .headerButtonContainer button:not(.close)'
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

async function updateCalloutPage() {
  const language = await getLanguage()
  const config = await getConfig()
  const calloutData = await (await fetch('/data/callout')).json()
  const calloutPage = document.querySelector('.content .calloutPage')
  if (JSON.stringify(calloutData) == calloutPage.dataset.calloutData) {
    return
  }
  calloutPage.dataset.calloutData = JSON.stringify(calloutData)
  calloutPage.innerHTML = ''
  if (!Object.keys(calloutData).length) {
    const title = document.createElement('div')
    title.classList.add('title')
    title.innerHTML = language.content.calloutPage.calloutNotFound
    calloutPage.appendChild(title)
    return
  }

  if (config.autoShowCalloutPage && calloutData.acceptanceState == 'Pending') {
    goToPage('callout')
  }

  for (const calloutDataItem of Object.keys(calloutData)) {
    calloutData[calloutDataItem] = calloutData[calloutDataItem].replace(
      /~(.*?)~/g,
      ''
    )
  }

  const informationLabels = [
    elements.informationLabel(
      language.content.calloutPage.keys.street,
      `${calloutData.postal} ${calloutData.street}`
    ),
    elements.informationLabel(
      language.content.calloutPage.keys.area,
      calloutData.area
    ),
    elements.informationLabel(
      language.content.calloutPage.keys.county,
      language.content.calloutPage.values.counties[calloutData.county]
        ? language.content.calloutPage.values.counties[calloutData.county]
        : calloutData.county
    ),
    elements.informationLabel(
      language.content.calloutPage.keys.priority,
      calloutData.priority == 'default'
        ? language.content.calloutPage.defaultPriority
        : calloutData.priority
    ),
  ]
  const informationLabelContainer =
    elements.informationLabelContainer(informationLabels)

  calloutPage.appendChild(informationLabelContainer)

  const calloutDetails = document.createElement('div')
  calloutDetails.readOnly = true
  calloutDetails.classList.add('calloutDetails')
  const displayedDate = new Date(calloutData.displayedTime)
  calloutDetails.innerHTML = `<a class="systemMessage">${
    language.content.calloutPage.open
  } ${displayedDate.toLocaleDateString()} ${displayedDate.toLocaleTimeString()}</a><br>${
    calloutData.message
  }${calloutData.advisory ? `<br>${calloutData.advisory}` : ''}`
  const acceptedDate = new Date(calloutData.acceptedTime)
  if (
    (calloutData.acceptanceState == 'Running' ||
      calloutData.acceptanceState == 'Ended') &&
    calloutData.acceptedTime
  ) {
    calloutDetails.innerHTML += `<br><a class="systemMessage">${
      language.content.calloutPage.unit
    } ${calloutData.callsign} (${calloutData.agency.toUpperCase()}) ${
      language.content.calloutPage.attached
    } ${acceptedDate.toLocaleDateString()} ${acceptedDate.toLocaleTimeString()}</a>`
  }
  calloutDetails.innerHTML += '<br>' + calloutData.additionalMessage

  const finishedDate = new Date(calloutData.finishedTime)
  if (calloutData.acceptanceState == 'Ended') {
    calloutDetails.innerHTML += `<a class="systemMessage">${
      language.content.calloutPage.close
    } ${finishedDate.toLocaleDateString()} ${finishedDate.toLocaleTimeString()}</a>`
  }

  calloutPage.appendChild(calloutDetails)

  if (
    calloutData.acceptanceState == 'Ended' &&
    config.automaticIncidentReports &&
    calloutData.acceptedTime
  ) {
    const shift = await (await fetch('/data/shift')).json()
    if (!shift.currentShift) {
      return
    }
    // I should be executed for this
    const description = `${language.content.calloutPage.calloutReport}\n${
      language.content.calloutPage.open
    } ${displayedDate.toLocaleDateString()} ${displayedDate.toLocaleTimeString()}\n${
      calloutData.postal
    } ${calloutData.street}, ${calloutData.area}, ${
      language.content.calloutPage.values.counties[calloutData.county]
        ? language.content.calloutPage.values.counties[calloutData.county]
        : calloutData.county
    }, ${
      calloutData.priority == 'default'
        ? language.content.calloutPage.defaultPriority
        : calloutData.priority
    }\n${calloutData.message}${
      calloutData.advisory ? `\n${calloutData.advisory}` : ''
    }\n${language.content.calloutPage.unit} ${
      calloutData.callsign
    } (${calloutData.agency.toUpperCase()}) ${
      language.content.calloutPage.attached
    } ${acceptedDate.toLocaleDateString()} ${acceptedDate.toLocaleTimeString()}\n${calloutData.additionalMessage.replaceAll(
      '<br>',
      '\n'
    )}${
      language.content.calloutPage.close
    } ${finishedDate.toLocaleDateString()} ${finishedDate.toLocaleTimeString()}\n\n${
      language.content.calloutPage.additionalReport
    }\n`

    for (const incident of shift.currentShift.incidents) {
      if (
        incident.number ==
        `${new Date().getFullYear().toString().slice(2)}-${calloutData.id}`
      )
        return
    }

    await createNewIncidentReport(calloutData.id, description)

    if (lastPage == 'shift') {
      renderShiftPage()
    }
  }
}
