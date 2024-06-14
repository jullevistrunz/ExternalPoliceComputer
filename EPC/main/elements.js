const elements = {
  /**
   * Creates an information label container element with the provided information labels.
   *
   * @param {HTMLDivElement[]} informationLabels - The array of information labels to be added to the container.
   * @return {HTMLDivElement} The created information label container element.
   */
  informationLabelContainer: function (informationLabels) {
    const element = document.createElement('div')
    element.classList.add('informationLabelContainer')
    for (const label of informationLabels) {
      element.appendChild(label)
    }
    return element
  },
  /**
   * Creates an information label element with the given key and value.
   *
   * @param {string} key - The key of the information label.
   * @param {string} value - The value of the information label.
   * @param {function|null} onClick - The click event handler for the information label. Defaults to null.
   * @param {string[]|null} classList - The list of additional CSS classes for the information label. Defaults to null.
   * @returns {HTMLDivElement} The created information label element.
   */
  informationLabel: function (key, value, onClick = null, classList = null) {
    const element = document.createElement('div')
    element.classList.add('informationLabel')
    const keyEl = document.createElement('div')
    keyEl.classList.add('key')
    keyEl.innerHTML = key
    const valueEl = document.createElement('div')
    valueEl.classList.add('value')
    valueEl.innerHTML = value
    element.appendChild(keyEl)
    element.appendChild(valueEl)
    if (typeof onClick == 'function') {
      element.classList.add('informationLabelWithOnClick')
      element.addEventListener('click', onClick)
    }
    if (classList) {
      for (const classListItem of classList) {
        element.classList.add(classListItem)
      }
    }
    return element
  },
  /**
   * Creates a new window element with the specified URL, size, and offset.
   *
   * @param {string} url - The URL of the content to be displayed in the new window.
   * @param {Array<number>} size - An array containing the width and height of the new window.
   * @param {Array<number>} offset - An array containing the left and top offset of the new window.
   * @return {HTMLElement} The newly created window element.
   */
  newWindow: function (url, size, offset) {
    const el = document.createElement('div')
    el.style.width = size[0] + 'px'
    el.style.height = size[1] + 'px'
    el.style.left = offset[0] + 'px'
    el.style.top = offset[1] + 'px'
    el.classList.add('newWindow')
    function focusWindow() {
      document.querySelectorAll('.overlay .windows *').forEach((win) => {
        win.style.zIndex = ''
      })
      el.style.zIndex = '3'
    }
    el.addEventListener('mousedown', focusWindow)
    const iframe = document.createElement('iframe')
    iframe.src = url
    const header = document.createElement('div')
    header.classList.add('windowHeader')
    let x, y
    header.addEventListener('mousedown', function (e) {
      e.preventDefault()
      x = e.clientX - el.offsetLeft
      y = e.clientY - el.offsetTop
      document.onmouseup = function () {
        document.onmouseup = null
        document.onmousemove = null
      }
      document.onmousemove = function (e) {
        if (
          e.clientX < 0 ||
          e.clientY < 0 ||
          e.clientX > window.innerWidth ||
          e.clientY > window.innerHeight
        ) {
          document.onmouseup()
        }
        el.style.left = e.clientX - x + 'px'
        el.style.top = e.clientY - y + 'px'
      }
    })
    const title = document.createElement('div')
    title.classList.add('title')
    iframe.addEventListener('load', function () {
      title.innerHTML = iframe.contentDocument.title
      new MutationObserver(function () {
        title.innerHTML = iframe.contentDocument.title
      }).observe(iframe.contentDocument.querySelector('title'), {
        childList: true,
      })
      iframe.contentDocument.body.addEventListener('mousedown', focusWindow)
    })
    const close = document.createElement('div')
    close.classList.add('close')
    close.innerHTML = '&#10006;'
    close.addEventListener('click', function () {
      el.remove()
    })
    header.appendChild(title)
    header.appendChild(close)
    el.appendChild(header)
    el.appendChild(iframe)
    focusWindow()
    return el
  },
}
