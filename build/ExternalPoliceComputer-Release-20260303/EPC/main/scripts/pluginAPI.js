const API = {
  /**
   * Extends a function by adding callback functions before and after the original function is executed.
   *
   * @param {{ (...args: any[]) => any }} oldFunction - The original function to be extended.
   * @param {{ (...args: any[]) => any }} [cbBefore=function(){}] - The callback function to be executed before the original function.
   * @param {{ (...args: any[]) => any }} [cbAfter=function(){}] - The callback function to be executed after the original function.
   * @return {{ (...args: any[]) => any }} The extended function.
   */
  extendFunction: function (
    oldFunction,
    cbBefore = function () {},
    cbAfter = function () {}
  ) {
    return async function (...args) {
      cbBefore(...args)
      const valueToReturn = await oldFunction(...args)
      cbAfter(...args)
      return valueToReturn
    }
  },
  /**
   * Displays a notification message on the top window context with customizable icon, color, and duration.
   * If a notification with the same message already exists, it replaces the old one.
   * If duration is negative, the notification will persist until manually closed.
   *
   * @param {string} message - The notification message to display.
   * @param {'warning'|'info'|'error'|'question'|'checkMark'|'minus'} [icon='info'] - The icon type to display with the notification.
   * @param {number} [duration=4000] - Duration in milliseconds before the notification disappears. If negative, notification stays until closed.
   */
  showNotification: function (message, icon = 'info', duration = 4000) {
    topWindow.showNotification(message, icon, duration)
  },
  /**
   *
   * @param {string} name - Internal name of the page
   * @param {string} title - Title displayed on the desktop icon
   * @param {string} icon - Icon HTML (preferably SVG)
   * @param {{ (contentWindow: Window) => void }} [callback=function(){}] - Function that runs after the page is loaded. Receives the contentWindow of the page's iframe.
   * @param {boolean} [addToDesktop=true] - Whether to add the page to the desktop.
   */
  createNewPage: function (
    name,
    title,
    icon,
    callback = function () {},
    addToDesktop = true
  ) {
    const pluginId = document.currentScript.dataset.pluginId

    const desktopItem = document.createElement('button')
    desktopItem.classList.add('desktopItem')
    desktopItem.dataset.name = name
    desktopItem.addEventListener('click', function () {
      openWindow(name, pluginId)
    })

    const desktopIcon = document.createElement('div')
    desktopIcon.classList.add('icon')
    desktopIcon.innerHTML = icon
    desktopItem.appendChild(desktopIcon)

    const desktopTitle = document.createElement('div')
    desktopTitle.classList.add('title')
    desktopTitle.innerHTML = title
    desktopItem.appendChild(desktopTitle)

    if (addToDesktop) {
      document.querySelector('.desktop').appendChild(desktopItem)
    }

    const iconAccessIcon = document.createElement('div')
    iconAccessIcon.classList.add(name)
    iconAccessIcon.innerHTML = icon
    document.querySelector('.iconAccess').appendChild(iconAccessIcon)

    document.addEventListener(`windowLoaded:${name}`, function () {
      callback(
        document.querySelector('.overlay .windows .window:last-child iframe')
          .contentWindow
      )
    })
  },
}
