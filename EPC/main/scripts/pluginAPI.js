const API = {
  /**
   * Creates a new page with the given name and header text.
   *
   * @param {string} name - The internal name of the page.
   * @param {string} headerText - The text to be displayed in the header button to select the page.
   * @param {boolean} [allowOpenInNewWindow=true] - Whether to allow the page to be opened in a new window.
   * @return {HTMLElement} The newly created page element.
   */
  createPage: function (name, headerText, allowOpenInNewWindow = true) {
    const headerItem = document.createElement('button')
    headerItem.innerHTML = headerText
    headerItem.classList.add(name)
    headerItem.addEventListener('click', function () {
      this.classList.remove('notification')
      goToPage(name)
    })
    headerItem.addEventListener('contextmenu', function (e) {
      e.preventDefault()
      if (!allowOpenInNewWindow) return
      openInNewWindow('page', name)
    })

    const pageEl = document.createElement('div')
    pageEl.classList.add(name + 'Page')
    pageEl.classList.add('hidden')
    document.querySelector('.content').appendChild(pageEl)
    document.querySelector('.header').appendChild(headerItem)
    return pageEl
  },
  /**
   * Removes all event listeners from the given element.
   *
   * @param {HTMLElement} element - The element from which to remove event listeners.
   * @return {HTMLElement} The new element with all event listeners removed.
   */
  removeAllEventListeners: function (element) {
    const clonedElement = element.cloneNode(true)
    element.replaceWith(clonedElement)
    return clonedElement
  },
  /**
   * Reassigns an event listener to a DOM element.
   *
   * @param {string} selector - The CSS selector of the element.
   * @param {string} eventType - The type of event to listen for.
   * @param {function} cb - The callback function to execute when the new event is triggered.
   */
  reassignEventListener: function (selector, eventType, cb) {
    const el = document.querySelector(selector)
    el.parentNode.replaceChild(el.cloneNode(true), el)
    document.querySelector(selector).addEventListener(eventType, cb)
  },

  /**
   * Extends a function by adding callback functions before and after the original function is executed.
   *
   * @param {Function} oldFunction - The original function to be extended.
   * @param {Function} [cbBefore=function(){}] - The callback function to be executed before the original function.
   * @param {Function} [cbAfter=function(){}] - The callback function to be executed after the original function.
   * @return {Function} The extended function.
   */
  extendFunction: function (
    oldFunction,
    cbBefore = function () {},
    cbAfter = function () {}
  ) {
    return async function (...args) {
      cbBefore(...args)
      await oldFunction(...args)
      cbAfter(...args)
    }
  },
}
