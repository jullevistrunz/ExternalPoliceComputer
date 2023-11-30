const http = require('http')
const fs = require('fs')
const url = require('url')
const os = require('os')
const version = '1.3.3'

const config = JSON.parse(fs.readFileSync('config.json'))
const port = config.port

// log
fs.writeFileSync('EPC.log', '')
createLog('EPC server log initialized')
createLog(`Version: ${version}`)
createLog(`Timezone offset: ${new Date().getTimezoneOffset()}`)
createLog(`Log path: ${fs.realpathSync('EPC.log')}`)
createLog(`Config: ${JSON.stringify(config)}`)
function createLog(message) {
  const content = `[${new Date().toISOString()}] ${message}\n`
  fs.writeFileSync('EPC.log', `${fs.readFileSync('EPC.log')}${content}`)
}
process.on('uncaughtException', function (err) {
  console.error(err)
  createLog(err.stack)
})

// clear data on start up
const dataDefaults = new Map([
  ['worldPeds.data', ''],
  ['worldCars.data', ''],
  ['currentID.data', ''],
  ['peds.json', '[]'],
  ['cars.json', '[]'],
  ['court.json', '[]'],
  ['shift.json', '{"currentShift":null,"shifts":[]}'],
])
let fallbackToDefaultLanguage = false
generateDirectory()
clearGeneratedData()

