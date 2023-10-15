const wordForJail = 'Jail'
const currency = '$'

window.addEventListener('load', function () {
  const pedBtnEl = document.querySelector('.searchPedPage .pedBtn')
  pedBtnEl.parentNode.replaceChild(pedBtnEl.cloneNode(true), pedBtnEl)
  const pedInpEl = document.querySelector('.searchPedPage .pedInp')
  pedInpEl.parentNode.replaceChild(pedInpEl.cloneNode(true), pedInpEl)
  const carBtnEl = document.querySelector('.searchCarPage .carBtn')
  carBtnEl.parentNode.replaceChild(carBtnEl.cloneNode(true), carBtnEl)
  const carInpEl = document.querySelector('.searchCarPage .carInp')
  carInpEl.parentNode.replaceChild(carInpEl.cloneNode(true), carInpEl)

  document
    .querySelector('.searchPedPage .pedBtn')
    .addEventListener('click', function () {
      renderPedSearchWithWarningColors()
    })

  document
    .querySelector('.searchPedPage .pedInp')
    .addEventListener('keydown', function (e) {
      if (e.key == 'Enter') {
        renderPedSearchWithWarningColors()
      }
    })

  document
    .querySelector('.searchCarPage .carBtn')
    .addEventListener('click', function () {
      renderCarSearchWithWarningColors()
    })

  document
    .querySelector('.searchCarPage .carInp')
    .addEventListener('keydown', function (e) {
      if (e.key == 'Enter') {
        renderCarSearchWithWarningColors()
      }
    })
})

async function renderPedSearchWithWarningColors() {
  await renderPedSearch()
  for (const label of document.querySelectorAll('.searchPedPage .label')) {
    switch (label.querySelector('.key').innerHTML) {
      case 'License Status': {
        label.querySelector('.value').innerHTML =
          label.querySelector('.value').innerHTML != 'Valid'
            ? `<a style="color: var(--warning-color); pointer-events: none;">${
                label.querySelector('.value').innerHTML
              }</a>`
            : label.querySelector('.value').innerHTML
        break
      }
      case 'Probation': {
        label.querySelector('.value').innerHTML =
          label.querySelector('.value').innerHTML != 'No'
            ? `<a style="color: var(--warning-color); pointer-events: none;">${
                label.querySelector('.value').innerHTML
              }</a>`
            : label.querySelector('.value').innerHTML
        break
      }
      case 'Parole': {
        label.querySelector('.value').innerHTML =
          label.querySelector('.value').innerHTML != 'No'
            ? `<a style="color: var(--warning-color); pointer-events: none;">${
                label.querySelector('.value').innerHTML
              }</a>`
            : label.querySelector('.value').innerHTML
        break
      }
      case 'Outstanding Warrant': {
        label.querySelector('.value').innerHTML =
          label.querySelector('.value').innerHTML != 'None'
            ? `<a style="color: var(--warning-color); pointer-events: none;">${
                label.querySelector('.value').innerHTML
              }</a>`
            : label.querySelector('.value').innerHTML
        break
      }
    }
  }
}

async function renderCarSearchWithWarningColors() {
  await renderCarSearch()
  for (const label of document.querySelectorAll('.searchCarPage .label')) {
    switch (label.querySelector('.key').innerHTML) {
      case 'Insurance': {
        label.querySelector('.value').innerHTML =
          label.querySelector('.value').innerHTML != 'Valid'
            ? `<a style="color: var(--warning-color); pointer-events: none;">${
                label.querySelector('.value').innerHTML
              }</a>`
            : label.querySelector('.value').innerHTML
        break
      }
      case 'Registration': {
        label.querySelector('.value').innerHTML =
          label.querySelector('.value').innerHTML != 'Valid'
            ? `<a style="color: var(--warning-color); pointer-events: none;">${
                label.querySelector('.value').innerHTML
              }</a>`
            : label.querySelector('.value').innerHTML
        break
      }
      case 'Stolen': {
        label.querySelector('.value').innerHTML =
          label.querySelector('.value').innerHTML != 'No'
            ? `<a style="color: var(--warning-color); pointer-events: none;">${
                label.querySelector('.value').innerHTML
              }</a>`
            : label.querySelector('.value').innerHTML
        break
      }
    }
  }
}
