let lastPage = localStorage.getItem('lastCustomizationPage')
if (!lastPage) {
  localStorage.setItem('lastCustomizationPage', 'config')
  lastPage = 'config'
}

goToPage(lastPage)
document.querySelectorAll('.header button').forEach((btn) => {
  btn.addEventListener('click', function () {
    goToPage(this.classList[0])
  })
})

//funcs
async function goToPage(name) {
  document.querySelectorAll('.content > *').forEach((page) => {
    page.classList.add('hidden')
  })
  document.querySelectorAll('.header button').forEach((page) => {
    page.classList.remove('selected')
  })
  document.querySelector(`.content .${name}Page`).classList.remove('hidden')
  document.querySelector(`.header .${name}`).classList.add('selected')
  localStorage.setItem('lastCustomizationPage', name)
  if (name == 'citationOptions') {
    await loadOptionsPage('citation')
  } else if (name == 'arrestOptions') {
    await loadOptionsPage('arrest')
  } else if (name == 'config') {
    await loadConfigPage()
  } else if (name == 'licenseOptions') {
    await loadLicenseOptionsPage()
  } else if (name == 'plugins') {
    await loadPluginsPage()
  }
}

async function loadOptionsPage(type) {
  const language = await (await fetch('/data/language')).json()
  const options = await (await fetch(`/data/${type}Options`)).json()
  const optionsEl = document.querySelector(`.${type}OptionsPage .options`)
  optionsEl.innerHTML = ''

  const addGroupBtn = document.createElement('button')
  addGroupBtn.innerHTML = 'Add Charge Group'
  addGroupBtn.classList.add('addGroupBtn')
  addGroupBtn.addEventListener('click', function () {
    const name = prompt('Charge Group Name')
    if (name) {
      addChargeGroup(name, type)
    }
  })
  optionsEl.appendChild(addGroupBtn)

  for (const group of options) {
    const details = document.createElement('details')
    const summary = document.createElement('summary')
    summary.innerHTML = group.name
    details.appendChild(summary)

    const rmBtn = document.createElement('button')
    rmBtn.innerHTML = 'Remove Group'
    rmBtn.classList.add('remove')
    rmBtn.addEventListener('click', function () {
      if (confirm(`Are you sure, you want to delete "${group.name}"?`)) {
        removeChargeGroup(group.name, type)
      }
    })
    details.appendChild(rmBtn)

    for (const charge of group.charges) {
      const btn = document.createElement('button')
      btn.dataset.charge = JSON.stringify(charge)
      btn.innerHTML = charge.name
      btn.addEventListener('click', function () {
        this.blur()
        addChargeToResult(this.dataset.charge, group.name, type)
      })
      btn.addEventListener('mouseover', async function () {
        this.dataset.open = 'true'
        await sleep(150)
        if (this.dataset.open == 'false') return
        const fineString =
          JSON.parse(this.dataset.charge).minFine ==
          JSON.parse(this.dataset.charge).maxFine
            ? `Fine: ${language.content.currency}${
                JSON.parse(this.dataset.charge).minFine
              }`
            : `Fine: ${language.content.currency}${
                JSON.parse(this.dataset.charge).minFine
              } - ${language.content.currency}${
                JSON.parse(this.dataset.charge).maxFine
              }`
        const jailString =
          JSON.parse(this.dataset.charge).minMonths ==
          JSON.parse(this.dataset.charge).maxMonths
            ? `${language.content.jail}: ${monthsToYearsAndMonths(
                JSON.parse(this.dataset.charge).minMonths
              )}`
            : `${language.content.jail}: ${monthsToYearsAndMonths(
                JSON.parse(this.dataset.charge).minMonths
              )} - ${monthsToYearsAndMonths(
                JSON.parse(this.dataset.charge).maxMonths
              )}`
        this.innerHTML =
          type == 'citation'
            ? `${
                JSON.parse(this.dataset.charge).name
              }<br><a style="opacity: 0.75; pointer-events: none;">${fineString}</a>`
            : `${
                JSON.parse(this.dataset.charge).name
              }<br><a style="opacity: 0.75; pointer-events: none;">${fineString} | ${jailString}</a>`
      })
      btn.addEventListener('mouseleave', function () {
        this.innerHTML = JSON.parse(this.dataset.charge).name
        this.dataset.open = 'false'
      })
      details.appendChild(btn)
    }
    const addBtn = document.createElement('button')
    addBtn.innerHTML = 'Add Charge'
    addBtn.addEventListener('click', function () {
      const name = prompt('Charge Name')
      if (name) {
        addChargeToChargeGroup(name, group.name, type)
      }
    })
    details.appendChild(addBtn)
    optionsEl.appendChild(details)
  }
}

