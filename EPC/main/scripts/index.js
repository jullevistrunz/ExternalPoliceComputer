;(async function () {
  const config = await getConfig()
  const language = await getLanguage()
  if (config.updateDomWithLanguageOnLoad) await updateDomWithLanguage('index')
  const version = await (await fetch('/version')).text()
  document.querySelector(
    '.overlay .settings .version'
  ).innerHTML = `${language.index.settings.version}: ${version}`

  const officerInformationData = await (
    await fetch('/data/officerInformationData')
  ).json()
  applyOfficerInformationToDOM(officerInformationData)
})()

const timeWS = new WebSocket(`ws://${location.host}/ws`)
timeWS.onopen = () => timeWS.send('interval/time')

let currentShift = null

timeWS.onmessage = async (event) => {
  const config = await getConfig()
  const data = JSON.parse(event.data)
  const inGameDateArr = data.response.split(':')
  const inGameDate = new Date()
  inGameDate.setHours(inGameDateArr[0])
  inGameDate.setMinutes(inGameDateArr[1])
  inGameDate.setSeconds(inGameDateArr[2])
  const realDate = new Date()
  document.querySelector('.taskbar .time').innerHTML = `${
    config.useInGameTime
      ? inGameDate.toLocaleTimeString()
      : realDate.toLocaleTimeString()
  }<br>${realDate.toLocaleDateString()}`

  currentShift =
    currentShift ?? (await (await fetch('/data/currentShift')).json())
  applyCurrentShiftToDOM(
    currentShift,
    config.useInGameTime ? inGameDate : realDate
  )
}

document
  .querySelector('.overlay .settings .currentShift .buttonWrapper .startShift')
  .addEventListener('click', async function () {
    if (this.classList.contains('loading')) return
    showLoadingOnButton(this)

    const response = await (
      await fetch('/post/modifyCurrentShift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'start',
      })
    ).text()

    const language = await getLanguage()
    if (response == 'OK') {
      currentShift = await (await fetch('/data/currentShift')).json()
      const officerInformationData = await (
        await fetch('/data/officerInformationData')
      ).json()
      if (officerInformationData.rank && officerInformationData.lastName) {
        showNotification(
          `${language.index.notifications.currentShiftStartedOfficerInformationExists} ${officerInformationData.rank} ${officerInformationData.lastName}`
        )
      } else {
        showNotification(language.index.notifications.currentShiftStarted)
      }
    } else {
      showNotification(
        language.index.notifications.currentShiftStartedError,
        'error'
      )
    }

    hideLoadingOnButton(this)
  })

document
  .querySelector('.overlay .settings .currentShift .buttonWrapper .endShift')
  .addEventListener('click', async function () {
    if (this.classList.contains('loading')) return
    showLoadingOnButton(this)

    const response = await (
      await fetch('/post/modifyCurrentShift', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'end',
      })
    ).text()

    const language = await getLanguage()
    if (response == 'OK') {
      currentShift = await (await fetch('/data/currentShift')).json()
      showNotification(language.index.notifications.currentShiftEnded)
    } else {
      showNotification(
        language.index.notifications.currentShiftEndedError,
        'error'
      )
    }

    hideLoadingOnButton(this)
  })

async function applyCurrentShiftToDOM(currentShift, currentDate) {
  const language = await getLanguage()
  if (currentShift.startTime) {
    document.querySelector(
      '.overlay .settings .currentShift .buttonWrapper .startShift'
    ).disabled = true
    document.querySelector(
      '.overlay .settings .currentShift .buttonWrapper .endShift'
    ).disabled = false

    document.querySelector(
      '.overlay .settings .currentShift .startTime'
    ).innerHTML = `${
      language.index.settings.currentShift.startTime
    }: ${new Date(currentShift.startTime).toLocaleTimeString()}`

    const duration = await convertMsToTimeString(
      currentDate.getTime() - new Date(currentShift.startTime).getTime()
    )
    document.querySelector(
      '.overlay .settings .currentShift .duration'
    ).innerHTML = `${language.index.settings.currentShift.duration}: ${duration}`
  } else {
    document.querySelector(
      '.overlay .settings .currentShift .buttonWrapper .startShift'
    ).disabled = false
    document.querySelector(
      '.overlay .settings .currentShift .buttonWrapper .endShift'
    ).disabled = true

    document.querySelector(
      '.overlay .settings .currentShift .startTime'
    ).innerHTML = language.index.settings.currentShift.offDuty
    document.querySelector(
      '.overlay .settings .currentShift .duration'
    ).innerHTML = ''
  }
}

