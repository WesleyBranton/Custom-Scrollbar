/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Initiliaze popup
 *   - Load Storage API data
 *   - Read information about current tab
 *   - Render popup based on tab information
 */
function init() {
    browser.storage.local.get((data) => {
        document.manager.profile.value = data.defaultProfile;
        defaultProfile = data.defaultProfile;
        loadProfileList(data);

        if (typeof data.rules != 'object') {
            data.rules = {};
        }

        browser.tabs.query({
            active: true,
            currentWindow: true
        }, (tabs) => {
            if (typeof tabs[0].url == 'undefined') {
                // Ask the tab for its URL
                browser.tabs.sendMessage(tabs[0].id, {
                    action: 'getURL'
                }, (response) => {
                    if (typeof response == 'string' && response != null) {
                        renderForUrl(new URL(response), data.rules);
                    } else {
                        renderForGeneral();
                        loadProfile(defaultProfile);
                        if (browser.runtime.lastError == 'undefined') {}
                    }
                });
            } else {
                renderForUrl(new URL(tabs[0].url), data.rules);
            }

            refreshSetAsDefaultButton();
        });
    });
}

/**
 * Preload data for the specific URL
 * @param {URL} url
 * @param {Object} rules
 */
function renderForUrl(url, rules) {
    if (url.protocol == 'file:') {
        renderForLocalFile();
        return;
    }

    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(url.hostname)) {
        renderForGeneral();
        return;
    }

    ruleForDomain = url.hostname;
    let usingRule = null;
    let selectedDomain;

    if (rules[url.hostname]) {
        usingRule = rules[url.hostname];
        selectedDomain = url.hostname;
    } else {
        const subdomains = url.hostname.split('.');
        subdomains[subdomains.length - 2] += '.' + subdomains.pop();

        do {
            subdomains[0] = '*';
            const subdomain = subdomains.join('.');

            if (rules[subdomain]) {
                usingRule = rules[subdomain];
                selectedDomain = subdomain;
                break;
            }

            subdomains.shift();
        } while (subdomains.length > 1);
    }

    if (usingRule != null && usingRule != 'default') {
        usingRule = usingRule.split('_')[1];
        document.manager.profile.value = usingRule;

        if (!document.manager.profile.options[document.manager.profile.selectedIndex]) {
            console.error('Scrollbar "%s" cannot be loaded from storage for rule "%s". Using default Scrollbar.', `profile_${usingRule}`, selectedDomain);
            usingRule = 'default';
            currentRule = defaultProfile;
            document.manager.profile.value = usingRule;
        } else {
            displayInheritanceDetails(selectedDomain);
            currentRule = usingRule;
        }

        loadProfile(currentRule);
    } else {
        displayInheritanceDetails('none');
        currentRule = 'default';
        loadProfile(defaultProfile);
    }

    refreshSetAsDefaultButton();
}

/**
 * Preload data for local file setting
 */
function renderForLocalFile() {
    browser.storage.local.get('localFileProfile', (data) => {
        if (typeof data.localFileProfile == 'number' && data.localFileProfile != null) {
            currentRule = data.localFileProfile;
            loadProfile(data.localFileProfile);
        } else {
            currentRule = 'default';
            loadProfile(defaultProfile);
        }

        isLocalFile = true;
        document.body.classList.add('local-file');
        document.manager.profile.value = currentRule;
        displayInheritanceDetails('none');
        refreshSetAsDefaultButton();
    });
}

/**
 * Disable website-specific edits
 */
function renderForGeneral() {
    const useButton = document.getElementById('button-use');
    if (useButton) {
        useButton.parentNode.removeChild(useButton);
    }

    document.manager.profile.removeChild(document.manager.profile.firstChild);
    document.manager.profile.value = defaultProfile;

    loadProfile(defaultProfile);
    refreshSetAsDefaultButton();
}

/**
 * Display rule inheritance details
 * @param {String} domain
 */
function displayInheritanceDetails(domain) {
    const selector = document.getElementById('profile-selector-container');
    const bar = document.getElementById('profile-inherit');

    if (domain.charAt(0) == '*') {
        ruleInherit = true;
        bar.textContent = browser.i18n.getMessage('ruleInherit', domain.substring(2));
        bar.parentNode.classList.remove('hide');
        selector.classList.add('has-help');
    } else {
        ruleInherit = false;
        bar.textContent = '';
        bar.parentNode.classList.add('hide');
        selector.classList.remove('has-help');
    }
}

/**
 * Load list of profiles from Storage API
 * @param {Object} data
 */
function loadProfileList(data) {
    let sortedOptions = [];
    document.manager.profile.textContent = '';

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
    })

    for (const option of sortedOptions) {
        document.manager.profile.appendChild(option);
    }

    const option = document.createElement('option');
    option.textContent = browser.i18n.getMessage('profileUsingDefault', data[`profile_${defaultProfile}`].name);
    option.value = 'default';
    document.manager.profile.insertBefore(option, document.manager.profile.firstChild);

    document.manager.profile.value = 'default';
}

/**
 * Load profile from Storage API
 * @param {number} id
 */
