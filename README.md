# [ExternalPoliceComputer 1.4.3](https://www.lcpdfr.com/downloads/gta5mods/scripts/45400-externalpolicecomputer/)

A Police Computer Plugin and Node.js Server for LSPDFR.

## Config

- File: `EPC/config.json`
- `useStopThePed`: If set to `true` and STP is installed, EPC will use registration and insurance data generated by STP; If set to `false`, EPC will generate registration and insurance data (resulting in different results)
- `useLSPDFROwner`: If set to `true`, EPC will use the owner of a vehicle generated by LSPDFR (resulting in the owner possibly coming back as not found when searching); If set to `false`, EPC will generate the owner of a vehicle (resulting in different results)
- `wordForJail`: obsolete; use language.json instead
- `currency`: obsolete; use language.json instead
- `showCurrentID`: If set to `true`, EPC will show the ID of peds you ask, arrest, or pat down; I recommend you set this to `false` on most mobile devices
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
- `showCalloutPage`: `false` to disable the callout page; might be helpful for lower-end devices
- `autoShowCalloutPage`: If set to `true`, EPC will automatically switch to the callout page if a new callout is being displayed
- `updateCalloutPageInterval`: Interval in ms to update the callout page from the game's data
- `clearCalloutPageTime`: Time in ms to clear the callout page after the callout ended; `null` to never clear
- `automaticIncidentReports`: If set to `true`, EPC will create an incident report when a callout ends
- `disableExternalCautions`: If set to `true`, EPC will not check for ped or vehicle cautions from third party plugins
- `newWindowWidth`: Width of a new window
- `newWindowHeight`: Height of a new window
- `newWindowSamePage`: If set to `true`, new windows will open in an overlay; if set to `false`, new windows will open using your browser's window
- `newWindowOffset`: Where a new window will open; possible values: `center`, `top-left`, `top-right`, `bottom-left`, `bottom-right`
- `newWindowOffsetMarginX`: Space in pixels between the new window and the edge of the screen on the X axis; not applicable if `newWindowOffset` is set to `center`
- `newWindowOffsetMarginY`: Space in pixels between the new window and the edge of the screen on the Y axis; not applicable if `newWindowOffset` is set to `center`

## Citation and Arrest Options

- Files: `EPC/citationOptions.json` & `EPC/arrestOptions.json`
- `minFine`: Minimum fine in $ for the charge
- `maxFine`: Maximum fine in $ for the charge
- `minMonth`: Minimum jail time in months for the charge (arrests only)
- `maxMonth`: Maximum jail time in months for the charge (arrests only), `null` for life in prison
- `probation`: Chance of probation 0-1 (arrests only)

