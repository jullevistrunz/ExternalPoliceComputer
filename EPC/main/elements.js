const elements = {
  // informationLabel
  informationLabelContainer: function (informationLabels) {
    const element = document.createElement('div')
    element.classList.add('informationLabelContainer')
    for (const label of informationLabels) {
      element.appendChild(label)
    }
    return element
  },
  informationLabel: function (key, value, onClick = null) {
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
    return element
  },
}
