const tenCodes = new Map([
  ['Code 1', 'No lights and sirens'],
  ['Code 2', 'Use lights, sirens only if needed'],
  ['Code 3', 'Use lights and sirens'],
  ['Code 4', 'No further units needed'],
  ['Code 5', 'Felony stop'],
  ['Code 6', 'Investigating'],
  ['10-1', 'Lost visual'],
  ['10-2', 'Radio check'],
  ['10-4', 'Acknowledgment'],
  ['10-5', 'Meal break'],
  ['10-6', 'Busy'],
  ['10-8', 'In service'],
  ['10-10', 'Fight in progress'],
  ['10-11', 'Traffic stop'],
  ['10-15', 'Prisoner in custody'],
  ['10-16', 'Prisoner transport needed'],
  ['10-19', 'Returning to the station'],
  ['10-23', 'Arrived at the scene'],
  ['10-27', "Driver's license check"],
  ['10-28', 'Vehicle registration check'],
  ['10-32 Code 2', 'Backup needed'],
  ['10-32 Code 2 State', 'Backup needed'],
  ['10-32 Code 3', 'Backup needed'],
  ['10-32 Code 3 State', 'Backup needed'],
  ['10-32 SWAT', 'Backup needed'],
  ['10-32 NOOSE', 'Backup needed'],
  ['10-32 female', 'Backup needed'],
  ['10-32 K-9', 'Backup needed'],
  ['10-41', 'Beginning tour of duty'],
  ['10-42', 'Ending tour of duty'],
  ['10-51', 'Wrecker needed'],
  ['10-52', 'Ambulance needed'],
  ['10-53', 'Fire needed'],
  ['10-79', 'Coroner needed'],
  ['10-80', 'Chase in progress'],
  ['10-97', 'En route'],
  ['11-44', 'Person deceased'],
  ['11-47', 'Person injured'],
])

// create html base
const tenCodesPage = API.createPage('tenCodes', 'Ten Codes', true)

const container = document.createElement('div')
container.classList.add('container')
tenCodesPage.appendChild(container)
const codeLabel = document.createElement('div')
codeLabel.classList.add('label')
container.appendChild(codeLabel)
const actionLabel = document.createElement('div')
actionLabel.classList.add('label')
container.appendChild(actionLabel)
const codeName = document.createElement('div')
codeName.classList.add('name')
codeName.innerHTML = 'Code'
codeLabel.appendChild(codeName)
const codeList = document.createElement('div')
codeList.classList.add('list')
codeLabel.appendChild(codeList)
const actionName = document.createElement('div')
actionName.classList.add('name')
actionName.innerHTML = 'Action'
actionLabel.appendChild(actionName)
const actionList = document.createElement('div')
actionList.classList.add('list')
actionLabel.appendChild(actionList)

// generate html using tenCodes Map
tenCodes.forEach((value, key) => {
  const codeItem = document.createElement('div')
  codeItem.classList.add('item')
  codeItem.innerHTML = key
  codeList.appendChild(codeItem)
  const actionItem = document.createElement('div')
  actionItem.classList.add('item')
  actionItem.innerHTML = value
  actionList.appendChild(actionItem)
})
