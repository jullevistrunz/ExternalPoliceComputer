# [ExternalPoliceComputer 2.0.0.6](https://www.lcpdfr.com/downloads/gta5mods/scripts/45400-externalpolicecomputer/)

A Police Computer Plugin for LSPDFR.

## Installation

- Move all files and folders from the ZIP file into your GTA main directory

## Setup

- When going on duty using LSPDFR, the ExternalPoliceComputer will display notifications in-game containing the addresses used to access EPC
- If you missed them, ExternalPoliceComputer also generates a file including the addresses: `EPC/ipAddresses.txt`
- You can access EPC using any browser of your choice (however, I recommend a Chromium-based browser, e.g., Chrome, Brave, etc.) by entering one of the addresses (if one doesn't work, try the other)

### Setup using Steam overlay

- In Steam go to Steam <a>&rarr;</a> Settings <a>&rarr;</a> In Game
- Make sure _Enable the Steam Overlay while in-game_ is enabled
- Set _Overlay shortcut key(s)_ to whatever key you want to use to open ExternalPoliceComputer
- Set _Web browser home page_ to `http://127.0.0.1:8080` (or the url provided by EPC)

## UI Usage

### Desktop

- In the center of the taskbar, you'll find an EPC icon. Clicking it will open the _Control Panel_
- Here you can enter information about yourself (Officer Information) and start or end your shift

### Reports

- All reports include a section for general, officer, and location information, which will be auto-filled, but can be changed
- The report ID can not be changed
- The status can be used in the reports list to filter. When a report has a status of canceled, it is considered deleted; however, you are still able to access the report
- Reports created while on duty (shift menu on control panel) will be added to the current shift
- There is also a notes section that can be used to describe the incident or to give more information on what happened

#### Incident reports

- Incident reports can be used for all kinds of reporting that don't fit in any of the other categories (there will be more later :))
- You can, but don't have to, enter the names of offenders and witnesses, or victims

#### Citation and arrest reports

- The given charges will be added to the offender, if the offender exists, when creating the report
- If you're using PolicingRedefined, you can give citations to the offender using the ped menu

### Ped Lookup

- Entering and searching for a person's name will show various information about that person
- Clicking on the citation/arrest area in the history section, you can open a new report for that ped

### Vehicle Lookup

- Entering and searching for a vehicle's license plate or VIN will show various information about that vehicle
- Clicking on the owner area in the basic information area will open the ped search for the vehicle's registered owner

### Shift History

- Here you can find all your prior shifts
- Reports created during a shift are linked

## Discord Server

If you need support, have a suggestion or bug report, want to see what's coming in new versions, or would like to download plugins created by me (or others), you can join https://discord.gg/RW9uy3spVb.

## License

ExternalPoliceComputer is licensed under the [Eclipse Public License - v 2.0](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/LICENSE)

The following files/folders are excluded and licensed under the [MIT License](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/MIT%20LICENSE): `EPC/arrestOptions.json`, `EPC/citationOptions.json`, `EPC/language.json`, `EPC/config.json`
