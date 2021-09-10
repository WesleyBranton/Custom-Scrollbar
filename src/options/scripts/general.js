/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Load i18n data
 */
 function parsei18n() {
    document.title = browser.i18n.getMessage('optionsTitle', browser.i18n.getMessage('extensionName'));

    const elements = document.querySelectorAll('[data-i18n]');
    for (let e of elements) {
        const placeholders = [];

        if (e.hasAttribute('data-i18n-placeholders')) {
            const num = parseInt(e.getAttribute('data-i18n-placeholders'));

            for (let i = 1; i <= num; i++) {
                placeholders.push(browser.i18n.getMessage(e.getAttribute('data-i18n-placeholder-' + i)));
            }
        }

        e.textContent = browser.i18n.getMessage(e.dataset.i18n, placeholders);
    }

    const customWidthHelp = document.getElementById('customWidthHelp');
    if (customWidthHelp) customWidthHelp.title = browser.i18n.getMessage('linkHelp');

    updatePrivateBrowsingName();
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
 * Update the Private Browsing name label
 */
 function updatePrivateBrowsingName() {
    const label = document.getElementById('private-notice-message');
    let name;

    if (runningOn == browsers.FIREFOX) name = browser.i18n.getMessage("privateBrowsingFirefox");
    else if (runningOn == browsers.CHROME) name = browser.i18n.getMessage("privateBrowsingChrome");
    else if (runningOn == browsers.EDGE) name = browser.i18n.getMessage("privateBrowsingEdge");
    else if (runningOn == browsers.OPERA) name = browser.i18n.getMessage("privateBrowsingOpera");
    else return;

    label.textContent = browser.i18n.getMessage("promptPrivateBrowsing", name);
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

// Add browser tag to body class
if (runningOn == browsers.FIREFOX) {
    document.body.classList.add('firefox');
} else {
    document.body.classList.add('chromium');
}

let pendingChanges = false;
browser.extension.isAllowedIncognitoAccess(togglePrivateNotice);
document.getElementById('tab-bar').addEventListener('click', changeTab);
parsei18n();

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