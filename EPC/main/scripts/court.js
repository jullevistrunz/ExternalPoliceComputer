;(async function () {
  const language = await getLanguage()
  const config = await getConfig()
  if (config.updateDomWithLanguageOnLoad) await updateDomWithLanguage('court')

  const courtCases = await (await fetch('/data/court')).json()

  if (courtCases.length < 1) {
    document.querySelector('.list').innerHTML = language.court.empty
  }

  for (const courtCase of courtCases.reverse()) {
    
  }
})()
