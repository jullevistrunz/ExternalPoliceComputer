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