timeWS.onclose = async () => {
  const language = await getLanguage()
  showNotification(language.index.notifications.webSocketOnClose, 'warning', -1)
}

const locationWS = new WebSocket(`ws://${location.host}/ws`)
locationWS.onopen = () => locationWS.send('interval/playerLocation')

locationWS.onmessage = async (event) => {
  const location = JSON.parse(event.data).response
  const icon = document.querySelector('.iconAccess .location').innerHTML
  document.querySelector(
    '.taskbar .location'
  ).innerHTML = `${icon} ${location.Postal} ${location.Street},<br>${location.Area}`
}

locationWS.onclose = async () => {
  const language = await getLanguage()
  showNotification(language.index.notifications.webSocketOnClose, 'warning', -1)
}

const desktopItems = document.querySelectorAll('.desktop .desktopItem')

for (const desktopItem of desktopItems) {
  desktopItem.addEventListener('click', function () {
    openWindow(this.dataset.name)
  })
}

async function openWindow(name) {
  const config = await getConfig()
  const url = `/page/${name}.html`
  const size = [config.initialWindowWidth, config.initialWindowHeight]
  const windowDimensions = [window.innerWidth, window.innerHeight]
  const offset = [
    windowDimensions[0] / 2 - size[0] / 2,
    windowDimensions[1] / 2 - size[1] / 2,
  ]

  const existingWindows = document.querySelectorAll('.overlay .windows .window')

  const windowElement = document.createElement('div')
  windowElement.style.width = `${size[0]}px`
  windowElement.style.height = `${size[1]}px`
  windowElement.style.left = `${offset[0] + existingWindows.length * 25}px`
  windowElement.style.top = `${offset[1] + existingWindows.length * 25}px`
  windowElement.style.scale = '0'
  windowElement.classList.add('window')

  const taskbarIcon = document.createElement('button')

  function focusWindow() {
    document.querySelectorAll('.overlay .windows .window').forEach((win) => {
      win.style.zIndex = ''
    })
    windowElement.style.zIndex = '3'

    document
      .querySelectorAll('.taskbar .icons button.focused')
      .forEach((icon) => {
        icon.classList.remove('focused')
      })
    taskbarIcon.classList.add('focused')
  }
  windowElement.addEventListener('mousedown', focusWindow)

  const iframe = document.createElement('iframe')
  iframe.src = url
  const header = document.createElement('div')
  header.classList.add('windowHeader')
  let x, y
  let lastSize
  let lastOffset
  header.addEventListener('mousedown', function (e) {
    e.preventDefault()
    x = e.clientX - windowElement.offsetLeft
    y = e.clientY - windowElement.offsetTop
    document.onmouseup = function () {
      document.onmouseup = null
      document.onmousemove = null
      windowElement.style.transition = '250ms ease'
    }
    document.onmousemove = function (e) {
      if (
        e.clientX < 0 ||
        e.clientY < 0 ||
        e.clientX > document.querySelector('.desktop').clientWidth ||
        e.clientY > document.querySelector('.desktop').clientHeight
      ) {
        document.onmouseup()
      }
      if (e.target == windowControls || windowControls.contains(e.target)) {
        document.onmouseup()
        return
      }
      windowElement.style.transition = 'none'
      windowElement.style.left = e.clientX - x + 'px'
      windowElement.style.top = e.clientY - y + 'px'
      if (windowElement.classList.contains('maximized')) {
        windowElement.classList.remove('maximized')
        windowElement.style.width = lastSize[0]
        windowElement.style.height = lastSize[1]
        windowElement.querySelector(
          '.windowHeader .windowControls .maximizeButton'
        ).innerHTML = document.querySelector(
          '.iconAccess .maximizeWindow'
        ).innerHTML
      }
    }
  })

  new ResizeObserver(() => {
    windowElement.onmouseup = function () {
      windowElement.style.transition = '250ms ease'
    }
    windowElement.onmousedown = function () {
      windowElement.style.transition = 'none'
    }
  }).observe(windowElement)

  const windowControls = document.createElement('div')
  windowControls.classList.add('windowControls')

  const iconTitleWrapper = document.createElement('div')
  iconTitleWrapper.classList.add('iconTitleWrapper')

  const icon = document.createElement('div')
  icon.classList.add('icon')
  icon.innerHTML = document.querySelector(`.iconAccess .${name}`).innerHTML

  const title = document.createElement('div')
  title.classList.add('title')
  iframe.addEventListener('load', () => {
    title.innerHTML = iframe.contentDocument.title
    taskbarIcon.title = iframe.contentDocument.title
    windowElement.style.minWidth = `${
      iconTitleWrapper.offsetWidth + windowControls.offsetWidth
    }px`
    windowElement.style.scale = '1'

    new MutationObserver(() => {
      title.innerHTML = iframe.contentDocument.title
      taskbarIcon.title = iframe.contentDocument.title
      windowElement.style.minWidth = `${
        iconTitleWrapper.offsetWidth + windowControls.offsetWidth
      }px`
    }).observe(iframe.contentDocument.querySelector('title'), {
      childList: true,
    })

    iframe.contentWindow.addEventListener('mousedown', focusWindow)
    iframe.contentWindow.addEventListener('mousedown', function () {
      document.querySelector('.overlay .settings').classList.add('hide')
    })
  })

  const minimize = document.createElement('div')
  minimize.classList.add('minimizeButton')
  minimize.innerHTML = document.querySelector(
    '.iconAccess .minimizeWindow'
  ).innerHTML
  minimize.addEventListener('click', function () {
    windowElement.classList.toggle('minimized')
    if (!windowElement.classList.contains('minimized')) {
      focusWindow()
    } else {
      taskbarIcon.classList.remove('focused')
    }
  })

  const maximize = document.createElement('div')
  maximize.classList.add('maximizeButton')
  maximize.innerHTML = document.querySelector(
    '.iconAccess .maximizeWindow'
  ).innerHTML
  maximize.addEventListener('click', function () {
    if (windowElement.classList.contains('maximized')) {
      windowElement.classList.remove('maximized')
      windowElement.style.width = lastSize[0]
      windowElement.style.height = lastSize[1]
      windowElement.style.left = lastOffset[0]
      windowElement.style.top = lastOffset[1]
      windowElement.querySelector(
        '.windowHeader .windowControls .maximizeButton'
      ).innerHTML = document.querySelector(
        '.iconAccess .maximizeWindow'
      ).innerHTML
    } else {
      lastSize = [windowElement.style.width, windowElement.style.height]
      lastOffset = [windowElement.style.left, windowElement.style.top]
      windowElement.style.width = 'calc(100% - 2px)'
      windowElement.style.height = `calc(100% - var(--tb-height))`
      windowElement.style.left = '0'
      windowElement.style.top = '0'
      windowElement.style.minWidth = `${
        iconTitleWrapper.offsetWidth + windowControls.offsetWidth
      }px`
      windowElement.classList.add('maximized')
      windowElement.querySelector(
        '.windowHeader .windowControls .maximizeButton'
      ).innerHTML = document.querySelector(
        '.iconAccess .restoreWindow'
      ).innerHTML
    }
  })
  header.addEventListener('dblclick', function () {
    maximize.click()
  })

  const close = document.createElement('div')
  close.classList.add('closeButton')
  close.innerHTML = document.querySelector('.iconAccess .closeWindow').innerHTML
  close.addEventListener('click', async function () {
    windowElement.style.pointerEvents = 'none'
    taskbarIcon.style.pointerEvents = 'none'
    const CSSRootTransitionTimeLong = parseInt(
      getComputedStyle(document.querySelector(':root'))
        .getPropertyValue('--transition-time-long')
        .trim()
        .slice(0, -'ms'.length)
    )
    windowElement.style.scale = '0'
    taskbarIcon.style.opacity = '0'
    await sleep(CSSRootTransitionTimeLong)
    windowElement.remove()
    taskbarIcon.remove()
  })
  iconTitleWrapper.appendChild(icon)
  iconTitleWrapper.appendChild(title)
  header.appendChild(iconTitleWrapper)
  windowControls.appendChild(minimize)
  windowControls.appendChild(maximize)
  windowControls.appendChild(close)
  header.appendChild(windowControls)
  windowElement.appendChild(header)
  windowElement.appendChild(iframe)

  document.querySelector('.overlay .windows').appendChild(windowElement)

  focusWindow()

  taskbarIcon.classList.add('open')
  taskbarIcon.innerHTML = icon.innerHTML
  taskbarIcon.addEventListener('click', function () {
    this.blur()
    if (
      !taskbarIcon.classList.contains('focused') &&
      !windowElement.classList.contains('minimized')
    ) {
      focusWindow()
    } else {
      minimize.click()
    }
  })

  taskbarIcon.style.opacity = '0'

  document.querySelector('.taskbar .icons').appendChild(taskbarIcon)

  requestAnimationFrame(() => {
    taskbarIcon.style.opacity = '1'
  })
}

