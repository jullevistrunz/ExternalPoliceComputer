const isInIframe = window.self !== window.top
const topWindow = isInIframe ? window.top : window
const topDoc = isInIframe ? window.top.document : document

if (!isInIframe) {
  localStorage.removeItem('config')
  localStorage.removeItem('language')
  localStorage.removeItem('citationOptions')
  localStorage.removeItem('arrestOptions')
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function getConfig() {
  const lsConfig = localStorage.getItem('config')
  if (lsConfig) {
    return JSON.parse(lsConfig)
  }
  const config = await (await fetch('/config')).json()
  localStorage.setItem('config', JSON.stringify(config))
  return config
}

async function getLanguage() {
  const lsLanguage = localStorage.getItem('language')
  if (lsLanguage) {
    return JSON.parse(lsLanguage)
  }
  const language = await (await fetch('/language')).json()
  localStorage.setItem('language', JSON.stringify(language))
  return language
}

async function getCitationOptions() {
  const lsCitationOptions = localStorage.getItem('citationOptions')
  if (lsCitationOptions) {
    return JSON.parse(lsCitationOptions)
  }
  const citationOptions = await (await fetch('/citationOptions')).json()
  localStorage.setItem('citationOptions', JSON.stringify(citationOptions))
  return citationOptions
}

async function getArrestOptions() {
  const lsArrestOptions = localStorage.getItem('arrestOptions')
  if (lsArrestOptions) {
    return JSON.parse(lsArrestOptions)
  }
  const arrestOptions = await (await fetch('/arrestOptions')).json()
  localStorage.setItem('arrestOptions', JSON.stringify(arrestOptions))
  return arrestOptions
}

function traverseObject(obj, callback, path = []) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        traverseObject(obj[key], callback, [...path, key])
      } else {
        callback(key, obj[key], path)
      }
    }
  }
}

const keepLoadingOnButton = new Object()

async function showLoadingOnButton(button) {
  keepLoadingOnButton[button] = true
  await sleep(50)
  if (keepLoadingOnButton[button]) button.classList.add('loading')
}

function hideLoadingOnButton(button) {
  button.classList.remove('loading')
  delete keepLoadingOnButton[button]
}

function showNotification(message, icon = 'info', duration = 4000) {
  const color =
    {
      warning: 'warning',
      info: 'info',
      error: 'error',
      question: 'info',
      checkMark: 'success',
      minus: 'error',
    }[icon] || 'info'

  const wrapperEl = document.createElement('div')
  wrapperEl.classList.add('notification')
  wrapperEl.style.backgroundColor = `var(--color-${color}-half)`
  wrapperEl.style.border = `1px solid var(--color-${color})`

  const iconTitleWrapperEl = document.createElement('div')
  iconTitleWrapperEl.classList.add('iconTitleWrapper')

  const iconEl = document.createElement('div')
  iconEl.classList.add('icon')
  iconEl.innerHTML =
    topDoc.querySelector(`.iconAccess .notificationIcons .${icon}`)
      ?.innerHTML ??
    topDoc.querySelector(`.iconAccess .notificationIcons .info`).innerHTML

  const titleEl = document.createElement('div')
  titleEl.classList.add('title')
  titleEl.innerHTML = message

  const timerBarEl = document.createElement('div')
  timerBarEl.classList.add('timerBar')
  timerBarEl.style.transition = `width ${duration}ms linear`
  timerBarEl.style.backgroundColor = `var(--color-${color})`

  iconTitleWrapperEl.appendChild(iconEl)
  iconTitleWrapperEl.appendChild(titleEl)
  wrapperEl.appendChild(iconTitleWrapperEl)
  wrapperEl.appendChild(timerBarEl)
  let replacesOldNotification = false
  for (const notification of topDoc.querySelectorAll(
    '.overlay .notifications .notification'
  )) {
    if (notification.querySelector('.title').innerHTML == message) {
      notification.replaceWith(wrapperEl)
      wrapperEl.style.animation = 'none'
      replacesOldNotification = true
    }
  }
  if (!replacesOldNotification)
    topDoc.querySelector('.overlay .notifications').appendChild(wrapperEl)

  if (duration >= 0) removeNotification()
  else {
    duration = 0
    const closeEl = document.createElement('div')
    closeEl.classList.add('close')
    closeEl.innerHTML = topDoc.querySelector(
      '.iconAccess .closeWindow'
    ).innerHTML
    closeEl.addEventListener('click', function () {
      removeNotification()
    })
    closeEl.addEventListener('mouseover', function () {
      closeEl.style.backgroundColor = `var(--color-${color})`
    })
    closeEl.addEventListener('mouseout', function () {
      closeEl.style.removeProperty('background-color')
    })
    wrapperEl.appendChild(closeEl)
  }

  function removeNotification() {
    setTimeout(() => {
      if (timerBarEl) timerBarEl.style.width = '0%'
    }, 10)

    setTimeout(() => {
      if (wrapperEl)
        wrapperEl.style.animation =
          'notification-fly-out var(--transition-time-long) ease-in-out forwards'
    }, duration)

    const CSSRootTransitionTimeLong = parseInt(
      getComputedStyle(document.querySelector(':root'))
        .getPropertyValue('--transition-time-long')
        .trim()
        .slice(0, -'ms'.length)
    )
    setTimeout(() => {
      if (wrapperEl) wrapperEl.remove()
    }, CSSRootTransitionTimeLong + duration + 500)
  }
}

async function getLanguageValue(value) {
  const language = await getLanguage()
  if (value === '' || value === null || value === undefined)
    return language.values.empty
  return language.values[value] || value
}

async function openInPedSearch(pedName) {
  await topWindow.openWindow('pedSearch')
  const iframe = topDoc
    .querySelector('.overlay .windows')
    .lastChild.querySelector('iframe')

  iframe.onload = () => {
    iframe.contentWindow.document.querySelector(
      '.searchInputWrapper #pedSearchInput'
    ).value = pedName
    iframe.contentWindow.document
      .querySelector('.searchInputWrapper button')
      .click()
  }
}

let reportIsOnCreatePageBool = false
function reportIsOnCreatePage() {
  return reportIsOnCreatePageBool
}

async function getCurrencyString(number) {
  const language = await getLanguage()
  const config = await getConfig()
  if (config.displayCurrencySymbolBeforeNumber) {
    return language.units.currencySymbol + number
  }
  return number + language.units.currencySymbol
}

async function convertDaysToYMD(days) {
  const language = await getLanguage()
  const years = Math.floor(days / 365)
  const daysAfterYears = days % 365
  const months = Math.floor(daysAfterYears / 30)
  const remainingDays = daysAfterYears % 30
  const parts = []
  if (years) parts.push(`${years}${language.units.year}`)
  if (months) parts.push(`${months}${language.units.month}`)
  if (remainingDays) parts.push(`${remainingDays}${language.units.day}`)
  return parts.join(', ') || `0${language.units.day}`
}

async function convertMsToTimeString(ms) {
  const language = await getLanguage()
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60

  const pad = (n) => String(n).padStart(2, '0')
  const result = []

  if (h > 0) result.push(`${pad(h)}${language.units.hour}`)
  if (m > 0 || h > 0) result.push(`${pad(m)}${language.units.minute}`)
  if (s > 0 || m > 0 || h > 0 || result.length == 0)
    result.push(`${pad(s)}${language.units.second}`)

  return result.join(' ')
}