function addChargeToResult(charge, chargeGroup, type) {
  const resultEl = document.querySelector(`.${type}OptionsPage .result`)

  resultEl.dataset.charge = charge
  resultEl.dataset.chargeGroup = chargeGroup

  resultEl.querySelectorAll('label, input').forEach((el) => {
    el.remove()
  })

  charge = JSON.parse(charge)

  resultEl.querySelector('.submit').disabled = false
  resultEl.querySelector('.remove').disabled = false

  reassignEventListener(
    `.${type}OptionsPage .result .remove`,
    'click',
    function () {
      if (
        confirm(
          `Are you sure, you want to delete "${charge.name}" from "${chargeGroup}"`
        )
      ) {
        removeChargeFromChargeGroup(charge.name, chargeGroup, type)
      }
    }
  )

  const nameLabel = document.createElement('label')
  const nameInput = document.createElement('input')
  const minFineLabel = document.createElement('label')
  const minFineInput = document.createElement('input')
  const maxFineLabel = document.createElement('label')
  const maxFineInput = document.createElement('input')
  nameInput.id = 'nameInput'
  minFineInput.id = 'minFineInput'
  maxFineInput.id = 'maxFineInput'
  nameLabel.setAttribute('for', 'nameInput')
  minFineLabel.setAttribute('for', 'minFineInput')
  maxFineLabel.setAttribute('for', 'maxFineInput')
  nameLabel.innerHTML = 'Name'
  minFineLabel.innerHTML = 'Minimum Fine'
  maxFineLabel.innerHTML = 'Maximum Fine'
  nameInput.value = charge.name
  minFineInput.value = charge.minFine
  maxFineInput.value = charge.maxFine
  minFineInput.type = 'number'
  maxFineInput.type = 'number'
  minFineInput.min = 0
  maxFineInput.min = 0
  resultEl.appendChild(nameLabel)
  resultEl.appendChild(nameInput)
  resultEl.appendChild(minFineLabel)
  resultEl.appendChild(minFineInput)
  resultEl.appendChild(maxFineLabel)
  resultEl.appendChild(maxFineInput)

  if (type == 'arrest') {
    const minJailLabel = document.createElement('label')
    const maxJailLabel = document.createElement('label')
    const minJailInp = document.createElement('input')
    const maxJailInp = document.createElement('input')
    const probationLabel = document.createElement('label')
    const probationInp = document.createElement('input')
    minJailInp.id = 'minJailInput'
    maxJailInp.id = 'maxJailInput'
    probationInp.id = 'probationInput'
    minJailLabel.setAttribute('for', 'minJailInput')
    maxJailLabel.setAttribute('for', 'maxJailInput')
    probationLabel.setAttribute('for', 'probationInput')
    minJailLabel.innerHTML = 'Minimum Jail Time [Months]'
    maxJailLabel.innerHTML =
      'Maximum Jail Time [Months] | "null" for Life In Prison'
    probationLabel.innerHTML = 'Probation Probability [0 - 1]'
    minJailInp.value = charge.minMonths
    maxJailInp.value = charge.maxMonths == null ? 'null' : charge.maxMonths
    probationInp.value = charge.probation
    minJailInp.type = 'number'
    probationInp.type = 'number'
    minJailInp.min = 0
    maxJailInp.min = 0
    probationInp.min = 0
    probationInp.max = 1
    probationInp.step = 0.05
    resultEl.appendChild(minJailLabel)
    resultEl.appendChild(minJailInp)
    resultEl.appendChild(maxJailLabel)
    resultEl.appendChild(maxJailInp)
    resultEl.appendChild(probationLabel)
    resultEl.appendChild(probationInp)
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function submitResults(type) {
  const resultEl = document.querySelector(`.${type}OptionsPage .result`)
  const options = await (await fetch(`/data/${type}Options`)).json()
  const chargeGroup = resultEl.dataset.chargeGroup
  const charge = JSON.parse(resultEl.dataset.charge)

  for (const i in options) {
    if (options[i].name == chargeGroup) {
      for (const j in options[i].charges) {
        if (options[i].charges[j].name == charge.name) {
          options[i].charges[j].name =
            resultEl.querySelector('#nameInput').value

          options[i].charges[j].minFine = parseInt(
            resultEl.querySelector('#minFineInput').value
          )

          options[i].charges[j].maxFine = parseInt(
            resultEl.querySelector('#maxFineInput').value
          )

          if (type == 'arrest') {
            options[i].charges[j].minMonths = parseInt(
              resultEl.querySelector('#minJailInput').value
            )

            options[i].charges[j].maxMonths =
              resultEl.querySelector('#maxJailInput').value == 'null'
                ? null
                : parseInt(resultEl.querySelector('#maxJailInput').value)

            options[i].charges[j].probation = parseFloat(
              resultEl.querySelector('#probationInput').value
            )
          }
          break
        }
      }
      break
    }
  }

  await fetch('/post/updateOptions', {
    method: 'POST',
    body: JSON.stringify({
      type: type,
      options: options,
    }),
  })
  location.reload()
}

async function addChargeGroup(name, type) {
  const options = await (await fetch(`/data/${type}Options`)).json()
  const newChargeGroup = {
    name: name,
    charges: [],
  }
  for (const i in options) {
    if (options[i].name == name) {
      return alert(`"${name}" already exists!`)
    }
  }
  options.push(newChargeGroup)

  await fetch('/post/updateOptions', {
    method: 'POST',
    body: JSON.stringify({
      type: type,
      options: options,
    }),
  })
  location.reload()
}

async function removeChargeGroup(name, type) {
  const options = await (await fetch(`/data/${type}Options`)).json()
  for (const i in options) {
    if (options[i].name == name) {
      options.splice(i, 1)
      break
    }
  }

  await fetch('/post/updateOptions', {
    method: 'POST',
    body: JSON.stringify({
      type: type,
      options: options,
    }),
  })
  location.reload()
}

async function addChargeToChargeGroup(name, chargeGroupName, type) {
  const options = await (await fetch(`/data/${type}Options`)).json()
  const newCharge =
    type == 'citation'
      ? {
          name: name,
          minFine: 0,
          maxFine: 0,
        }
      : {
          name: name,
          minFine: 0,
          maxFine: 0,
          minMonths: 0,
          maxMonths: 0,
          probation: 0.5,
        }
  for (const i in options) {
    if (options[i].name == chargeGroupName) {
      for (const j in options[i].charges) {
        if (options[i].charges[j].name == name) {
          return alert(`"${name}" already exists in "${chargeGroupName}"!`)
        }
      }
      options[i].charges.push(newCharge)
      break
    }
  }

  await fetch('/post/updateOptions', {
    method: 'POST',
    body: JSON.stringify({
      type: type,
      options: options,
    }),
  })
  location.reload()
}

async function removeChargeFromChargeGroup(name, chargeGroupName, type) {
  const options = await (await fetch(`/data/${type}Options`)).json()
  for (const i in options) {
    if (options[i].name == chargeGroupName) {
      for (const j in options[i].charges) {
        if (options[i].charges[j].name == name) {
          options[i].charges.splice(j, 1)
          break
        }
      }
      break
    }
  }

  await fetch('/post/updateOptions', {
    method: 'POST',
    body: JSON.stringify({
      type: type,
      options: options,
    }),
  })
  location.reload()
}

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

function monthsToYearsAndMonths(input) {
  if (input == null) return 'Life'
  return input % 12 != 0
    ? Math.floor(input / 12) != 0
      ? `${Math.floor(input / 12)}yr. ${input % 12}mth.`
      : `${input % 12}mth.`
    : `${input / 12}yr.`
}

async function loadConfigPage() {
  const config = await (await fetch('/data/config')).json()
  const optionsEl = document.querySelector('.configPage .options')
  optionsEl.innerHTML = ''

  for (const property of Object.keys(config)) {
    const btn = document.createElement('button')
    btn.innerHTML = property
    btn.addEventListener('click', function () {
      this.blur()
      addPropertyToResult(property, config)
    })
    optionsEl.appendChild(btn)
  }

  const docsLink = document.createElement('a')
  docsLink.href =
    'https://github.com/jullevistrunz/ExternalPoliceComputer#config'
  docsLink.target = '_blank'
  docsLink.innerHTML = 'Documentation'
  docsLink.id = 'docsLink'
  optionsEl.appendChild(docsLink)
}

function addPropertyToResult(property, config) {
  const resultEl = document.querySelector('.configPage .result')

  resultEl.querySelectorAll('label, input').forEach((el) => {
    el.remove()
  })

  resultEl.querySelector('.submit').disabled = false

  const label = document.createElement('label')
  const input = document.createElement('input')
  label.setAttribute('for', 'configInput')
  input.id = 'configInput'
  label.innerHTML = property
  input.value = config[property]

  resultEl.appendChild(label)
  resultEl.appendChild(input)
}

async function submitConfigResults() {
  const config = await (await fetch('/data/config')).json()

  const property = document.querySelector(
    '.configPage label[for="configInput"]'
  ).innerHTML

  const value = document.querySelector('.configPage #configInput').value

  if (!value) {
    return alert('Please enter a valid value')
  }

  config[property] =
    typeof config[property] == 'boolean'
      ? value == 'true'
      : typeof config[property] == 'number'
      ? parseFloat(value)
      : value

  await fetch('/post/updateConfig', {
    method: 'POST',
    body: JSON.stringify(config),
  })
  location.reload()
}

async function loadLicenseOptionsPage() {
  const options = await (await fetch('/data/licenseOptions')).json()
  const optionsEl = document.querySelector('.licenseOptionsPage .options')
  optionsEl.innerHTML = ''

  const addGroupBtn = document.createElement('button')
  addGroupBtn.innerHTML = 'Add Option'
  addGroupBtn.classList.add('addGroupBtn')
  addGroupBtn.addEventListener('click', function () {
    const name = prompt('Name')
    if (name) {
      addLicenseOption(name)
    }
  })
  optionsEl.appendChild(addGroupBtn)

  for (const i in options) {
    const btn = document.createElement('button')
    btn.innerHTML = options[i][0]
    btn.addEventListener('click', function () {
      this.blur()
      addLicenseOptionsToResult(options[i][0], options[i][1], i)
    })
    optionsEl.appendChild(btn)
  }
}

function addLicenseOptionsToResult(option, type, index) {
  const resultEl = document.querySelector('.licenseOptionsPage .result')

  resultEl.querySelectorAll('label, input').forEach((el) => {
    el.remove()
  })

  resultEl.dataset.index = index

  resultEl.querySelector('.submit').disabled = false
  resultEl.querySelector('.remove').disabled = false

  const optionLabel = document.createElement('label')
  const typeLabel = document.createElement('label')
  const optionInput = document.createElement('input')
  const typeInput = document.createElement('input')
  optionLabel.setAttribute('for', 'optionInput')
  typeLabel.setAttribute('for', 'typeInput')
  optionInput.id = 'optionInput'
  typeInput.id = 'typeInput'
  optionLabel.innerHTML = 'Name'
  typeLabel.innerHTML = 'Type [citation] or [arrest]'
  optionInput.value = option
  typeInput.value = type
  resultEl.appendChild(optionLabel)
  resultEl.appendChild(optionInput)
  resultEl.appendChild(typeLabel)
  resultEl.appendChild(typeInput)
}

async function submitLicenseResults() {
  const licenseOptions = await (await fetch('/data/licenseOptions')).json()

  const resultEl = document.querySelector('.licenseOptionsPage .result')

  const name = resultEl.querySelector('#optionInput').value
  const type = resultEl.querySelector('#typeInput').value

  if (!name || !type || (type != 'citation' && type != 'arrest')) {
    return alert('Please enter valid values')
  }

  licenseOptions.splice(parseInt(resultEl.dataset.index), 1)
  licenseOptions.push([name, type])

  await fetch('/post/updateLicenseOptions', {
    method: 'POST',
    body: JSON.stringify(licenseOptions),
  })
  location.reload()
}

async function removeLicenseOption() {
  const licenseOptions = await (await fetch('/data/licenseOptions')).json()
  const resultEl = document.querySelector('.licenseOptionsPage .result')

  licenseOptions.splice(parseInt(resultEl.dataset.index), 1)

  await fetch('/post/updateLicenseOptions', {
    method: 'POST',
    body: JSON.stringify(licenseOptions),
  })
  location.reload()
}

async function addLicenseOption(name) {
  const licenseOptions = await (await fetch('/data/licenseOptions')).json()
  const type = 'citation'

  licenseOptions.push([name, type])

  await fetch('/post/updateLicenseOptions', {
    method: 'POST',
    body: JSON.stringify(licenseOptions),
  })
  location.reload()
}

async function loadPluginsPage() {
  const plugins = await (await fetch('/data/plugins')).json()
  const activePlugins = await (await fetch('/data/activePlugins')).json()
  if (!Object.keys(plugins).length) return
  const pluginElements = []
  for (const plugin of Object.keys(plugins)) {
    if (!Object.keys(plugins[plugin].files).length) continue
    let filesString = ''
    for (const file of Object.keys(plugins[plugin].files)) {
      filesString += `&nbsp;- ${file} <div style="display: inline; opacity: 0.5;">${formatBytes(
        plugins[plugin].files[file].size
      )}</div><br>`
    }
    const el = elements.informationLabel(
      plugin,
      `${
        activePlugins.includes(plugin)
          ? '<div style="display: inline; color: rgb(0, 255, 0);">Enabled</div>'
          : '<div style="display: inline; color: var(--warning-color);">Disabled</div>'
      }<br>Size: ${formatBytes(
        plugins[plugin].size
      )}<br>Files:<br>${filesString}`,
      async function () {
        activePlugins.includes(plugin)
          ? await fetch('/post/removeActivePlugin', {
              method: 'POST',
              body: plugin,
            })
          : await fetch('/post/addActivePlugin', {
              method: 'POST',
              body: plugin,
            })
        loadPluginsPage()
      }
    )
    pluginElements.push(el)
  }

  const container = elements.informationLabelContainer(pluginElements)
  document.querySelector('.content .pluginsPage').innerHTML = ''
  document.querySelector('.content .pluginsPage').appendChild(container)
}

// https://stackoverflow.com/a/18650828
function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = [
    'Bytes',
    'KiB',
    'MiB',
    'GiB',
    'TiB',
    'PiB',
    'EiB',
    'ZiB',
    'YiB',
  ]

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