const server = http.createServer(function (req, res) {
  const path = url.parse(req.url, true).pathname
  const query = url.parse(req.url, true).query
  if (path == '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.write(fs.readFileSync('main/index.html'))
    res.end()
  } else if (path == '/styles') {
    res.writeHead(200, { 'Content-Type': 'text/css' })
    res.write(fs.readFileSync('main/styles.css'))
    res.end()
  } else if (path == '/customStyles') {
    res.writeHead(200, { 'Content-Type': 'text/css' })
    res.write(fs.readFileSync('custom.css'))
    res.end()
  } else if (path == '/script') {
    res.writeHead(200, { 'Content-Type': 'text/js' })
    res.write(fs.readFileSync('main/script.js'))
    res.end()
  } else if (path == '/customScript') {
    res.writeHead(200, { 'Content-Type': 'text/js' })
    res.write(fs.readFileSync('custom.js'))
    res.end()
  } else if (path == '/map') {
    res.writeHead(200, { 'Content-Type': 'image/jpeg' })
    res.write(fs.readFileSync('img/map.jpeg'))
    res.end()
  } else if (path == '/defaultMugshot') {
    res.writeHead(200, { 'Content-Type': 'image/png' })
    res.write(fs.readFileSync('img/logo.png'))
    res.end()
  } else if (path == '/favicon') {
    res.writeHead(200, { 'Content-Type': 'image/png' })
    res.write(fs.readFileSync('img/favicon.png'))
    res.end()
  } else if (path == '/customization') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.write(fs.readFileSync('customization/index.html'))
    res.end()
  } else if (path == '/customizationStyles') {
    res.writeHead(200, { 'Content-Type': 'text/css' })
    res.write(fs.readFileSync('customization/styles.css'))
    res.end()
  } else if (path == '/customizationScript') {
    res.writeHead(200, { 'Content-Type': 'text/js' })
    res.write(fs.readFileSync('customization/script.js'))
    res.end()
  } else if (path == '/createLog') {
    createLog('Incoming client log: ' + query.message)
    res.writeHead(200)
    res.end()
  } else if (path.startsWith('/data/')) {
    const dataPath = path.slice('/data/'.length)
    if (dataPath == 'peds') {
      const pedData = generatePeds()
      res.writeHead(200, { 'Content-Type': 'text/json' })
      res.write(JSON.stringify(pedData))
      res.end()
    } else if (dataPath == 'cars') {
      generatePeds()
      const carData = generateCars()
      res.writeHead(200, { 'Content-Type': 'text/json' })
      res.write(JSON.stringify(carData))
      res.end()
    } else if (dataPath == 'citationOptions') {
      res.writeHead(200, { 'Content-Type': 'text/json' })
      res.write(fs.readFileSync('citationOptions.json'))
      res.end()
    } else if (dataPath == 'arrestOptions') {
      res.writeHead(200, { 'Content-Type': 'text/json' })
      res.write(fs.readFileSync('arrestOptions.json'))
      res.end()
    } else if (dataPath == 'court') {
      res.writeHead(200, { 'Content-Type': 'text/json' })
      res.write(fs.readFileSync('data/court.json'))
      res.end()
    } else if (dataPath == 'shift') {
      res.writeHead(200, { 'Content-Type': 'text/json' })
      res.write(fs.readFileSync('data/shift.json'))
      res.end()
    } else if (dataPath == 'currentID') {
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.write(fs.readFileSync('data/currentID.data'))
      res.end()
    } else if (dataPath == 'config') {
      res.writeHead(200, { 'Content-Type': 'text/json' })
      res.write(fs.readFileSync('config.json'))
      res.end()
    } else if (dataPath == 'licenseOptions') {
      res.writeHead(200, { 'Content-Type': 'text/json' })
      res.write(fs.readFileSync('licenseOptions.json'))
      res.end()
    } else if (dataPath == 'language') {
      res.writeHead(200, { 'Content-Type': 'text/json' })
      if (fallbackToDefaultLanguage) {
        res.write(fs.readFileSync('defaults/language.json'))
      } else {
        res.write(fs.readFileSync('language.json'))
      }
      res.end()
    } else {
      res.writeHead(404)
      res.end()
    }
  } else if (path.startsWith('/post/')) {
    createLog(`Post request at: ${path}`)
    const dataPath = path.slice('/post/'.length)
    let body = ''
    req.on('data', (chunk) => {
      body += chunk.toString()
      createLog(`Payload: ${body}`)
    })
    req.on('end', () => {
      if (dataPath == 'addCitations') {
        let data = JSON.parse(fs.readFileSync('data/peds.json'))
        const newData = JSON.parse(body)
        for (const i in data) {
          if (data[i].name == newData.name) {
            for (const citation of newData.citations) {
              data[i].citations.push(citation)
            }
          }
        }
        fs.writeFileSync('data/peds.json', JSON.stringify(data))
        res.writeHead(200)
        res.end()
      } else if (dataPath == 'addArrests') {
        let data = JSON.parse(fs.readFileSync('data/peds.json'))
        const newData = JSON.parse(body)
        for (const i in data) {
          if (data[i].name == newData.name) {
            for (const arrest of newData.arrests) {
              data[i].arrests.push(arrest)
            }
          }
        }
        fs.writeFileSync('data/peds.json', JSON.stringify(data))
        res.writeHead(200)
        res.end()
      } else if (dataPath == 'addToCourt') {
        const data = JSON.parse(fs.readFileSync('data/court.json'))
        data.push(JSON.parse(body))
        fs.writeFileSync('data/court.json', JSON.stringify(data))
        if (JSON.parse(body).outcome.includes('Granted Probation')) {
          const peds = JSON.parse(fs.readFileSync('data/peds.json'))
          for (const i in peds) {
            if (peds[i].name == JSON.parse(body).ped) {
              peds[i].probation = 'Yes'
            }
          }
          fs.writeFileSync('data/peds.json', JSON.stringify(peds))
        }
        const shift = JSON.parse(fs.readFileSync('data/shift.json'))
        if (shift.currentShift) {
          shift.currentShift.courtCases.push(JSON.parse(body).number)
          fs.writeFileSync('data/shift.json', JSON.stringify(shift))
        }
        res.writeHead(200)
        res.end()
      } else if (dataPath == 'updateCurrentShift') {
        const data = JSON.parse(fs.readFileSync('data/shift.json'))
        data.currentShift = JSON.parse(body)
        fs.writeFileSync('data/shift.json', JSON.stringify(data))
        res.writeHead(200)
        res.end()
      } else if (dataPath == 'addShift') {
        const data = JSON.parse(fs.readFileSync('data/shift.json'))
        data.shifts.push(JSON.parse(body))
        fs.writeFileSync('data/shift.json', JSON.stringify(data))
        res.writeHead(200)
        res.end()
      } else if (dataPath == 'updateCurrentShiftNotes') {
        const data = JSON.parse(fs.readFileSync('data/shift.json'))
        data.currentShift.notes = body
        fs.writeFileSync('data/shift.json', JSON.stringify(data))
        res.writeHead(200)
        res.end()
      } else if (dataPath == 'updateCourtDescription') {
        const court = JSON.parse(fs.readFileSync('data/court.json'))
        body = JSON.parse(body)
        for (i in court) {
          if (court[i].number == body.number) {
            court[i].description = body.description
          }
        }
        fs.writeFileSync('data/court.json', JSON.stringify(court))
        res.writeHead(200)
        res.end()
      } else if (dataPath == 'removeCurrentID') {
        const file = fs.readFileSync('data/currentID.data', 'utf-8')
        const arr = file.split(';')
        arr.splice(body, 1)
        fs.writeFileSync('data/currentID.data', arr.join(';'))
        res.writeHead(200)
        res.end()
      } else if (dataPath == 'updateOptions') {
        body = JSON.parse(body)
        fs.writeFileSync(
          `${body.type}Options.json`,
          JSON.stringify(body.options, null, 2)
        )
        res.writeHead(200)
        res.end()
      } else if (dataPath == 'updateConfig') {
        body = JSON.parse(body)
        fs.writeFileSync('config.json', JSON.stringify(body, null, 2))
        res.writeHead(200)
        res.end()
      } else if (dataPath == 'updateLicenseOptions') {
        body = JSON.parse(body)
        fs.writeFileSync('licenseOptions.json', JSON.stringify(body, null, 2))
        res.writeHead(200)
        res.end()
      } else {
        res.writeHead(404)
        res.end()
      }
      createLog(`Responded with status code: ${res.statusCode}`)
    })
  } else {
    res.writeHead(404)
    res.end()
  }
})
server.listen(port, function () {
  const nets = os.networkInterfaces()
  let result = ''
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
      if (net.family === familyV4Value && !net.internal) {
        result = net.address
      }
    }
  }
  console.info(
    'The Node.js server has started. You can minimize this window now and start your game.'
  )
  console.info(
    `For usage on the same device go to http://localhost:${port} or http://127.0.0.1:${port}`
  )
  console.info(
    `For usage on another device go to http://${os.hostname()}:${port} or http://${result}:${port}`
  )
  createLog(`Server listening on port ${port}`)
})

