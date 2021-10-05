/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Load i18n data
 */
 function parsei18n() {
    document.title = browser.i18n.getMessage('optionsTitle', browser.i18n.getMessage('extensionName'));

    i18nParse();

    // Set tooltip for width help button
    const customWidthHelp = document.getElementById('customWidthHelp');
    if (customWidthHelp) customWidthHelp.title = browser.i18n.getMessage('linkHelp');

    // Set tooltip for what's new button
    const whatsNewButton = document.getElementById('whatsnew');
    whatsNewButton.title = browser.i18n.getMessage('whatsnew');
    whatsNewButton.getElementsByTagName('img')[0].alt = browser.i18n.getMessage('whatsnew');

    updatePrivateBrowsingName();
}

/**
 * Update the Private Browsing name label
 */
 function updatePrivateBrowsingName() {
    const label = document.getElementById('private-notice-message');
    let i18nKey;

    switch (runningOn) {
        case browsers.FIREFOX:
            i18nKey = 'privateBrowsingFirefox';
            break;
        case browsers.CHROME:
            i18nKey = 'privateBrowsingChrome';
            break;
        case browsers.EDGE:
            i18nKey = 'privateBrowsingEdge';
            break;
        case browsers.OPERA:
            i18nKey = 'privateBrowsingOpera';
            break;
        default:
            return;
    }

    label.textContent = browser.i18n.getMessage('promptPrivateBrowsing', browser.i18n.getMessage(i18nKey));
}

/**
 * Display Private Browsing access warning message, if required
 */
 function togglePrivateNotice(isAllowPrivateBrowsing) {
    if (!isAllowPrivateBrowsing) {
        document.getElementById('private-notice').classList.remove('hide');
    }
}

/**
 * Change the unsaved changes warning banner
 * @param {boolean} show
 */
 function toggleChangesWarning(show) {
    document.getElementById('saveWarning').className = (show) ? 'unsaved' : 'saved';
    document.getElementById('saveChanges').disabled = !show;
    pendingChanges = show;

    updatePreview();
}

/**
 * Updates the live preview textarea style
 */
function updatePreview() {
    document.getElementById('preview-css').textContent = getNewCSS();
}

/**
 * Change the main settings tabs
 * @param {Event} event
 */
function changeTab(event) {
    if (!event.target.id.includes('tabselect')) {
        return;
    }

    const selected = event.target.id.split('-')[1];
    window.location.replace(selected + '.html');
}

/**
 * Reload the list of profiles from the Storage API
 * @param {HTMLSelectElement} dropdown
 * @param {Function} callback
 */
 function reloadProfileSelection(dropdown, callback) {
    browser.storage.local.get((data) => {
        let sortedOptions = [];
        dropdown.textContent = '';

        for (const key of Object.keys(data)) {
            if (key.split('_')[0] == 'profile') {
                const option = document.createElement('option');
                option.textContent = data[key].name;
                option.value = key.split('_')[1];
                sortedOptions.push(option);
            }
        }

        sortedOptions = sortedOptions.sort((a, b) => {
            return a.textContent.toUpperCase().localeCompare(b.textContent.toUpperCase());
        });

        for (const option of sortedOptions) {
            dropdown.appendChild(option);
        }

        if (callback) callback();
    });
}

function addDefaultProfileOption(dropdown) {
    const option = document.createElement('option');
    let profilename = '';

    for (const o of dropdown.options) {
        if (o.value == defaultProfile) {
            profilename = o.textContent;
            break;
        }
    }

    option.textContent = browser.i18n.getMessage('profileUsingDefault', profilename);
    option.value = 'default';
    dropdown.insertBefore(option, dropdown.firstChild);
    dropdown.value = 'default';
}

/**
 * Use CSS for default scrollbars on page
 */
function getDefaultScrollbar() {
    browser.storage.local.get('defaultProfile', (data) => {
        browser.storage.local.get(`profile_${data.defaultProfile}`, (profile) => {
            profile = Object.values(profile)[0];
            profile = loadWithDefaults(profile);

            document.getElementById('preview-css').textContent = generateCSS(
                profile.width,
                profile.colorTrack,
                profile.colorThumb,
                profile.allowOverride,
                profile.customWidthValue + profile.customWidthUnit,
                profile.buttons,
                profile.thumbRadius
            );
        });
    });
}

/**
 * Toggle collapsible panel
 * @param {Event} event
 */
function toggleCollapsiblePanel(event) {
    let button = event.target;
    while (!button.classList.contains('collapse-header')) {
        button = button.parentNode;
    }

    const panel = document.getElementById(button.dataset.collapseId);

    if (button.dataset.collapsibleState == 'open') {
        panel.style.maxHeight = null;
        button.dataset.collapsibleState = 'close';
    } else {
        panel.style.maxHeight = panel.scrollHeight + 'px';
        button.dataset.collapsibleState = 'open';
    }
}

/**
 * Show the what's new button (if required)
 */
function showWhatsNew() {
    const whatsNewButton = document.getElementById('whatsnew');
    const whatsNewLinkBubble = document.getElementById('whatsnewlinkbubble');

    browser.storage.local.get("showWhatsNew", (data) => {
        if (data.showWhatsNew) {
            whatsNewButton.classList.remove('hide');
            whatsNewLinkBubble.classList.remove('hide');
        } else {
            whatsNewButton.classList.add('hide');
            whatsNewLinkBubble.classList.add('hide');
        }
    });
}

/**
 * Open the what's new information
 */
function openWhatsNew() {
    browser.storage.local.remove("showWhatsNew", () => {
        const version = browser.runtime.getManifest().version.replaceAll(".", "_");

        browser.tabs.create({
            url: `${webBase}/whatsnew/v${version}?locale=${browser.i18n.getUILanguage()}&browser=${getBrowserName().toLowerCase()}`
        });

        showWhatsNew();
    });
}

/**
 * Allow/Disable keyboard navigation for all children of an element
 */
 function setKeyboardNavigation(parent, allow) {
    if (allow) {
        const elements = parent.querySelectorAll('[data-restore-tabindex]');

        for (const element of elements) {
            element.removeAttribute('data-restore-tabindex');
            element.removeAttribute('tabindex');
    
            if (element.hasAttribute('data-restore-tabindex-value')) {
                element.tabIndex = element.getAttribute('data-restore-tabindex-value');
                element.removeAttribute('data-restore-tabindex-value');
            }
        }
    } else {
        const elements = parent.querySelectorAll('a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])');

        for (const element of elements) {
            element.setAttribute('data-restore-tabindex', true);
    
            if (element.hasAttribute('tabindex')) {
                element.setAttribute('data-restore-tabindex-value', element.tabIndex);
            }
    
            element.tabIndex = -1;
        }
    }
    
}

// Add browser tag to body class
if (runningOn == browsers.FIREFOX) {
    document.body.classList.add('firefox');
} else {
    document.body.classList.add('chromium');
}

let pendingChanges = false;
browser.extension.isAllowedIncognitoAccess(togglePrivateNotice);
document.getElementById('tab-bar').addEventListener('click', changeTab);
document.getElementById('whatsnew').addEventListener('click', openWhatsNew);
document.getElementById('whatsnewlink').addEventListener('click', openWhatsNew);
parsei18n();
showWhatsNew();

const collapsiblePanelButtons = document.getElementsByClassName('collapse-header');
for (const btn of collapsiblePanelButtons) {
    btn.addEventListener('click', toggleCollapsiblePanel);
}

window.onbeforeunload = (event) => {
    // Prevent user from leaving if they have unsaved changes
    if (pendingChanges) {
        event.preventDefault();
        event.returnValue = '';
    }
};
