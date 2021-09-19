/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Load i18n data
 */
 function parsei18n() {
    const elements = document.querySelectorAll('[data-i18n]');
    for (let e of elements) {
        e.textContent = browser.i18n.getMessage(e.dataset.i18n);
    }
}

/**
 * Shows settings details of the selected profile
 * @param {Object} profile
 */
function displayDetails(profile) {
    const widthOutput = document.getElementById('detail-width');
    const buttonsOutput = document.getElementById('detail-buttons');
    const thumbRadiusOutput = document.getElementById('detail-thumbRadius');
    const colorThumbOutput = document.getElementById('detail-color-thumb');
    const colorTrackOutput = document.getElementById('detail-color-track');
    const overrideOutput = document.getElementById('detail-override');

    // Fill width information
    switch(profile.width) {
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

    // Fill color information
    if (profile.colorThumb && profile.colorTrack) {
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
    switch(profile.allowOverride) {
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
}

/**
 * Update the default profile
 */
function setAsDefault() {
    browser.storage.local.set({defaultProfile: document.manager.profile.value}, () => {
        browser.storage.local.get(loadStorage);
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
 * Load profile from Storage API
 * @param {number} id
 */
function loadProfile(id) {
    browser.storage.local.get(`profile_${id}`, (data) => {
        const profile = loadWithDefaults(data[Object.keys(data)[0]]);
        displayDetails(profile);
    });
}

/**
 * Toggle "Set as default" button
 */
function refreshSetAsDefaultButton() {
    document.getElementById('button-setDefault').disabled = defaultProfile == document.manager.profile.value || document.manager.profile.value == 'default';
    if (document.getElementById('button-use')) document.getElementById('button-use').disabled = !ruleInherit && currentRule == document.manager.profile.value;
}

/**
 * Load default profile information from Storage API
 * @param {Object} data
 */
function loadStorage(data) {
    document.manager.profile.value = data.defaultProfile;
    defaultProfile = data.defaultProfile;
    loadProfileList(data);

    if (!data.rules) {
        data.rules = {};
    }

    browser.tabs.query({
        active: true,
        currentWindow: true
    }, (tabs) => {
        if (typeof tabs[0].url == 'undefined') {
            setToGeneralMode();
            loadProfile(defaultProfile);

            // Check if a content script is running on this tab
            // If there is, then show the tab permission warning
            if (runningOn == browsers.FIREFOX) {
                browser.runtime.sendMessage({
                    action: "isTabRunningContentScript",
                    tabId: tabs[0].id
                }, (response) => {
                    if (response) {
                        document.getElementById('grantPermissionError').classList.remove('hide');
                    }
                });
            }
        } else {
            setUpTabForURL(new URL(tabs[0].url), data.rules);
        }

        refreshSetAsDefaultButton();
    });
}

/**
 * Preload data for the specific URL
 * @param {URL} url
 * @param {Object} rules
 */
function setUpTabForURL(url, rules) {
    if (url.protocol == 'file:') {
        setUpTabForLocalFile();
        return;
    }

    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/;
    if (!domainRegex.test(url.hostname)) {
        setToGeneralMode();
        return;
    }

    ruleForDomain = url.hostname;
    const domainParts = url.hostname.split('.');
    let startAt = 0;
    let usingRule = null;
    let selectedDomain = '';

    while (startAt < domainParts.length - 1) {
        selectedDomain = '';

        for (let i = startAt; i < domainParts.length; i++) {
            selectedDomain += '.' + domainParts[i];
        }

        if (startAt == 0) {
            selectedDomain = selectedDomain.substring(1);
        } else {
            selectedDomain = '*' + selectedDomain;
        }

        if (rules[selectedDomain]) {
            usingRule = rules[selectedDomain];
            break;
        }

        startAt++;
    }

    if (usingRule != null && usingRule != 'default') {
        usingRule = usingRule.split('_')[1];
        document.manager.profile.value = usingRule;

        if (!document.manager.profile.options[document.manager.profile.selectedIndex]) {
            console.error('Settings profile "%s" cannot be loaded from storage for rule "%s". Using default profile.', `profile_${usingRule}`, selectedDomain);
            usingRule = 'default';
            currentRule = defaultProfile;
            document.manager.profile.value = usingRule;
        } else {
            toggleInheritance(selectedDomain);
            currentRule = usingRule;
        }

        loadProfile(currentRule);
    } else {
        toggleInheritance('none');
        currentRule = 'default';
        loadProfile(defaultProfile);
    }
}

/**
 * Preload data for local file setting
 */
function setUpTabForLocalFile() {
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
        toggleInheritance('none');
        refreshSetAsDefaultButton();
    });
}

/**
 * Toggle rule inheritance information
 * @param {String} domain
 */
function toggleInheritance(domain) {
    const selector = document.getElementById('profile-selector-container');
    const bar = document.getElementById('profile-inherit');

    if (domain.charAt(0) == '*') {
        ruleInherit = true;
        bar.textContent = browser.i18n.getMessage('ruleInherit', domain);
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
 * Save rule to Storage API
 */
function updateRule() {
    if (isLocalFile) {
        const profile = parseInt(document.manager.profile.value);
        const data = { localFileProfile: (!isNaN(profile)) ? profile : null };
        browser.storage.local.set(data, () => {
            browser.storage.local.get(loadStorage);
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
                browser.storage.local.get(loadStorage);
            });
        });
    }
}

/**
 * Disable website-specific edits
 */
function setToGeneralMode() {
    const useButton = document.getElementById('button-use');
    useButton.parentNode.removeChild(useButton);
    document.manager.profile.removeChild(document.manager.profile.firstChild);
    document.manager.profile.value = defaultProfile;
    loadProfile(defaultProfile);
}

/**
 * Load list of profiles from Storage API
 */
function loadProfileList(data) {
    document.manager.profile.textContent = '';

    for (let key of Object.keys(data)) {
        if (key.split('_')[0]  == 'profile') {
            const option = document.createElement('option');
            option.textContent = data[key].name;
            option.value = key.split('_')[1];
            document.manager.profile.appendChild(option);
        }
    }

    let options = document.manager.profile.options;
    let sortedOptions = [];

    for (let o of options) {
        sortedOptions.push(o);
    }

    sortedOptions = sortedOptions.sort((a, b) => {
        return a.textContent.toUpperCase().localeCompare(b.textContent.toUpperCase());
    })

    for (let i = 0; i <= options.length; i++) {
        options[i] = sortedOptions[i];
    }

    const option = document.createElement('option');
    option.textContent = browser.i18n.getMessage('profileUsingDefault', data[`profile_${defaultProfile}`].name);
    option.value = 'default';
    document.manager.profile.insertBefore(option, document.manager.profile.firstChild);

    document.manager.profile.value = 'default';
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
browser.storage.local.get(loadStorage);
document.manager.profile.addEventListener('change', changeSelectedProfile);
document.getElementById('button-setDefault').addEventListener('click', setAsDefault);
document.getElementById('button-options').addEventListener('click', () => { browser.runtime.openOptionsPage(); });
document.getElementById('button-use').addEventListener('click', updateRule);
document.getElementById('grantPermission').addEventListener('click', askForTabsPermission);

function askForTabsPermission() {
    browser.permissions.request({ permissions: ['tabs'] }, (granted) => {
        if (granted) {
            console.warn('User has not granted "tabs" permission.');
            document.getElementById('grantPermissionError').classList.add('hide');
            browser.storage.local.get(loadStorage);
        }
    });
}