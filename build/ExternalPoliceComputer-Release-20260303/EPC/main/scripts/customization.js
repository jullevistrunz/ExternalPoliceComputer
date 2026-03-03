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
  const pluginsWrapper = document.createElement('div')
  pluginsWrapper.classList.add('pluginsWrapper')

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

    pluginsWrapper.appendChild(pluginElement)
  }
  document.querySelector('.main').appendChild(pluginsWrapper)
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

async function renderConfigPage() {
  const language = await getLanguage()
  const config = await getConfig()

  const buttonWrapper = document.createElement('div')
  buttonWrapper.classList.add('buttonWrapper')
  const saveButton = document.createElement('button')
  saveButton.innerHTML = language.customization.save
  saveButton.addEventListener('click', async () => {
    const inputs = document.querySelectorAll('.configWrapper input')
    const newConfig = {}
    inputs.forEach((input) => {
      const key = input.previousSibling.innerHTML
      let value
      if (input.type === 'checkbox') {
        value = input.checked
      } else if (input.type === 'number') {
        value = parseFloat(input.value)
      } else {
        value = input.value
      }
      newConfig[key] = value
    })

    await fetch('/post/updateConfig', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newConfig),
    })

    localStorage.removeItem('config')
    document.querySelector('.main').innerHTML = ''
    renderConfigPage()
  })

  const resetButton = document.createElement('button')
  resetButton.innerHTML = language.customization.reset
  resetButton.addEventListener('click', () => {
    document.querySelector('.main').innerHTML = ''
    renderConfigPage()
  })

  buttonWrapper.appendChild(resetButton)
  buttonWrapper.appendChild(saveButton)
  document.querySelector('.main').appendChild(buttonWrapper)

  const configWrapper = document.createElement('div')
  configWrapper.classList.add('configWrapper')

  for (const [key, value] of Object.entries(config)) {
    let type = 'text'
    if (typeof value === 'boolean') {
      type = 'checkbox'
    } else if (typeof value === 'number') {
      type = 'number'
    }

    const wrapper = document.createElement('div')
    wrapper.classList.add('configItem')

    const label = document.createElement('label')
    label.innerHTML = key
    label.htmlFor = `config-${key}`
    wrapper.appendChild(label)

    const inputElement = document.createElement('input')
    if (type === 'checkbox') {
      inputElement.checked = value
    } else {
      inputElement.value = value
    }
    inputElement.type = type
    inputElement.id = `config-${key}`
    wrapper.appendChild(inputElement)

    configWrapper.appendChild(wrapper)
  }
  document.querySelector('.main').appendChild(configWrapper)
}

document.querySelector('.sidebar .plugins').click()
