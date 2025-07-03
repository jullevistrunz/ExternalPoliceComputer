;(async function () {
  const config = await getConfig()
  const language = await getLanguage()
  if (config.updateDomWithLanguageOnLoad) await updateDomWithLanguage()
})()

async function updateDomWithLanguage() {
  const language = await getLanguage()
  traverseObject(language.reports.static, (key, value, path = []) => {
    const selector = [...path, key].join('.')
    document
      .querySelectorAll(`[data-language="${selector}"]`)
      .forEach((el) => (el.innerHTML = value))
    document
      .querySelectorAll(`[data-language-title="${selector}"]`)
      .forEach((el) => (el.title = value))
  })
}

document
  .querySelector('.listPage .createButton')
  .addEventListener('click', async function () {
    const language = await getLanguage()
    document.title = language.reports.newReportTitle
  })

document
  .querySelectorAll('.listPage .listWrapper .typeSelector button')
  .forEach((button) =>
    button.addEventListener('click', async function () {
      button.blur()
      document
        .querySelectorAll('.listPage .listWrapper .typeSelector button')
        .forEach((btn) => btn.classList.remove('selected'))
      button.classList.add('selected')
    })
  )

document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('.listPage .listWrapper .typeSelector button').click()
})
