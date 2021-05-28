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
        defaultProfile = document.manager.profile.value;
        refreshSetAsDefaultButton();
    });
}

/**
 * Handle profile selection drop-down menu change
 */
function changeSelectedProfile() {
    loadProfile(document.manager.profile.value);
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
    document.getElementById('button-setDefault').disabled = defaultProfile == document.manager.profile.value;
}

/**
 * Load default profile information from Storage API
 * @param {Object} data
 */
function loadStorage(data) {
    document.manager.profile.value = data.defaultProfile;
    defaultProfile = data.defaultProfile;
    loadProfileList();
    loadProfile(defaultProfile);
}

/**
 * Load list of profiles from Storage API
 */
function loadProfileList() {
    browser.storage.local.get((data) => {
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

        document.manager.profile.value = defaultProfile;
    });
}

let defaultProfile;
parsei18n();
browser.storage.local.get('defaultProfile', loadStorage);
document.manager.profile.addEventListener('change', changeSelectedProfile);
document.getElementById('button-setDefault').addEventListener('click', setAsDefault);
document.getElementById('button-options').addEventListener('click', () => { browser.runtime.openOptionsPage(); });