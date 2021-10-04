# Contributing

### Development
This repository contains all of the required source code files to make changes to this extension. The "master" branch contains the source code for the latest stable release. If you want to test that version, you can view the release section to download the XPI file or visit the add-on listing on Mozilla.

If you want to make changes to this extension, you are welcome to do so. All files for the extension are located in the "src" folder. The source code of upcoming versions (if any) will be located in another branch.

Because there are some differences between the add-on for Firefox vs the add-on for Chromium-based browsers, you will first need to run our build script. To do so, either run the `build.bat` file (on Windows) or `build.sh` file (on Linux). This will create copies of the necessary files under the "build" folder. The folder will continue two sub-folders: One for Firefox and another for Chromium. You will then be able to debug the extension on your browser by pointing the browser to that folder.

It's important to note that the contents of the "build" folder are not saved to the GitHub repository when you make a commit or pull request to the source code. Therefore, any code changes should be made to the files in the "src" folder and then you should run the build script to update the files you are testing in the browser.

The majority of the files in the source code are compatible with all supported browsers. However, there are some files that are exclusive to either the Firefox version or Chromium-based version of the add-on. These files are listed below:

| Firefox Only | Chromium Only |
| --- | --- |
| `manifest-firefox.json` | `manifest-chromium.json` |
| | `images/components/*` |

Other files may contain sections of code that are only used by a certain browser. These sections of code will still be included in the source code for other browsers, but should be appropriately labelled with a comment (were possible) to indicate that it's only used by a specific browser.

Feel free to work on any of the [issues listed on GitHub](https://github.com/WesleyBranton/Custom-Scrollbar/issues). To avoid working on the same issue as someone else, avoid working on issues that have already been assigned to someone. When you start working on an issue, please make sure to post a comment in the issue so that the issue can be assigned to you. If you decide to stop working on an issue, please make a comment in the issue so that you can be unassigned from the issue and someone else can start working on it.

Issues are given the following labels to indicate the issue type:

| Label | Description |
| --- | --- |
| [Bug](https://github.com/WesleyBranton/Custom-Scrollbar/issues?q=is%3Aissue+is%3Aopen+label%3Abug) | This issue descibes something that is not currently working properly in the add-on. |
| [Enhancement](https://github.com/WesleyBranton/Custom-Scrollbar/issues?q=is%3Aissue+is%3Aopen+label%3Aenhancement) | This issue is requesting a new feature or the expansion of an existing aspect of the add-on. |
| [Documentation](https://github.com/WesleyBranton/Custom-Scrollbar/issues?q=is%3Aissue+is%3Aopen+label%3Adocumentation) | This issue is requesting a change or addition to the add-on documentation. |
| [Won't Fix](https://github.com/WesleyBranton/Custom-Scrollbar/issues?q=is%3Aissue+is%3Aopen+label%3Awontfix) | This issue is not currently possible or not something that will be addressed at the moment. |
| [Invalid](https://github.com/WesleyBranton/Custom-Scrollbar/issues?q=is%3Aissue+is%3Aopen+label%3Ainvalid) | This issue describes something that is not broken or the issue is not completed properly by the person that created it. |
| [Duplicate](https://github.com/WesleyBranton/Custom-Scrollbar/issues?q=is%3Aissue+is%3Aopen+label%3Aduplicate) | This issue is a duplicate of another issue that has already been filed. The duplicate issue will be referenced in the comments. |

To help ensure that development effort is being spent efficiently, issues may also be assigned a priority label as a guideline:

| Label | Description |
| --- | --- |
| [P1](https://github.com/WesleyBranton/Custom-Scrollbar/issues?q=is%3Aissue+is%3Aopen+label%3AP1) | Critical priority |
| [P2](https://github.com/WesleyBranton/Custom-Scrollbar/issues?q=is%3Aissue+is%3Aopen+label%3AP2) | High priority |
| [P3](https://github.com/WesleyBranton/Custom-Scrollbar/issues?q=is%3Aissue+is%3Aopen+label%3AP3) | Medium priority |
| [P4](https://github.com/WesleyBranton/Custom-Scrollbar/issues?q=is%3Aissue+is%3Aopen+label%3AP4) | Low priority |