;(async function () {
  const config = await getConfig()
  if (config.updateDomWithLanguageOnLoad) await updateDomWithLanguage()
})()

async function updateDomWithLanguage() {
  const language = await getLanguage()
  traverseObject(language.vehicleSearch.static, (key, value, path = []) => {
    const selector = [...path, key].join('.')
    document
      .querySelectorAll(`[data-language="${selector}"]`)
      .forEach((el) => (el.innerHTML = value))
    document
      .querySelectorAll(`[data-language-placeholder="${selector}"]`)
      .forEach((el) => (el.placeholder = value))
  })
}

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

async function performSearch(query) {
  const language = await getLanguage()
  if (!query) {
    showNotification(
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
    showNotification(
      language.vehicleSearch.notifications.vehicleNotFound,
      'warning'
    )
    return
  }

  console.log(response)

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
