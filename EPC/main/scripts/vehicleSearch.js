;(async function () {
  const config = await getConfig()
  if (config.updateDomWithLanguageOnLoad)
    await updateDomWithLanguage('vehicleSearch')

  await loadSearchHistory()
})()

document
  .querySelector('.searchInputWrapper #vehicleSearchInput')
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
      document
        .querySelector('.searchInputWrapper #vehicleSearchInput')
        .value.trim()
    )

    hideLoadingOnButton(this)
  })

async function loadSearchHistory() {
  const history = await (
    await fetch('/data/searchHistory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'vehicle',
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
      document.querySelector('.searchInputWrapper #vehicleSearchInput').value =
        entry.ResultName
      document.querySelector('.searchInputWrapper button').click()
    })
    list.appendChild(item)
  }
}

async function performSearch(query) {
  const language = await getLanguage()
  if (!query) {
    topWindow.showNotification(
      language.vehicleSearch.notifications.emptySearchInput,
      'warning'
    )
    return
  }
  const response = await (
    await fetch('/data/specificVehicle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: query,
    })
  ).json()

  if (!response) {
    topWindow.showNotification(
      language.vehicleSearch.notifications.vehicleNotFound,
      'warning'
    )
    return
  }

  // Alert notification for stolen vehicles
  if (response.IsStolen) {
    topWindow.showNotification(
      `${language.vehicleSearch.notifications?.stolen || 'ALERT'}: ${language.vehicleSearch.notifications?.vehicleStolen || 'Vehicle'} ${response.LicensePlate} ${language.vehicleSearch.notifications?.reportedStolen || 'reported STOLEN'}`,
      'error',
      -1
    )
  }

  document.title = `${language.vehicleSearch.static.title}: ${response.LicensePlate}`

  document.querySelector('.searchResponseWrapper').classList.remove('hidden')

  for (const key of Object.keys(response)) {
    const el = document.querySelector(
      `.searchResponseWrapper [data-property="${key}"]`
    )
    if (!el) continue
    switch (key) {
      case 'RegistrationExpiration':
      case 'InsuranceExpiration':
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
      case 'Color':
        if (!response[key]) {
          el.parentElement.classList.add('hidden')
          break
        }
        el.parentElement.classList.remove('hidden')
        const color = `rgb(${response[key].split('-')[0]}, ${
          response[key].split('-')[1]
        }, ${response[key].split('-')[2]})`
        el.style.backgroundColor = color
        el.style.height = '19px'
        break
      case 'ModelDisplayName':
        el.parentElement.querySelector('img')?.remove()
        const imageEl = document.createElement('img')
        imageEl.src = `https://docs.fivem.net/vehicles/${response.ModelName.toLowerCase()}.webp`
        imageEl.onerror = () => imageEl.remove()
        el.parentElement.appendChild(imageEl)
        el.value = response[key]
        break
      case 'Owner':
        el.value = await getLanguageValue(response[key])
        if (response[key] && response[key] != 'Government') {
          el.parentElement.classList.add('clickable')
          el.parentElement.onclick = () => openInPedSearch(response[key])
        } else {
          el.parentElement.classList.remove('clickable')
          el.parentElement.onclick = null
        }
        break
      default:
        el.value = await getLanguageValue(response[key])
        el.style.color = getColorForValue(response[key])
    }
  }

  // Reload search history after successful search
  await loadSearchHistory()
}

function getColorForValue(value) {
  switch (value) {
    case true:
    case 'Revoked':
    case 'None':
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
