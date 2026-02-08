async function getMultipleNameInputsSection(
  title,
  label,
  plusButtonText,
  removeButtonText,
  isList = false,
  list = []
) {
  const titleEl = document.createElement('div')
  if (isList) {
    titleEl.classList.add('searchResponseSectionTitle')
  } else {
    titleEl.classList.add('title')
  }
  titleEl.innerHTML = title

  const inputWrapper = document.createElement('div')
  inputWrapper.classList.add('inputWrapper')
  inputWrapper.classList.add('grid')

  if (isList) {
    for (const i in list) {
      const input = document.createElement('div')
      if (isList && list[i]) {
        input.classList.add('clickable')
        input.addEventListener('click', function () {
          openInPedSearch(list[i])
        })
      }
      const inputLabel = document.createElement('label')
      inputLabel.innerHTML = `${label} ${parseInt(i) + 1}`
      inputLabel.htmlFor = `multipleNameInputsSection${title}Input${
        parseInt(i) + 1
      }`
      const inputInput = document.createElement('input')
      inputInput.type = 'text'
      inputInput.value = list[i] || ''
      inputInput.id = `multipleNameInputsSection${title}Input${parseInt(i) + 1}`
      inputInput.autocomplete = 'off'
      inputInput.disabled = isList
      input.appendChild(inputLabel)
      input.appendChild(inputInput)

      inputWrapper.appendChild(input)
    }
  } else {
    const input1 = document.createElement('div')
    const input1Label = document.createElement('label')
    input1Label.innerHTML = `${label} 1`
    input1Label.htmlFor = `multipleNameInputsSection${title}Input1`
    const input1Input = document.createElement('input')
    input1Input.type = 'text'
    input1Input.id = `multipleNameInputsSection${title}Input1`
    input1Input.autocomplete = 'off'
    input1Input.disabled = isList
    input1Input.addEventListener('blur', function () {
      checkForValidPedName(input1Input)
    })
    input1.appendChild(input1Label)
    input1.appendChild(input1Input)

    const buttonWrapper = document.createElement('div')
    buttonWrapper.classList.add('buttonWrapper')

    const plusButton = document.createElement('button')
    plusButton.classList.add('plusButton')
    plusButton.innerHTML = plusButtonText

    const removeButton = document.createElement('button')

    plusButton.addEventListener('click', function () {
      plusButton.blur()
      const newInput = document.createElement('div')
      const newInputLabel = document.createElement('label')
      newInputLabel.innerHTML = `${label} ${
        inputWrapper.querySelectorAll('div:has(input)').length + 1
      }`
      newInputLabel.htmlFor = `multipleNameInputsSection${title}Input${
        inputWrapper.querySelectorAll('div:has(input)').length + 1
      }`
      const newInputInput = document.createElement('input')
      newInputInput.type = 'text'
      newInputInput.id = `multipleNameInputsSection${title}Input${
        inputWrapper.querySelectorAll('div:has(input)').length + 1
      }`
      newInputInput.autocomplete = 'off'
      newInputInput.addEventListener('blur', function () {
        checkForValidPedName(newInputInput)
      })
      newInput.appendChild(newInputLabel)
      newInput.appendChild(newInputInput)

      inputWrapper.insertBefore(newInput, buttonWrapper)

      const length = inputWrapper.querySelectorAll('div:has(input)').length
      removeButton.disabled = length < 2
      newInputInput.focus()
    })

    removeButton.classList.add('removeButton')
    removeButton.innerHTML = removeButtonText
    removeButton.disabled = true
    removeButton.addEventListener('click', function () {
      const length = inputWrapper.querySelectorAll('div:has(input)').length
      inputWrapper.querySelectorAll('div:has(input)')[length - 1].remove()

      removeButton.disabled = length < 3
      removeButton.blur()
    })

    inputWrapper.appendChild(input1)
    buttonWrapper.appendChild(plusButton)
    buttonWrapper.appendChild(removeButton)
    inputWrapper.appendChild(buttonWrapper)
  }

  const sectionWrapper = document.createElement('div')
  sectionWrapper.classList.add('section')
  sectionWrapper.dataset.title = title
  if (isList) sectionWrapper.classList.add('searchResponseWrapper')

  sectionWrapper.appendChild(titleEl)
  sectionWrapper.appendChild(inputWrapper)

  return sectionWrapper
}
