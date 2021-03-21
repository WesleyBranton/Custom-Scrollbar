/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Load settings from Storage API
 * @param {Object} setting - The Storage API object
 */
function restore(setting) {
    document.settings.customColors.value = (!setting.colorThumb || !setting.colorTrack) ? 'no' : 'yes';

    setting = loadWithDefaults(setting);
    document.settings.width.value = setting.width;
    document.settings.override.value = setting.allowOverride;

    previousToggleValue = document.settings.customColors.value;
    toggleColors();

    colorPickerThumb.setColor(setting.colorThumb);
    colorPickerTrack.setColor(setting.colorTrack);

    browser.extension.isAllowedIncognitoAccess(togglePrivateNotice);
    toggleChangesWarning(false);
}

/**
 * Save settings to Storage API
 */
function save() {
    const colTrack = (document.settings.customColors.value == 'yes') ? colorPickerTrack.color.hex : '';
    const colThumb = (document.settings.customColors.value == 'yes') ? colorPickerThumb.color.hex : '';

    browser.storage.local.set({
        width: document.settings.width.value,
        colorTrack: colTrack,
        colorThumb: colThumb,
        allowOverride: parseInt(document.settings.override.value)
    });

    toggleChangesWarning(false);
}

/**
 * Create color picker utilities
 */
function createColorPickers() {
    colorPickerThumb = new Picker({
        parent: document.getElementById('colorThumb'),
        popup: false,
        color: defaults.colorThumb
    });
    colorPickerTrack = new Picker({
        parent: document.getElementById('colorTrack'),
        popup: false,
        color: defaults.colorTrack
    });

    colorPickerThumb.onChange = function(color) {
        toggleChangesWarning(true);
    };
    colorPickerTrack.onChange = function(color) {
        toggleChangesWarning(true);
    };
}

/**
 * Show/hide custom colors
 */
function toggleColors() {
    toggleChangesWarning(true);

    if (document.settings.customColors.value == 'yes') {
        if (previousToggleValue != 'yes') {
            colorPickerThumb.setColor(defaults.colorThumb);
            colorPickerTrack.setColor(defaults.colorTrack);
        }
        document.settings.className = '';
    } else {
        document.settings.className = 'no-custom-colors';
    }

    previousToggleValue = document.settings.customColors.value;
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
 * Display Private Browsing access warning message, if required
 */
function togglePrivateNotice(isAllowPrivateBrowsing) {
    if (!isAllowPrivateBrowsing) {
        document.getElementById('private-notice').classList.remove('hide');
    }
}

/**
 * Updates the live preview textarea style
 */
function updatePreview() {
    document.getElementById('preview-css').textContent = getNewCSS();
}

/**
 * Generates new CSS code for scrollbars
 * @returns {string} css
 */
function getNewCSS() {
    const width = document.settings.width.value;
    let colThumb = (document.settings.customColors.value == 'yes') ? colorPickerThumb.color.hex : null;
    let colTrack = (document.settings.customColors.value == 'yes') ? colorPickerTrack.color.hex : null;

    return generateCSS(width, colTrack, colThumb, 0);
}

/**
 * Update the Private Browsing name label
 */
function updatePrivateBrowsingName() {
    const labels = document.getElementsByClassName('private-notice-name');
    let name;

    if (runningOn == browsers.FIREFOX) name = "Private Browsing";
    else if (runningOn == browsers.CHROME) name = "Incognito";
    else if (runningOn == browsers.EDGE) name = "InPrivate";
    else if (runningOn == browsers.OPERA) name = "Incognito";
    else return;

    for (l of labels) {
        l.textContent = name;
    }
}

let colorPickerThumb, colorPickerTrack, previousToggleValue;
let pendingChanges = false;
createColorPickers();
updatePrivateBrowsingName();
let data = browser.storage.local.get(restore);

document.getElementById('saveChanges').addEventListener('click', save);
document.settings.addEventListener('change', toggleColors);
window.addEventListener('beforeunload', (event) => {
    // Prevent user from leaving if they have unsaved changes
    if (pendingChanges) {
        event.preventDefault();
        event.returnValue = '';
    }
});
