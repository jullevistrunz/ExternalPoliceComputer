if (!localStorage.getItem('removedTooltips')) {
  localStorage.setItem('removedTooltips', '[]')
}

const tooltipConfig = async () => {
  return await (await fetch('/plugins/ToolTips.1.4.3/config.json')).json()
}

const tooltipFuncs = {
  /**
   * Creates a tooltip element with the given text and offset position.
   *
   * @param {string} name - The internal name of the tooltip.
   * @param {string} text - The text to display in the tooltip.
   * @param {Object} offset
   * @param {number} offset.x - The offset position on the x-axis of the tooltip.
   * @param {number} offset.y - The offset position on the y-axis of the tooltip.
   * @param {number} maxWidth - The maximum width of the tooltip.
   */
  createTooltip: (name, text, offset, maxWidth = null) => {
    const removedTooltips = JSON.parse(localStorage.getItem('removedTooltips'))
    if (removedTooltips.includes(name)) return
    const tooltip = document.createElement('div')
    tooltip.classList.add('tooltip')
    tooltip.style.transform = `translate(${offset.x}px, ${offset.y}px)`
    if (maxWidth) tooltip.style.maxWidth = `${maxWidth}px`
    const iconEl = document.createElement('div')
    iconEl.classList.add('icon')
    iconEl.innerHTML =
      '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="none"><path fill="var(--main-color)" fill-rule="evenodd" d="M8 16A8 8 0 108 0a8 8 0 000 16zm0-9a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 7zm0-3a1 1 0 000 2h.007a1 1 0 000-2H8z" clip-rule="evenodd"/></svg>'
    const closeEl = document.createElement('div')
    closeEl.classList.add('close')
    closeEl.innerHTML = '&#10006;'
    const textEl = document.createElement('div')
    textEl.classList.add('text')
    textEl.innerHTML = text
    tooltip.appendChild(iconEl)
    tooltip.appendChild(textEl)
    tooltip.appendChild(closeEl)
    closeEl.addEventListener('click', () => {
      const oldLS = JSON.parse(localStorage.getItem('removedTooltips'))
      oldLS.push(name)
      localStorage.setItem('removedTooltips', JSON.stringify(oldLS))
      tooltip.remove()
    })
    document.querySelector('.overlay').appendChild(tooltip)
  },
  /**
   * Removes all tooltip elements.
   */
  clearAllTooltips: () => {
    document.querySelectorAll('.tooltip').forEach((tooltip) => {
      tooltip.remove()
    })
  },
}

goToPage = API.extendFunction(goToPage, function () {
  tooltipFuncs.clearAllTooltips()
  tooltipFuncs.createTooltip(
    'pageNewWindow',
    'Right-click a page to open it in a new window.',
    {
      x: document.querySelector('.header').getBoundingClientRect().right - 410,
      y: 5,
    },
    400
  )
})

//
;(async function () {
  const config = await tooltipConfig()
  if (config.reset) {
    localStorage.removeItem('removedTooltips')
  }
})()
