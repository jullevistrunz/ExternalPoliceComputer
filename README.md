# [ExternalPoliceComputer 2.0.1.0](https://www.lcpdfr.com/downloads/gta5mods/scripts/45400-externalpolicecomputer/)

A Police Computer Plugin for LSPDFR.

## Installation

- Move all files and folders from the ZIP file into your GTA main directory

## Setup

- When going on duty using LSPDFR, ExternalPoliceComputer will display notifications in-game containing the addresses, used to access EPC
- If you missed them, ExternalPoliceComputer also generates a file including the addresses: `EPC/ipAddresses.txt`
- You can access EPC using any browser of your choice (however I recommend a Chromium based browser, e.g. Chrome, Brave, etc.) by entering one of the addresses (if one doesn't work, try the other)

### Setup using Steam overlay

- In Steam go to Steam <a>&rarr;</a> Settings <a>&rarr;</a> In Game
- Make sure _Enable the Steam Overlay while in-game_ is enabled
- Set _Overlay shortcut key(s)_ to whatever key you want to use to open ExternalPoliceComputer
- Set _Web browser home page_ to `http://127.0.0.1:8080` (or the url provided by EPC)

## UI Usage

### Desktop

- In the center of the taskbar you'll find an EPC icon, clicking it will open the _Control Panel_
- Here you can enter information about yourself (Officer Information) and start or end your shift
- You can also open the [customization page](#customization) from here

### Reports

- All reports include a section for general, officer and location information which will be auto filled, but can be changed
- The report ID can not be changed
- The status can be used in the reports list to filter; When a report has a status of canceled it is considered delete, however you are still able to access the report
- Reports created while on duty (shift menu on control panel), will be added to the current shift
- There also is a notes section that can be used to describe the incident or to give more information on what happened

#### Incident reports

- Incident reports can be used for all kind of reporting that don't fit in any of the other categories (there will be more later :))
- You can, but don't have to, enter the names of offenders and witnesses or victims

#### Citation and arrest reports

- The given charges will be added to the offender, if the offender exists, when creating the report
- If you're using PolicingRedefined you can give citations to the offender using the ped menu

### Ped Lookup

- Entering and searching for a person's name will show various information about that person
- Clicking on the citation/arrest area in the history section, you can open a new report for that ped

### Vehicle Lookup

- Entering and searching for a vehicle's license plate or VIN will show various information about that vehicle
- Clicking on the owner area in the basic information area will open the ped search for the vehicle's registered owner

### Shift History

- Here you can find all your prior shifts
- Reports created during a shift are linked

## Customization

On the customization page you can activate plugins and change your config.

## Plugins

Plugins allow you to expand EPC's functionality by injecting JavaScript and CSS.

### Using a plugin

Place the plugin folder inside `EPC/plugins`. The plugin can be activated on the customization page.

### Creating a plugin

#### Plugin folder structure

```
Plugin Name
    │   info.json
    │
    ├───pages
    │       page.html
    │
    ├───scripts
    │       script 1.js
    │       script 2.js
    │
    └───styles
            style 1.css
            style 2.css
```

You can add multiple pages, scripts and styles.

HTML files in pages are served at `/plugin/<pluginId>/page/<fileName>`.
JS files in scripts are served at `/plugin/<pluginId>/script/<fileName>`.
CSS files in styles are served at `/plugin/<pluginId>/style/<fileName>`.
In JavaScript you can get the pluginId like this: `const pluginId = document.currentScript.dataset.pluginId`.
Scripts and styles are loaded onto the index page when activated using the customization page.

#### info.json example

```json
{
  "name": "Plugin Name",
  "description": "An EPC plugin",
  "author": "Palü",
  "version": "2.0.1" // EPC version the plugin was developed for
}
```

#### Plugin API

If you're making a plugin for EPC, that includes JavaScript, you can use some functions provided in `EPC/main/scripts/pluginAPI.js`. To get IntelliSense in VSCode, simply open the file in another tab. All functions are children of `API`.

#### Example plugin to create a new page

```js
const pageSVG =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 1 1" xml:space="preserve"><!-- some valid svg stuff --></svg>'

API.createNewPage('test', 'Test Page', pageSVG, initTestPage) // requires test.html in pages folder

function initTestPage(contentWindow) {
  contentWindow.document.body.innerHTML = 'Test page loaded'
}
```

## Discord Server

If you need support, have a suggestion or bug report, want to see what's coming in new versions, or want to download plugins made by me (or others), you can join https://discord.gg/RW9uy3spVb

## License

ExternalPoliceComputer is licensed under the [Eclipse Public License - v 2.0](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/LICENSE)

The following files / folders are excluded and licensed under the [MIT License](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/MIT%20LICENSE): `EPC/arrestOptions.json`, `EPC/citationOptions.json`, `EPC/language.json`, `EPC/config.json`
