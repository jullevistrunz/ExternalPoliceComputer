const wordForJail = 'Jail'
const currency = '$'

window.addEventListener('load', function () {
  const carBtnEl = document.querySelector('.searchCarPage .carBtn')
  carBtnEl.parentNode.replaceChild(carBtnEl.cloneNode(true), carBtnEl)
  const carInpEl = document.querySelector('.searchCarPage .carInp')
  carInpEl.parentNode.replaceChild(carInpEl.cloneNode(true), carInpEl)

  document
    .querySelector('.searchCarPage .carBtn')
    .addEventListener('click', function () {
      renderCarSearchWithoutRegistrationAndInsurance()
    })
  document
    .querySelector('.searchCarPage .carInp')
    .addEventListener('keydown', function (e) {
      if (e.key == 'Enter') {
        renderCarSearchWithoutRegistrationAndInsurance()
      }
    })
})

async function renderCarSearchWithoutRegistrationAndInsurance() {
  await renderCarSearch()
  for (const label of document.querySelectorAll(
    '.searchCarPage .resultContainer .labelContainer .label'
  )) {
    if (
      label.querySelector('.key').innerHTML == 'Registration' ||
      label.querySelector('.key').innerHTML == 'Insurance'
    ) {
      label.remove()
    }
  }
}
