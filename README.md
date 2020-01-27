# Custom Scrollbars [<img align="right" src=".github/fxaddon.png">](https://addons.mozilla.org/firefox/addon/custom-scrollbars/)
Give your Firefox browser a personalized touch with custom scrollbar colours! You can select from any range of colours and toggle between the default width and thin scrollbar... or hide it altogether if that's what floats your boat.

NOTE: Due to technical limitations, this add-on can not adjust the scrollbars for Mozilla-owned pages, internal Firefox pages or pages associated with other browser extensions. Sorry.

## Development
This repository contains all of the required source code files to make changes to this extension. The "master" branch contains the source code for the latest stable release. If you want to test that version, you can view the release section to download the XPI file or visit the add-on listing on Mozilla.

If you want to make changes to this extension, you are welcome to do so. All files for the extension are located in the "firefox" folder. The source code of upcoming versions (if any) will be located in another branch.

To develop and test the extension, you need to open the "about:debugging" page in Firefox and select "Load Temporary Add-on". Then you can select any file within the "firefox" folder of this repository.

Further documentation about developing Firefox extensions can be found [here](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension).

## Release Notes
### Version 1.0.1
* **[FIXED]** Fixed issue with colors not saving
