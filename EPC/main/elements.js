const elements = {
  /**
   * @param {HTMLDivElement[]} informationLabels
   * @returns informationLabelContainer
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
   *
   * @param {String} key
   * @param {String} value
   * @param {function} onClick
   * @param {String[]} classList
   * @returns informationLabel
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
}
