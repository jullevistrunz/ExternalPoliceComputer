;(async function () {
  const config = await getConfig()
  if (config.updateDomWithLanguageOnLoad)
    await updateDomWithLanguage('customization')
})()

document.querySelectorAll('.sidebar button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelector('.main').innerHTML = ''
    document
      .querySelectorAll('.sidebar button')
      .forEach((btn) => btn.classList.remove('selected'))
    button.classList.add('selected')
    button.blur()
  })
})

document
  .querySelector('.sidebar .plugins')
  .addEventListener('click', () => renderPluginsPage())

document
  .querySelector('.sidebar .config')
  .addEventListener('click', () => renderConfigPage())

async function renderPluginsPage() {
  const pluginInfo = await (await fetch('/pluginInfo')).json()
  const language = await getLanguage()
  const EPCVersionArr = (await (await fetch('/version')).text()).split('.')

  if (pluginInfo.length < 1) {
    document.querySelector('.main').innerHTML =
      language.customization.plugins.noPlugins
  }

  for (const plugin of pluginInfo) {
    const pluginElement = document.createElement('div')
    pluginElement.classList.add('plugin')
    pluginElement.title = plugin.id
    pluginElement.addEventListener('click', () => {
      togglePluginActivation(plugin.id)
      pluginElement.classList.toggle('selected')
    })
    const activePlugins = getActivePlugins()
    if (activePlugins.includes(plugin.id)) {
      pluginElement.classList.add('selected')
    }

    const name = document.createElement('div')
    name.classList.add('name')
    name.innerHTML = plugin.name
    pluginElement.appendChild(name)

    const description = document.createElement('div')
    description.classList.add('description')
    description.innerHTML = plugin.description
    pluginElement.appendChild(description)

    const versionArr = plugin.version.split('.')
    let versionColor = 'var(--color-success)'
    if (versionArr.length < 3) {
      versionColor = 'var(--color-error)'
    } else if (versionArr[0] != EPCVersionArr[0]) {
      versionColor = 'var(--color-error)'
    } else if (versionArr[1] != EPCVersionArr[1]) {
      versionColor = 'var(--color-warning)'
    } else if (versionArr[2] != EPCVersionArr[2]) {
      versionColor = 'var(--color-warning)'
    }

    const version = document.createElement('div')
    version.classList.add('version')

    version.innerHTML = `<span style="color: var(--color-text-primary-half)">${language.customization.plugins.version}</span>: <span style="color: ${versionColor}">${plugin.version}</span>`
    pluginElement.appendChild(version)

    const author = document.createElement('div')
    author.classList.add('author')
    author.innerHTML = `<span style="color: var(--color-text-primary-half)">${language.customization.plugins.author}</span>: ${plugin.author}`
    pluginElement.appendChild(author)

    document.querySelector('.main').appendChild(pluginElement)
  }
}

function togglePluginActivation(pluginId) {
  const activePlugins = getActivePlugins()
  if (activePlugins.includes(pluginId)) {
    activePlugins.splice(activePlugins.indexOf(pluginId), 1)
  } else {
    activePlugins.push(pluginId)
  }
  localStorage.setItem('activePlugins', JSON.stringify(activePlugins))
}

function renderConfigPage() {}

document.querySelector('.sidebar .plugins').click()
