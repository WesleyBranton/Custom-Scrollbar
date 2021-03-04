# Custom Scrollbars [<img align="right" src=".github/fxaddon.png">](https://addons.mozilla.org/firefox/addon/custom-scrollbars/)
Give your Firefox browser a personalized touch with custom scrollbar colours! You can select from any range of colours and toggle between the default width and thin scrollbar... or hide it altogether if that's what floats your boat.

NOTE: Due to technical limitations, this add-on can not adjust the scrollbars for Mozilla-owned pages, internal Firefox pages or pages associated with other browser extensions. Sorry.

## Release Notes
Release notes can be found on [this GitHub repository](https://github.com/WesleyBranton/Custom-Scrollbar/releases).

## Development
This repository contains all of the required source code files to make changes to this extension. The "master" branch contains the source code for the latest stable release. If you want to test that version, you can view the release section to download the XPI file or visit the add-on listing on Mozilla.

If you want to make changes to this extension, you are welcome to do so. All files for the extension are located in the "src" folder. The source code of upcoming versions (if any) will be located in another branch.

Because there are some differences between the add-on for Firefox vs the add-on for Chromium-based browsers, you will first need to run our build script. To do so, either run the `build.bat` file (on Windows) or `build.sh` file (on Linux). This will create copies of the necessary files under the "build" folder. The folder will continue two sub-folders: One for Firefox and another for Chromium. You will then be able to debug the extension on your browser by pointing the browser to that folder.

It's important to note that the contents of the "build" folder are not saved to the GitHub repository when you make a commit or pull request to the source code. Therefore, any code changes should be made to the files in the "src" folder and then you should run the build script to update the files you are testing in the browser.

The majority of the files in the source code are compatible with all supported browsers. However, there are some files that are exclusive to either the Firefox version or Chromium-based version of the add-on. These files are listed below:

| Firefox Only | Chromium Only |
| --- | --- |
| `manifest-firefox.json` | `manifest-chromium.json` |
| | `content.js` |

Other files may contain sections of code that are only used by a certain browser. These sections of code will still be included in the source code for other browsers, but should be appropriately labelled with a comment (were possible) to indicate that it's only used by a specific browser.
