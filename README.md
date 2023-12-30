# [ExternalPoliceComputer 1.3.4](https://www.lcpdfr.com/downloads/gta5mods/scripts/45400-externalpolicecomputer/)

A Police Computer Plugin and Server for LSPDFR.

## Config

- File: `EPC/config.json`
- `useStopThePed`: If set to `true` and STP is installed, EPC will use registration and insurance data generated by STP; If set to `false`, EPC will generate registration and insurance data (resulting in different results)
- `useLSPDFROwner`: If set to `true`, EPC will use the owner of a vehicle generated by LSPDFR (resulting in the owner possibly coming back as not found when searching); If set to `false`, EPC will generate the owner of a vehicle (resulting in different results)
- `wordForJail`: obsolete; use language.json instead
- `currency`: obsolete; use language.json instead
- `showCurrentID`: If set to `true`, EPC will show the ID of peds you ask, arrest or pat down; I recommend you set this to `false` on most mobile devices
- `autoShowCurrentID`: If set to `true`, IDs will pop up automatically; If set to `false`, you'll have the option to show/hide the current ID
- `warningColorsForPedCarSearch`: If set to `true`, expired registration/insurance, outstanding warrants, etc. will be displayed in a warning color
- If you create your own `custom.js` file, you may add variables here (path: `/data/config`)
- `arrestedWithWarrantChance`: The probability someone has prior arrests, if they have a warrant; value range: `0 - 1`
- `arrestedWithoutWarrantChance`: The probability someone has prior arrests, if they don't have a warrant; value range: `0 - 1`
- `additionalArrestChance`: The probability an additional prior arrest is added to someone who was defined to have prior arrests (see before); value range: `0 - 0.99`
- `citationChance`: The probability someone has prior citations; value range: `0 - 1`
- `additionalCitationChance`: The probability an additional prior citation is added to someone who was defined to have prior citations (see before); value range: `0 - 0.99`
- `probationChance`: The probability someone who has a prior arrest is on probation; value range: `0 - 1`
- `paroleChance`: The probability someone who has a prior arrest is on parole if they are not on probation; value range: `0 - 1`
- `showCustomizationLink`: If set to `true` a link to the customization page will appear
- `replaceStaticWithCustomLanguage`: If set to `true`, EPC will use `EPC/language.json` to replace all static elements; Use this if you have a custom `EPC/language.json`
- `port`: The port used by the Node.js http server
- `defaultMapZoom`: Map zoom when the page loads

## Citation and Arrest Options

- Files: `EPC/citationOptions.json` & `EPC/arrestOptions.json`
- `minFine`: Minimum fine in $ for a charge
- `maxFine`: Maximum fine in $ for a charge
- `minMonth`: Minimum jail time in months for charge (arrests only)
- `maxMonth`: Maximum jail time in months for a charge (arrests only), `null` for life in prison
- `probation`: Chance of probation 0-1 (arrests only)
- The offense part will be removed for charges including multiple offenses in warrants / prior arrests/citations; [Test it here](https://regex101.com/r/d6yqZV/1)

## License Options

- File: `EPC/licenseOptions.json`
- Reasons for suspended/revoked license

## Language

- File: `EPC/language.json`
- Set `replaceStaticWithCustomLanguage` to `true` in `EPC/config.json`
- You can edit all words used by EPC to your liking
- If the file contains any errors, EPC will fall back to default settings

## Map

- File: `EPC/img/map.jpeg`
- Preferred Dimensions: 3072 x 4608
- Source: https://forum.cfx.re/uploads/default/original/4X/c/6/7/c67d156aaba53758e345a6cf72110044048f3e3e.jpeg

## Logo

- File: `EPC/img/logo.png`
- Source: https://forum.gta.world/en/topic/52002-san-andreas-state-government/ | https://i.ibb.co/6bwcmKr/icon-2000px.png

## Custom Styles

- File: `EPC/custom.css`
- For simple customization you may change colors, etc., and size in the `:root` selector
- You can also add more css. `EPC/custom.css` will overwrite `EPC/main/styles.css`

## Custom JavaScript

- File: `EPC/custom.js`
- You can add your own JS code if you know what you're doing
- Versions made by me (or others) can be found on Discord

## Steam overlay

- In steam go to Steam<a>&rarr;</a>Settings<a>&rarr;</a>In Game
- Make sure _Enable the Steam Overlay while in-game_ is enabled
- Set _Overlay shortcut key(s)_ to whatever key you want to use to open ExternalPoliceComputer
- Set _Web browser home page_ to `http://127.0.0.1`

## Discord Server

- If you need support, have a suggestion or bug report, want to see what's coming in new versions, or want to download custom files made by me (or others)
- https://discord.gg/RW9uy3spVb

## License

- ExternalPoliceComputer is licensed under the [Eclipse Public License - v 2.0](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/LICENSE)
- The following files are excluded and licensed under the [MIT License](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/MIT%20LICENSE):
  - [`EPC/arrestOptions.json`](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/EPC/arrestOptions.json)
  - [`EPC/citationOptions.json`](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/EPC/citationOptions.json)
  - [`EPC/config.json`](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/EPC/config.json)
  - [`EPC/custom.css`](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/EPC/custom.css)
  - [`EPC/custom.js`](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/EPC/custom.js)
  - [`EPC/language.json`](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/EPC/language.json)
  - [`EPC/licenseOptions.json`](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/EPC/licenseOptions.json)