//funcs
function generatePeds() {
  const worldPedDataRaw = fs.readFileSync('data/worldPeds.data', 'utf-8')
  const worldPedDataArr = worldPedDataRaw.split(',')
  const worldPedData = []

  worldPedDataArr.forEach((ped) => {
    let params = new URLSearchParams(ped)
    worldPedData.push(paramsToObject(params.entries()))
  })

  let pedData = new Array()
  try {
    pedData = JSON.parse(fs.readFileSync('data/peds.json'))
  } catch {
    fs.writeFileSync('data/peds.json', '[]')
  }

  let pedNameArr = new Array()
  for (ped of pedData) {
    pedNameArr.push(ped.name)
  }

  for (const worldPed of worldPedData) {
    if (pedNameArr.includes(worldPed.name)) {
      continue
    }
    const allCharges = getAllArrestOptions()
    const allCitations = getAllCitationOptions()
    const citations = getRandomCitations(allCitations)
    const arrests = getRandomArrests(allCharges, worldPed.isWanted == 'True')
    const licenseOptions = JSON.parse(fs.readFileSync('licenseOptions.json'))
    const licenseData =
      worldPed.licenseStatus == 'Suspended' ||
      worldPed.licenseStatus == 'Revoked'
        ? licenseOptions[Math.floor(Math.random() * licenseOptions.length)]
        : ''
    if (licenseData) {
      licenseData[1] == 'citation'
        ? citations.push(licenseData[0])
        : arrests.push(licenseData[1])
    }
    const probation =
      !arrests.length ||
      Math.floor(Math.random() * (1 / config.probationChance)) != 0
        ? 'No'
        : 'Yes'
    const parole =
      probation == 'Yes' ||
      !arrests.length ||
      Math.floor(Math.random() * (1 / config.paroleChance)) != 0
        ? 'No'
        : 'Yes'
    const ped = {
      ...worldPed,
      warrantText:
        worldPed.isWanted == 'True' ? getCleanRandomArrest(allCharges) : '',
      arrests: arrests,
      citations: citations,
      probation: probation,
      parole: parole,
      licenseData: licenseData[0],
    }
    pedData.push(ped)
  }

  if (!worldPedDataRaw) {
    pedData = []
  }

  fs.writeFileSync('data/peds.json', JSON.stringify(pedData))
  return pedData
}