function loadProfile(id) {
    browser.storage.local.get(`profile_${id}`, (data) => {
        const profile = loadWithDefaults(data[Object.keys(data)[0]]);

        const widthOutput = document.getElementById('detail-width');
        const buttonsOutput = document.getElementById('detail-buttons');
        const thumbRadiusOutput = document.getElementById('detail-thumbRadius');
        const colorThumbOutput = document.getElementById('detail-color-thumb');
        const colorTrackOutput = document.getElementById('detail-color-track');
        const overrideOutput = document.getElementById('detail-override');

        // Fill width information
        switch (profile.width) {
            case 'auto':
            case 'unset':
                widthOutput.textContent = browser.i18n.getMessage('sizeWide');
                break;
            case 'thin':
                widthOutput.textContent = browser.i18n.getMessage('sizeThin');
                break;
            case 'none':
                widthOutput.textContent = browser.i18n.getMessage('sizeHidden');
                break;
            default:
                widthOutput.textContent = profile.customWidthValue + profile.customWidthUnit;
                break;
        }

        if (profile.width != 'none') {
            // Fill buttons information
            switch (profile.buttons) {
                case 'light':
                    buttonsOutput.textContent = browser.i18n.getMessage('optionLight');
                    break;
                case 'dark':
                    buttonsOutput.textContent = browser.i18n.getMessage('optionDark');
                    break;
                default:
                    buttonsOutput.textContent = browser.i18n.getMessage('overrideNone');
                    break;
            }

            // Thumb radius information
            thumbRadiusOutput.textContent = profile.thumbRadius + '%';
        } else {
            buttonsOutput.textContent = '-';
            thumbRadiusOutput.textContent = '-';
        }

        // Fill color information
        if (profile.colorThumb && profile.colorTrack && profile.width != 'none') {
            colorThumbOutput.style.background = profile.colorThumb;
            colorThumbOutput.textContent = '';
            colorThumbOutput.classList.add('color-output');

            colorTrackOutput.style.background = profile.colorTrack;
            colorTrackOutput.textContent = '';
            colorTrackOutput.classList.add('color-output');
        } else {
            colorThumbOutput.style.background = 'unset';
            colorThumbOutput.textContent = '-';
            colorThumbOutput.classList.remove('color-output');

            colorTrackOutput.style.background = 'unset';
            colorTrackOutput.textContent = '-';
            colorTrackOutput.classList.remove('color-output');
        }

        // Fill override information
        switch (profile.allowOverride) {
            case 0:
                overrideOutput.textContent = browser.i18n.getMessage('overrideNone');
                break;
            case 1:
                overrideOutput.textContent = browser.i18n.getMessage('overrideColor');
                break;
            case 10:
                overrideOutput.textContent = browser.i18n.getMessage('overrideWidth');
                break;
            case 11:
                overrideOutput.textContent = browser.i18n.getMessage('overrideAll');
                break;
        }
    });
}

/**
 * Handle profile selection drop-down menu change
 */
function changeSelectedProfile() {
    if (document.manager.profile.value == 'default') {
        loadProfile(defaultProfile);
    } else {
        loadProfile(document.manager.profile.value);
    }
    refreshSetAsDefaultButton();
}

/**
 * Toggle "Set as default" button
 */
function refreshSetAsDefaultButton() {
    document.getElementById('button-setDefault').disabled = defaultProfile == document.manager.profile.value || document.manager.profile.value == 'default';
    if (document.getElementById('button-use')) document.getElementById('button-use').disabled = !ruleInherit && currentRule == document.manager.profile.value;
}

/**
 * Update the default profile
 */
function setAsDefault() {
    browser.storage.local.set({
        defaultProfile: document.manager.profile.value
    }, () => {
        browser.storage.local.get(init);
    });
}

/**
 * Save rule to Storage API
 */
function updateRule() {
    if (isLocalFile) {
        const profile = parseInt(document.manager.profile.value);
        const data = {
            localFileProfile: (!isNaN(profile)) ? profile : null
        };
        browser.storage.local.set(data, () => {
            browser.storage.local.get(init);
        });
    } else {
        browser.storage.local.get('rules', (data) => {
            if (!data.rules) {
                data.rules = {};
            }

            if (document.manager.profile.value == 'default') {
                if (ruleInherit) {
                    data.rules[ruleForDomain] = 'default';
                } else {
                    delete data.rules[ruleForDomain];
                }
            } else {
                data.rules[ruleForDomain] = `profile_${document.manager.profile.value}`;
            }

            browser.storage.local.set(data, () => {
                browser.storage.local.get(init);
            });
        });
    }
}

/**
 * Show the what's new button (if required)
 */
function showWhatsNew() {
    const whatsNewButton = document.getElementById('whatsnew');

    browser.storage.local.get("showWhatsNew", (data) => {
        if (data.showWhatsNew) {
            whatsNewButton.classList.remove('hide');
        } else {
            whatsNewButton.classList.add('hide');
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
 * Load i18n data
 */
function parsei18n() {
    i18nParse();

    const whatsNewButton = document.getElementById('whatsnew');
    whatsNewButton.title = browser.i18n.getMessage('whatsnew');
    whatsNewButton.getElementsByTagName('img')[0].alt = browser.i18n.getMessage('whatsnew');

    const feedbackButton = document.getElementById('button-feedback');
    feedbackButton.title = browser.i18n.getMessage('linkFeedback');
    feedbackButton.getElementsByTagName('img')[0].alt = browser.i18n.getMessage('linkFeedback');
}

// Add browser tag to body class
if (runningOn == browsers.FIREFOX) {
    document.body.classList.add('firefox');
} else {
    document.body.classList.add('chromium');
}

let defaultProfile, ruleForDomain, currentRule, ruleInherit;
let isLocalFile = false;

parsei18n();
showWhatsNew();
init();

document.getElementById('whatsnew').addEventListener('click', openWhatsNew);
document.manager.profile.addEventListener('change', changeSelectedProfile);
document.getElementById('button-setDefault').addEventListener('click', setAsDefault);
document.getElementById('button-options').addEventListener('click', () => {
    browser.runtime.openOptionsPage();
});
document.getElementById('button-feedback').addEventListener('click', () => {
    browser.runtime.sendMessage({
        action: 'openFeedback'
    });
});
document.getElementById('button-use').addEventListener('click', updateRule);
