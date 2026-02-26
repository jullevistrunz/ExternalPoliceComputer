;(async function () {
  const config = await getConfig()
  if (config.updateDomWithLanguageOnLoad)
    await updateDomWithLanguage('pedSearch')
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
        el.value = removeGTAColorCodesFromString(response[key])
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