function generateCars() {
  const worldCarDataRaw = fs.readFileSync('data/worldCars.data', 'utf-8')
  const worldCarDataArr = worldCarDataRaw.split(',')
  const worldCarData = []

  worldCarDataArr.forEach((car) => {
    let params = new URLSearchParams(car)
    worldCarData.push(paramsToObject(params.entries()))
  })

  let carData = new Array()
  try {
    carData = JSON.parse(fs.readFileSync('data/cars.json'))
  } catch {
    fs.writeFileSync('data/cars.json', '[]')
  }

  let carPlateArr = new Array()
  for (car of carData) {
    carPlateArr.push(car.licensePlate)
  }

  for (const worldCar of worldCarData) {
    if (carPlateArr.includes(worldCar.licensePlate) || !getRandomPed()) {
      continue
    }
    //? used to be a feature; removed because of StopThePed implementation
    const plateStatus = 'Valid'
    const registration =
      worldCar.isPolice == 'False'
        ? Math.floor(Math.random() * 5) == 0
          ? Math.floor(Math.random() * 5) == 0
            ? 'None'
            : 'Expired'
          : 'Valid'
        : 'Valid'
    const insurance =
      worldCar.isPolice == 'False'
        ? Math.floor(Math.random() * 5) == 0
          ? Math.floor(Math.random() * 3) == 0
            ? 'None'
            : 'Expired'
          : 'Valid'
        : 'Valid'
    const car = {
      licensePlate: worldCar.licensePlate,
      model: worldCar.model,
      isStolen: worldCar.isStolen,
      isPolice: worldCar.isPolice,
      driver: worldCar.driver,
      owner: !config.useLSPDFROwner
        ? worldCar.isPolice == 'True'
          ? worldCar.model.toLowerCase().startsWith('police')
            ? 'Los Santos Police Department'
            : 'State Of San Andreas'
          : Math.floor(Math.random() * 10) != 0 && worldCar.driver
          ? worldCar.driver
          : getRandomPed().name
        : worldCar.owner,

      registration:
        worldCar.registration && config.useStopThePed
          ? worldCar.registration
          : registration,
      insurance:
        worldCar.insurance && config.useStopThePed
          ? worldCar.insurance
          : insurance,
      stolen: worldCar.isStolen == 'True' ? 'Yes' : 'No',
      plateStatus: plateStatus,
      color: worldCar.color,
    }
    carData.push(car)
  }
  if (!worldCarDataRaw) {
    carData = []
  }
  fs.writeFileSync('data/cars.json', JSON.stringify(carData))
  return carData
}

function paramsToObject(entries) {
  const result = {}
  for (const [key, value] of entries) {
    result[key] = value
  }
  return result
}

function getAllArrestOptions() {
  const file = JSON.parse(fs.readFileSync('arrestOptions.json'))
  const allCharges = new Array()
  for (chargesGroup of file) {
    for (charge of chargesGroup.charges) {
      allCharges.push(charge)
    }
  }
  return allCharges
}

function getAllCitationOptions() {
  const file = JSON.parse(fs.readFileSync('citationOptions.json'))
  const allCharges = new Array()
  for (chargesGroup of file) {
    for (charge of chargesGroup.charges) {
      allCharges.push(charge)
    }
  }
  return allCharges
}

function getRandomCitations(allCitations) {
  let i = Math.floor(Math.random() * (1 / config.citationChance))
  const citations = []
  while (i == 0) {
    citations.push(getCleanRandomCitation(allCitations))
    i = Math.floor(Math.random() * (1 / config.additionalCitationChance))
  }
  return citations
}

