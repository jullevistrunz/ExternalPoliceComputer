const mapZoom = 1.5

document.querySelector('.mapPage input').value = mapZoom
document.querySelector('.mapPage input').addEventListener('input', function () {
  document
    .querySelector('.mapPage iframe')
    .contentDocument.querySelector('img').style.zoom =
    this.value <= 2.5 && this.value >= 0.2 ? this.value : 1.5
})

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

document.querySelector('.mapPage iframe').addEventListener('load', function () {
  this.contentWindow.scrollTo(mapScroll.x, mapScroll.y)
  this.contentDocument.querySelector('img').style.zoom = mapZoom
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

// currentID handler
;(async function () {
  const config = await (await fetch('/data/config')).json()
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
})()

//funcs
async function goToPage(name) {
  const config = await await (await fetch('/data/config')).json()

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
  const config = await (await fetch('/data/config')).json()

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
    ).innerHTML = 'Ped Not Found')
  }
  document.querySelector('.searchPedPage .resultContainer .name').innerHTML =
    ped.name

  lc.appendChild(createLabelElement('Date Of Birth', ped.birthday))
  lc.appendChild(createLabelElement('Sex', ped.gender))
  lc.appendChild(
    createLabelElement(
      'License Status',
      ped.licenseStatus != 'Valid' && config.warningColorsForPedCarSearch
        ? ped.licenseData
          ? `<a style="color: var(--warning-color); pointer-events: none;">${ped.licenseStatus} For ${ped.licenseData}</a>`
          : `<a style="color: var(--warning-color); pointer-events: none;">${ped.licenseStatus}</a>`
        : ped.licenseStatus
    )
  )
  lc.appendChild(
    createLabelElement(
      'Outstanding Warrant',
      ped.isWanted == 'True'
        ? config.warningColorsForPedCarSearch
          ? `<a style="color: var(--warning-color); pointer-events: none;">${ped.warrantText}</a>`
          : ped.warrantText
        : 'None'
    )
  )
  lc.appendChild(
    createLabelElement(
      'Probation',
      ped.probation != 'No' && config.warningColorsForPedCarSearch
        ? `<a style="color: var(--warning-color); pointer-events: none;">${ped.probation}</a>`
        : ped.probation
    )
  )
  lc.appendChild(
    createLabelElement(
      'Parole',
      ped.parole != 'No' && config.warningColorsForPedCarSearch
        ? `<a style="color: var(--warning-color); pointer-events: none;">${ped.parole}</a>`
        : ped.parole
    )
  )

  const citations = ped.citations.length ? ped.citations : ['None']
  for (let i in citations) {
    citations[i] = `• ${citations[i]}`
  }
  const arrests = ped.arrests.length ? ped.arrests : ['None']
  for (let i in arrests) {
    arrests[i] = `• ${arrests[i]}`
  }
  cac.appendChild(
    createLabelElement('Citations', citations.join('<br>'), () => {
      openCitationReport()
    })
  )
  cac.appendChild(
    createLabelElement('Arrests', arrests.join('<br>'), () => {
      openArrestReport()
    })
  )
}

