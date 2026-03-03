;(async function () {
  const config = await getConfig()
  if (config.updateDomWithLanguageOnLoad)
    await updateDomWithLanguage('pedSearch')

  await loadSearchHistory()
  await loadRepeatOffenders()
})()

document
  .querySelector('.searchInputWrapper #pedSearchInput')
  .addEventListener('keydown', async function (e) {
    if (e.key == 'Enter') {
      e.preventDefault()
      document.querySelector('.searchInputWrapper button').click()
    }
  })

document
  .querySelector('.searchInputWrapper button')
  .addEventListener('click', async function () {
    if (this.classList.contains('loading')) return
    showLoadingOnButton(this)

    this.blur()
    await performSearch(
      document.querySelector('.searchInputWrapper #pedSearchInput').value.trim()
    )

    hideLoadingOnButton(this)
  })

async function loadSearchHistory() {
  const history = await (
    await fetch('/data/searchHistory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'ped',
    })
  ).json()

  const wrapper = document.querySelector('.searchHistoryWrapper')
  const list = document.querySelector('.searchHistoryList')
  list.innerHTML = ''

  if (history.length === 0) {
    wrapper.classList.add('hidden')
    return
  }

  wrapper.classList.remove('hidden')

  for (const entry of history) {
    const item = document.createElement('button')
    item.innerHTML = `${entry.ResultName} <span class="searchCount">(${entry.SearchCount})</span>`
    item.addEventListener('click', async function () {
      document.querySelector('.searchInputWrapper #pedSearchInput').value =
        entry.ResultName
      document.querySelector('.searchInputWrapper button').click()
    })
    list.appendChild(item)
  }
}

async function loadRepeatOffenders() {
  const language = await getLanguage()
  const offenders = await (await fetch('/data/repeatOffenders')).json()

  const wrapper = document.querySelector('.repeatOffendersWrapper')
  const list = document.querySelector('.repeatOffendersList')
  list.innerHTML = ''

  if (offenders.length === 0) {
    wrapper.classList.add('hidden')
    return
  }

  wrapper.classList.remove('hidden')

  for (const offender of offenders) {
    const item = document.createElement('button')
    const count =
      (offender.CitationCount || 0) + (offender.ArrestCount || 0)
    item.innerHTML = `${offender.Name} <span class="searchCount">(${count})</span>`
    if (offender.IsWanted) item.style.borderColor = 'var(--color-error)'
    item.addEventListener('click', async function () {
      document.querySelector('.searchInputWrapper #pedSearchInput').value =
        offender.Name
      document.querySelector('.searchInputWrapper button').click()
    })
    list.appendChild(item)
  }
}

