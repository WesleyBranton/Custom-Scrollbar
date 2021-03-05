# Custom Scrollbars [<img align="right" src=".github/fxaddon.png">](https://addons.mozilla.org/firefox/addon/custom-scrollbars/)
Give your browser a personalized touch with custom scrollbar colors! You can select from any range of colors and toggle between the default width and thin scrollbar... or hide it altogether if that's what floats your boat.

## Release Notes
Release notes can be found on [this GitHub repository](https://github.com/WesleyBranton/Custom-Scrollbar/releases).

## Contribute
### Development
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

### Creating an issue
Issues are the ticketing system used on GitHub. It's used to track bugs and enhancements that developers can work on. Here are the 3 main types of issues and what to keep in mind when creating a new issue.

#### Bug
A bug is something that is not working properly in the add-on. Finding and fixing bugs is a very important part of maintaining this add-on.

When create a new issue for a bug, please make sure to include as much information as possible. This should include detailed steps on how to reproduce the problem and links to relevant website(s) (if applicable). Screenshots are also helpful, if an issue is visible.

Additional information about your computer operating system and the internet browser(s) that the issue occurs on is very helpful when trying to diagnose and fix problems.

#### Enhancement / Feature Request
We are always looking for ways to improve the Custom Scrollbars add-on. We welcome feedback and suggestions on how we can improve the add-on and new features that could be introduced.

When creating an issue for an enhancement or feature request, it can often be helpful to provide some background about why you think a change is needed and how it would be helpful to other users. Please make sure to search through the other issues on this GitHub repository to make sure that the feature you are looking for hasn't already been filed by someone else.

Sometimes new features may take a long time to be added to the add-on. Sometimes they may not be added at all. Please don't take it personally if your feature request is rejected or given a low priority.

#### Documentation Change
Sometimes features of the add-on or browsers can change and the documentation on the add-on's wiki page may no longer be accurate. Sometimes the documentation may be written in a way that is confusing or incomplete.

If you notice a problem with the documentation available for this add-on, feel free to make the change. However, if you don't have the required access to make a change, you can create an issue.

When creating an issue about a change to the documentation, please make sure to provide a link to the document in question and include what any changes in the issue description.

### Spread The Word
If you are enjoying the add-on, consider sharing it with your friends. New users are found almost entirely through word of mouth, so every little big of promotion helps.

Also, consider leaving a review on the add-on store page. These reviews help others find the add-on in the store search page.

### Donate
While donations are certainly not required, they are very much appreciated. Financial support (even if it's just the cost of a cup of coffee) helps fund future development of this add-on.