document.addEventListener('mousedown', function (e) {
  const taskbarIcon = document.querySelector('.taskbar .icons .settings')
  const settingsEl = document.querySelector('.overlay .settings')
  if (
    e.target == taskbarIcon ||
    taskbarIcon.contains(e.target) ||
    settingsEl.classList.contains('hide') ||
    e.target == settingsEl ||
    settingsEl.contains(e.target)
  ) {
    return
  }
  settingsEl.classList.add('hide')
})

new MutationObserver(() => {
  setMinWidthOnTaskbar()
}).observe(document.querySelector('.taskbar'), {
  childList: true,
  subtree: true,
})

setMinWidthOnTaskbar()
function setMinWidthOnTaskbar() {
  const taskbar = document.querySelector('.taskbar')
  const locationWidth = taskbar.querySelector('.location').clientWidth
  const timeWidth = taskbar.querySelector('.time').clientWidth
  const additionalWidth =
    locationWidth > timeWidth ? locationWidth * 2 : timeWidth * 2
  taskbar.style.minWidth = `${
    taskbar.querySelector('.icons').clientWidth + additionalWidth
  }px`
}

document
  .querySelector('.overlay .settings .officerInformation .autoFill')
  .addEventListener('click', async function () {
    if (this.classList.contains('loading')) return
    showLoadingOnButton(this)

    const officerInformation = await (
      await fetch('/data/officerInformation')
    ).json()
    applyOfficerInformationToDOM(officerInformation)

    hideLoadingOnButton(this)
  })