async function performSearch(query) {
  const language = await getLanguage()
  if (!query) {
    topWindow.showNotification(
      language.pedSearch.notifications.emptySearchInput,
      'warning'
    )
    return
  }
  const response = await (
    await fetch('/data/specificPed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: query,
    })
  ).json()

  if (!response) {
    topWindow.showNotification(
      language.pedSearch.notifications.pedNotFound,
      'warning'
    )
    return
  }

  // Alert notifications for wanted/probation/parole/advisory
  if (response.IsWanted) {
    topWindow.showNotification(
      `${language.pedSearch.notifications?.wanted || 'WANTED'}: ${response.Name} \u2014 ${response.WarrantText}`,
      'warning',
      -1
    )
  }
  if (response.IsOnProbation) {
    topWindow.showNotification(
      `${language.pedSearch.notifications?.advisory || 'ADVISORY'}: ${response.Name} ${language.pedSearch.notifications?.isOnProbation || 'is on probation'}`,
      'warning',
      8000
    )
  }
  if (response.IsOnParole) {
    topWindow.showNotification(
      `${language.pedSearch.notifications?.advisory || 'ADVISORY'}: ${response.Name} ${language.pedSearch.notifications?.isOnParole || 'is on parole'}`,
      'warning',
      8000
    )
  }
  if (response.AdvisoryText) {
    topWindow.showNotification(
      `${language.pedSearch.notifications?.advisory || 'ADVISORY'}: ${response.AdvisoryText}`,
      'info',
      8000
    )
  }

  document.title = `${language.pedSearch.static.title}: ${response.Name}`

  document.querySelector('.searchResponseWrapper').classList.remove('hidden')

  for (const key of Object.keys(response)) {
    const el = document.querySelector(
      `.searchResponseWrapper [data-property="${key}"]`
    )
    if (!el) continue
    switch (key) {
      case 'Birthday':
        el.value = new Date(response[key]).toLocaleDateString()
        document.querySelector(
          '.searchResponseWrapper [data-property="Age"]'
        ).value = Math.abs(
          new Date(
            Date.now() - new Date(response[key]).getTime()
          ).getFullYear() - 1970
        )
        break
      case 'IsWanted':
        el.value = response[key]
          ? `${language.values.wanted} ${response.WarrantText}`
          : language.values.notWanted
        el.style.color = getColorForValue(response[key])
        break
      case 'AdvisoryText':
        el.value = await getLanguageValue(response[key])
        if (response[key] != undefined) el.style.color = 'var(--color-error)'
        break
      case 'LicenseExpiration':
      case 'WeaponPermitExpiration':
      case 'HuntingPermitExpiration':
      case 'FishingPermitExpiration':
        el.value = await getLanguageValue(response[key])
        el.value =
          response[key] == null
            ? await getLanguageValue(response[key])
            : new Date(response[key]).toLocaleDateString()

        if (
          response[key] != null &&
          new Date(response[key]).getTime() < Date.now()
        ) {
          el.style.color = 'var(--color-warning)'
        }
        break
      case 'WeaponPermitType':
        el.value = await getLanguageValue(
          response.WeaponPermitStatus == 'Valid' ? response[key] : null
        )
        break
      case 'Citations':
      case 'Arrests':
        el.parentElement.classList.add('clickable')
        el.parentElement.onclick = () =>
          openPedAsOffenderInReport(
            key == 'Citations' ? 'citation' : 'arrest',
            response.Name
          )
        el.innerHTML =
          response[key].length > 0
            ? response[key].map((item) => `<li>${item.name}</li>`).join('')
            : await getLanguageValue(null)
        break
      default:
        el.value = await getLanguageValue(response[key])
        el.style.color = getColorForValue(response[key])
    }
  }

  // Vehicles owned by this ped
  const vehiclesResponse = await (
    await fetch('/data/pedVehicles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: response.Name,
    })
  ).json()

  document
    .querySelectorAll(
      '.searchResponseWrapper .vehiclesOwned, .searchResponseWrapper .vehiclesOwnedTitle'
    )
    .forEach((el) => el.remove())

  if (vehiclesResponse.length > 0) {
    const sectionTitle = document.createElement('div')
    sectionTitle.classList.add('searchResponseSectionTitle', 'vehiclesOwnedTitle')
    sectionTitle.innerHTML =
      language.pedSearch.static?.vehiclesOwnedTitle || 'Vehicles Owned'
    document.querySelector('.searchResponseWrapper').appendChild(sectionTitle)

    const vehiclesSection = document.createElement('div')
    vehiclesSection.classList.add('inputWrapper', 'grid', 'vehiclesOwned')
    document.querySelector('.searchResponseWrapper').appendChild(vehiclesSection)

    for (const vehicle of vehiclesResponse) {
      const el = document.createElement('div')
      el.classList.add('clickable')
      el.addEventListener('click', () =>
        openInVehicleSearch(vehicle.LicensePlate)
      )
      const label = document.createElement('label')
      label.innerHTML = vehicle.LicensePlate
      const input = document.createElement('input')
      input.type = 'text'
      input.disabled = true
      input.value = vehicle.ModelDisplayName || vehicle.LicensePlate
      if (vehicle.IsStolen) input.style.color = 'var(--color-error)'
      el.appendChild(label)
      el.appendChild(input)
      vehiclesSection.appendChild(el)
    }
  }

  // Reports involving this ped
  const reportsResponse = await (
    await fetch('/data/pedReports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: response.Name,
    })
  ).json()

  document
    .querySelectorAll(
      '.searchResponseWrapper .pedReports, .searchResponseWrapper .pedReportsTitle'
    )
    .forEach((el) => el.remove())

  const totalReports =
    reportsResponse.citations.length +
    reportsResponse.arrests.length +
    reportsResponse.incidents.length

  if (totalReports > 0) {
    const sectionTitle = document.createElement('div')
    sectionTitle.classList.add('searchResponseSectionTitle', 'pedReportsTitle')
    sectionTitle.innerHTML =
      language.pedSearch.static?.reportsTitle || 'Associated Reports'
    document.querySelector('.searchResponseWrapper').appendChild(sectionTitle)

    const reportsSection = document.createElement('div')
    reportsSection.classList.add('inputWrapper', 'grid', 'pedReports')
    document.querySelector('.searchResponseWrapper').appendChild(reportsSection)

    const allReports = [
      ...reportsResponse.citations.map((r) => ({ ...r, type: 'citation' })),
      ...reportsResponse.arrests.map((r) => ({ ...r, type: 'arrest' })),
      ...reportsResponse.incidents.map((r) => ({ ...r, type: 'incident' })),
    ].sort((a, b) => new Date(b.TimeStamp) - new Date(a.TimeStamp))

    for (const report of allReports) {
      const el = document.createElement('div')
      el.classList.add('clickable')
      el.addEventListener('click', () =>
        openIdInReport(report.Id, report.type)
      )
      const label = document.createElement('label')
      label.innerHTML =
        report.type.charAt(0).toUpperCase() + report.type.slice(1)
      const input = document.createElement('input')
      input.type = 'text'
      input.disabled = true
      input.value = `${report.Id} - ${new Date(report.TimeStamp).toLocaleDateString()}`
      input.style.color = `var(--color-${statusColorMap[report.Status]})`
      el.appendChild(label)
      el.appendChild(input)
      reportsSection.appendChild(el)
    }
  }

  // Reload search history after successful search
  await loadSearchHistory()
}

function getColorForValue(value) {
  switch (value) {
    case true:
    case 'Revoked':
    case 'Unlicensed':
    case 'Suspended':
      return 'var(--color-error)'
    case false:
    case 'Valid':
      return 'var(--color-success)'
    case 'Expired':
      return 'var(--color-warning)'
    default:
      return 'var(--color-text-primary)'
  }
}