async function renderCarSearch() {
  const config = await (await fetch('/data/config')).json()

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
    ).innerHTML = 'Vehicle Not Found')
  }
  document.querySelector('.searchCarPage .resultContainer .name').innerHTML =
    car.licensePlate

  lc.appendChild(createLabelElement('Model', car.model))
  lc.appendChild(createLabelElement('Color', car.color))
  lc.appendChild(
    createLabelElement(
      'Registration',
      car.registration != 'Valid' && config.warningColorsForPedCarSearch
        ? `<a style="color: var(--warning-color); pointer-events: none;">${car.registration}</a>`
        : car.registration
    )
  )
  lc.appendChild(
    createLabelElement(
      'Insurance',
      car.insurance != 'Valid' && config.warningColorsForPedCarSearch
        ? `<a style="color: var(--warning-color); pointer-events: none;">${car.insurance}</a>`
        : car.insurance
    )
  )
  lc.appendChild(
    createLabelElement(
      'Stolen',
      car.stolen != 'No' && config.warningColorsForPedCarSearch
        ? `<a style="color: var(--warning-color); pointer-events: none;">${car.stolen}</a>`
        : car.stolen
    )
  )
  lc.appendChild(
    createLabelElement('Owner', car.owner, () => {
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
  const config = await (await fetch('/data/config')).json()
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
              }<br><a style="opacity: 0.75; pointer-events: none;">Fine: ${
                config.currency
              }${JSON.parse(this.dataset.charge).minFine}</a>`
            : `${
                JSON.parse(this.dataset.charge).name
              }<br><a style="opacity: 0.75; pointer-events: none;">Fine: ${
                config.currency
              }${JSON.parse(this.dataset.charge).minFine}-${config.currency}${
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
  const config = await (await fetch('/data/config')).json()
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
            ? `Fine: ${config.currency}${
                JSON.parse(this.dataset.charge).minFine
              }`
            : `Fine: ${config.currency}${
                JSON.parse(this.dataset.charge).minFine
              } - ${config.currency}${JSON.parse(this.dataset.charge).maxFine}`
        const jailString =
          JSON.parse(this.dataset.charge).minMonths ==
          JSON.parse(this.dataset.charge).maxMonths
            ? `${config.wordForJail}: ${monthsToYearsAndMonths(
                JSON.parse(this.dataset.charge).minMonths
              )}`
            : `${config.wordForJail}: ${monthsToYearsAndMonths(
                JSON.parse(this.dataset.charge).minMonths
              )} - ${monthsToYearsAndMonths(
                JSON.parse(this.dataset.charge).maxMonths
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
  const config = await (await fetch('/data/config')).json()
  const nameList = []
  let fullFine = 0
  for (let charge of charges) {
    charge = JSON.parse(charge)
    const fine =
      charge.minFine +
      Math.floor(Math.random() * (charge.maxFine - charge.minFine))
    const outcome = `Fine: ${config.currency}${bigNumberToNiceString(fine)}`
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
      outcome: `Fine: ${config.currency}${bigNumberToNiceString(fullFine)}`,
      description: description,
    }),
  })
}

async function addArrestToCourt(charges, pedName, description) {
  const config = await (await fetch('/data/config')).json()
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
            : 'Life In Prison'
          : charge.minMonths +
            Math.floor(Math.random() * (charge.maxMonths - charge.minMonths))
        : 'Granted Probation'

    const fine =
      charge.minFine +
      Math.floor(Math.random() * (charge.maxFine - charge.minFine))

    const jailTimeString =
      typeof jailTime == 'number' ? monthsToYearsAndMonths(jailTime) : jailTime

    const outcome = `Fine: ${config.currency}${bigNumberToNiceString(
      fine
    )}<br>${config.wordForJail}: ${jailTimeString}`
    nameList.push(
      `<details><summary onclick="this.blur()">${charge.name}</summary><div style="opacity: 0.75">${outcome}</div></details>`
    )
    fullFine += fine
    fullJailTimeArr.push(jailTime)
  }
  let fullJailTime = 0
  for (const jailTimeEl of fullJailTimeArr) {
    if (jailTimeEl == 'Life In Prison') {
      fullJailTime = 'Life In Prison'
      break
    }
    if (jailTimeEl == 'Granted Probation') continue
    fullJailTime += jailTimeEl
  }

  const caseNumber = `SA${Math.random().toString().slice(2, 10)}`

  await fetch('/post/addToCourt', {
    method: 'post',
    body: JSON.stringify({
      ped: pedName,
      number: caseNumber,
      charge: nameList.join(''),
      outcome: `Fine: ${config.currency}${bigNumberToNiceString(fullFine)}<br>${
        config.wordForJail
      }: ${
        typeof fullJailTime == 'number'
          ? monthsToYearsAndMonths(fullJailTime)
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
  if (!court.length) {
    const title = document.createElement('div')
    title.classList.add('title')
    title.innerHTML = 'No Court Cases Found'
    list.appendChild(title)
    return
  }
  for (const courtCase of court) {
    const el = document.createElement('div')
    el.classList.add('container')
    el.appendChild(
      createLabelElement('Case Number', courtCase.number)
    ).classList.add('caseNumber')
    el.appendChild(
      createLabelElement('Defendant', courtCase.ped, () => {
        openPedInSearchPedPage(courtCase.ped)
      })
    ).classList.add('pedName')
    el.appendChild(createLabelElement('Offense(s)', courtCase.charge))
    el.appendChild(createLabelElement('Outcome', courtCase.outcome))
    if (courtCase.description) {
      el.appendChild(
        createLabelElement(
          'Description',
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

function monthsToYearsAndMonths(input) {
  if (input == null) return 'Life'
  return input % 12 != 0
    ? Math.floor(input / 12) != 0
      ? `${Math.floor(input / 12)}yr. ${input % 12}mth.`
      : `${input % 12}mth.`
    : `${input / 12}yr.`
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
    title.innerHTML = 'No Court Cases Found For This Defendant'
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
  document.querySelector('.shiftPage .startShift').disabled =
    !!data.currentShift
  document.querySelector('.shiftPage .stopShift').disabled = !data.currentShift

  if (data.currentShift) {
    const date = new Date(data.currentShift.start)
    currentShiftEl.dataset.currentShift = JSON.stringify(data.currentShift)
    currentShiftEl.appendChild(
      createLabelElement(
        'Start',
        `${date.getHours() < 10 ? `0${date.getHours()}` : date.getHours()}:${
          date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes()
        }`
      )
    )
    currentShiftEl
      .appendChild(
        createLabelElement('Duration', msToDisplay(getDuration(date.getTime())))
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
        'Court Cases',
        data.currentShift.courtCases.length ? courtCases.join('<br>') : 'None'
      )
    )
    currentShiftEl.appendChild(
      createLabelElement(
        'Notes',
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
      'Current Shift'
    document.querySelector('.shiftPage .currentShiftTitle').style.color =
      'unset'
  } else {
    document.querySelector('.shiftPage .currentShiftTitle').innerHTML =
      'Off Duty'
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
        'Start',
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
        'End',
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
      createLabelElement('Duration', msToDisplay(duration))
    )
    const courtCases = []
    for (const courtCase of shift.courtCases) {
      courtCases.push(
        `<a class="courtCaseValue" onclick="goToCourtCaseFromValue('${courtCase}')">${courtCase}</a>`
      )
    }
    labelContainer.appendChild(
      createLabelElement(
        'Court Cases',
        courtCases.length ? courtCases.join('<br>') : 'None'
      )
    )
    labelContainer.appendChild(
      createLabelElement(
        'Notes',
        `${
          shift.notes
            ? `<div class="shiftNotes">${shift.notes
                .split('\n')
                .join('<br>')}</div>`
            : 'None'
        }`
      )
    )
    list.appendChild(labelContainer)
  }
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
    el.querySelector('.properties .gender').innerHTML = data[2]

    if (file.split(';').length - 1 > 1) {
      document
        .querySelector('.currentID .nextCurrentID')
        .classList.remove('hidden')
      document.querySelector('.currentID .nextCurrentID').innerHTML = `Next [${
        index + 1
      }/${file.split(';').length - 1}]`
    } else {
      document
        .querySelector('.currentID .nextCurrentID')
        .classList.add('hidden')
    }

    const pedTypeArr = [
      'Driver',
      'Front Passenger',
      'R-L Passenger',
      'R-R Passenger',
    ]

    document.querySelector('.currentID .currentIDPedType').innerHTML =
      data[3] != 0
        ? data[3] - 1 < pedTypeArr.length
          ? pedTypeArr[data[3] - 1]
          : 'Passenger'
        : 'Stopped Ped'
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