The offense part will be removed for charges including multiple offenses in warrants / prior arrests/citations; [Test it here](https://regex101.com/r/d6yqZV/1)

## License Options

- File: `EPC/licenseOptions.json`

Reasons for suspended/revoked license

## Language

- File: `EPC/language.json`

Set `replaceStaticWithCustomLanguage` to `true` in `EPC/config.json`.
You can edit all words used by EPC to your liking. `content.courtPage.resultContainer.caseNumberPrefix` has to match this [regex](https://regex101.com/r/OrD6dR/1) exactly once (lower and upper cased letters from a to z and numbers from 0 to 9 are allowed).

## Map

- File: `EPC/img/map.jpeg`
- Preferred Dimensions: 3072 x 4608
- Source: https://forum.cfx.re/uploads/default/original/4X/c/6/7/c67d156aaba53758e345a6cf72110044048f3e3e.jpeg

## Logo

- File: `EPC/img/logo.png`
- Source: https://forum.gta.world/en/topic/52002-san-andreas-state-government/ | https://i.ibb.co/6bwcmKr/icon-2000px.png

## Plugins

Plugins can be added by creating a new folder in `EPC/plugins`. The folder's name may not include spaces. The plugin will show up on the customization page as soon as the folder is filled with files. All css and js files in that folder will be loaded once the plugin is enabled. All other files can be accessed using `/plugins/pluginName/fileName`. Plugins and their files will be loaded in alphabetical order. If you want to create a plugin for EPC you can use the plugin API, which will make your life a bit easier. If your using VSCode, just open `EPC/main/pluginAPI.js` and you will get intellisense in your plugin's js files. Check out the [Discord](#discord-server) for plugins made by the community.

### Example

Creating a plugin that will add a background image

- File: [`imageTest/image.jpg`](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/9ea98cd5259614316cf8ab7ab07d20ae5bf7da5d/Custom%20Files/plugins/imageTest/image.jpg)

- File: [`imageTest/imageTest.css`](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/9ea98cd5259614316cf8ab7ab07d20ae5bf7da5d/Custom%20Files/plugins/imageTest/imageTest.css)

```css
.content {
  background-image: url('/plugins/imageTest/image.jpg');
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center;
  image-rendering: optimizeQuality;
}
```

## Custom Styles

- File: `EPC/custom.css`

> deprecated; use [plugins](#plugins) instead

## Custom JavaScript

- File: `EPC/custom.js`

> deprecated; use [plugins](#plugins) instead

## Steam overlay

- In Steam go to Steam <a>&rarr;</a> Settings <a>&rarr;</a> In Game
- Make sure _Enable the Steam Overlay while in-game_ is enabled
- Set _Overlay shortcut key(s)_ to whatever key you want to use to open ExternalPoliceComputer
- Set _Web browser home page_ to `http://127.0.0.1`

## API

### Callout messages

If you're a callout dev, you can send messages to EPC's callout page once the callout has been accepted

```c#
ExternalPoliceComputer.Functions.SendMessage("Additional Message");
```

Multiple lines are supported by using one of the two:

```c#
ExternalPoliceComputer.Functions.SendMessage("1st Line<br>2nd Line");
```

```c#
ExternalPoliceComputer.Functions.SendMessage("1st Line");
ExternalPoliceComputer.Functions.SendMessage("2nd Line");
```

Add the ExternalPoliceComputer.dll as a reference in your project. To prevent crashes, you have to check if EPC is available ([Example by opus49](https://github.com/Immersive-Plugins-Team/CalloutInterfaceAPI/blob/master/CalloutInterfaceAPI/Functions.cs#L26)).

### Caution messages

Sending caution messages, that will be displayed when looking up a ped:

```c#
ExternalPoliceComputer.Functions.AddCautionToPed("Full name", "Caution message");
```

Sending caution messages, that will be displayed when looking up a vehicle:

```c#
ExternalPoliceComputer.Functions.AddCautionToCar("License plate", "Caution message");
```

You can send multiple messages to the same ped or vehicle, by calling the method multiple times.

---

Removing caution messages from a ped:

```c#
ExternalPoliceComputer.Functions.RemoveCautionFromPed("Full name", "Caution message");
```

Removing caution messages from a vehicle:

```c#
ExternalPoliceComputer.Functions.RemoveCautionFromCar("License plate", "Caution message");
```

You can remove multiple messages to the same ped or vehicle, by calling the method multiple times. Both the name/license plate and message must **exactly** match those that were added.

## Discord Server

If you need support, have a suggestion or bug report, want to see what's coming in new versions, or want to download plugins made by me (or others), you can join https://discord.gg/RW9uy3spVb

## License

ExternalPoliceComputer is licensed under the [Eclipse Public License - v 2.0](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/LICENSE)

The following files / folders are excluded and licensed under the [MIT License](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/MIT%20LICENSE):

- [`EPC/arrestOptions.json`](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/EPC/arrestOptions.json)
- [`EPC/citationOptions.json`](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/EPC/citationOptions.json)
- [`EPC/config.json`](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/EPC/config.json)
- [`EPC/custom.css`](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/EPC/custom.css)
- [`EPC/custom.js`](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/EPC/custom.js)
- [`EPC/language.json`](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/EPC/language.json)
- [`EPC/licenseOptions.json`](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/EPC/licenseOptions.json)
- [`EPC/plugins`](https://github.com/jullevistrunz/ExternalPoliceComputer/blob/main/EPC/plugins)