function getRandomArrests(allCharges, isWanted) {
  const wasArrested = isWanted
    ? Math.floor(Math.random() * (1 / config.arrestedWithWarrantChance)) == 0
    : Math.floor(Math.random() * (1 / config.arrestedWithoutWarrantChance)) == 0
  let i = 0
  const arrests = []
  while (wasArrested && i == 0) {
    arrests.push(getCleanRandomArrest(allCharges))
    i = Math.floor(Math.random() * (1 / config.additionalArrestChance))
  }
  return arrests
}

function clearGeneratedData() {
  fs.writeFileSync('data/cars.json', '[]')
  fs.writeFileSync('data/currentID.data', '')
  const peds = JSON.parse(fs.readFileSync('data/peds.json'))
  const court = JSON.parse(fs.readFileSync('data/court.json'))
  const newPeds = []
  for (let i in peds) {
    for (const courtCase of court) {
      if (peds[i].name == courtCase.ped) {
        newPeds.push(peds[i])
        break
      }
    }
  }
  fs.writeFileSync('data/peds.json', JSON.stringify(newPeds))
}

function getRandomPed() {
  const peds = JSON.parse(fs.readFileSync('data/peds.json'))
  return peds[Math.floor(Math.random() * peds.length)]
}

function generateDirectory() {
  const defaultsDir = fs.readdirSync('defaults')
  for (const item of defaultsDir) {
    try {
      fs.readFileSync(item)
    } catch {
      fs.writeFileSync(item, fs.readFileSync(`defaults/${item}`))
    }
  }
  const defaultConfig = JSON.parse(fs.readFileSync('defaults/config.json'))
  const newConfig = JSON.parse(fs.readFileSync('config.json'))

  for (const el of Object.keys(defaultConfig)) {
    if (!Object.keys(newConfig).includes(el)) {
      newConfig[el] = defaultConfig[el]
    }
  }
  fs.writeFileSync('config.json', JSON.stringify(newConfig, null, 2))

  const defaultLanguage = JSON.parse(fs.readFileSync('defaults/language.json'))
  const defaultLanguageKeys = []
  const newLanguage = JSON.parse(fs.readFileSync('language.json'))
  const newLanguageKeys = []
  visitDescendants(defaultLanguage, function (key, value) {
    defaultLanguageKeys.push(key)
  })
  visitDescendants(newLanguage, function (key, value) {
    newLanguageKeys.push(key)
  })
  for (const defaultLanguageKey of defaultLanguageKeys) {
    if (!newLanguageKeys.includes(defaultLanguageKey)) {
      createLog('Error in language.json; Falling back to default')
      fallbackToDefaultLanguage = true
      break
    }
  }

  try {
    fs.readdirSync('data')
  } catch {
    fs.mkdirSync('data')
  }

  dataDefaults.forEach(function (value, key) {
    try {
      fs.readFileSync(`data/${key}`)
    } catch {
      fs.writeFileSync(`data/${key}`, value)
    }
  })

  const imgDefaultsDir = fs.readdirSync('imgDefaults')
  try {
    fs.readdirSync('img')
  } catch {
    fs.mkdirSync('img')
  }
  for (const img of imgDefaultsDir) {
    try {
      fs.readFileSync(`img/${img}`)
    } catch {
      fs.writeFileSync(`img/${img}`, fs.readFileSync(`imgDefaults/${img}`))
    }
  }
}

function getCleanRandomArrest(allCharges) {
  // test regex: https://regex101.com/r/d6yqZV/1
  const regex = /\s\([0-9][snrt][tdh]\sOffen[sc]e\)/
  const arrest = allCharges[Math.floor(Math.random() * allCharges.length)].name
  return arrest.replace(regex, '')
}

function getCleanRandomCitation(allCitations) {
  const regex = /\s\([0-9][snrt][tdh]\sOffen[sc]e\)/
  const citation =
    allCitations[Math.floor(Math.random() * allCitations.length)].name
  return citation.replace(regex, '')
}

// https://stackoverflow.com/a/66282012
function visitDescendants(obj, cb) {
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object') {
      visitDescendants(value, cb)
    } else {
      cb(key, value)
    }
  }
}