function applyOfficerInformationToDOM(officerInformation) {
  const inputWrapper = document.querySelector(
    '.overlay .settings .officerInformation .inputWrapper'
  )
  for (const key in officerInformation) {
    if (officerInformation[key]) {
      inputWrapper.querySelector(`.${key} input`).value =
        officerInformation[key]
    }
  }
}

document
  .querySelector('.overlay .settings .officerInformation .save')
  .addEventListener('click', async function () {
    if (this.classList.contains('loading')) return
    showLoadingOnButton(this)

    const inputWrapper = document.querySelector(
      '.overlay .settings .officerInformation .inputWrapper'
    )

    const response = await (
      await fetch('post/updateOfficerInformationData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName:
            inputWrapper.querySelector('.firstName input').value != ''
              ? inputWrapper.querySelector('.firstName input').value
              : null,
          lastName:
            inputWrapper.querySelector('.lastName input').value != ''
              ? inputWrapper.querySelector('.lastName input').value
              : null,
          badgeNumber:
            inputWrapper.querySelector('.badgeNumber input').value != ''
              ? inputWrapper.querySelector('.badgeNumber input').value
              : null,
          rank:
            inputWrapper.querySelector('.rank input').value != ''
              ? inputWrapper.querySelector('.rank input').value
              : null,
          callSign:
            inputWrapper.querySelector('.callSign input').value != ''
              ? inputWrapper.querySelector('.callSign input').value
              : null,
          agency:
            inputWrapper.querySelector('.agency input').value != ''
              ? inputWrapper.querySelector('.agency input').value
              : null,
        }),
      })
    ).text()

    const language = await getLanguage()

    if (response == 'OK') {
      showNotification(
        language.index.notifications.officerInformationSaved,
        'checkMark'
      )
    } else {
      showNotification(
        language.index.notifications.officerInformationError,
        'error'
      )
    }

    hideLoadingOnButton(this)
  })
