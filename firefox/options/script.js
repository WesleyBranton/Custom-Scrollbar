/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Load settings from Storage API
 * @param {Object} setting - The Storage API object
 */
function restore(setting) {
    if (setting.width) {
        document.settings.width.value = setting.width;
    } else {
        document.settings.width.value = 'unset';
    }

    if (!setting.colorThumb || !setting.colorTrack) {
        document.settings.customColors.value = 'no';
    } else {
        document.settings.customColors.value = 'yes';
    }

    previousToggleValue = document.settings.customColors.value;
    toggleColors();

    colorPickerThumb.setColor(setting.colorThumb);
    colorPickerTrack.setColor(setting.colorTrack);

    togglePrivateNotice();
    toggleChangesWarning(false);
    updateWindowScrollbar();
}

/**
 * Save settings to Storage API
 */
function save() {
    let colTrack = '';
    let colThumb = '';

    if (document.settings.customColors.value == 'yes') {
        colThumb = colorPickerThumb.color.hex;
        colTrack = colorPickerTrack.color.hex;
    }

    browser.storage.local.set({
        width: document.settings.width.value,
        colorTrack: colTrack,
        colorThumb: colThumb
    });

    toggleChangesWarning(false);
    updateWindowScrollbar();
}

/**
 * Create color picker utilities
 */
function createColorPickers() {
    colorPickerThumb = new Picker({
        parent: document.getElementById('colorThumb'),
        popup: false,
        color: '#CDCDCDFF'
    });
    colorPickerTrack = new Picker({
        parent: document.getElementById('colorTrack'),
        popup: false,
        color: '#F0F0F0FF'
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
            colorPickerThumb.setColor('#CDCDCDFF');
            colorPickerTrack.setColor('#F0F0F0FF');
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
    if (show) {
        document.getElementById('saveWarning').className = 'unsaved';
        document.getElementById('saveChanges').disabled = false;
        pendingChanges = true;
    } else {
        document.getElementById('saveWarning').className = 'saved';
        document.getElementById('saveChanges').disabled = true;
        pendingChanges = false;
    }

    updatePreview();
}

/**
 * Display Private Browsing access warning message, if required
 * @async
 */
async function togglePrivateNotice() {
    let isAllowPrivateBrowsing = await browser.extension.isAllowedIncognitoAccess();

    if (!isAllowPrivateBrowsing) {
        document.getElementById('private-notice').classList.remove('hide');
    }
}

/**
 * Updates the live preview textarea style
 */
function updatePreview() {
    const preview = document.getElementById('preview');
    const css = getNewCSS();

    preview.setAttribute('style', css);
}

/**
 * Changes scrollbars on options page to match the new settings
 */
function updateWindowScrollbar() {
    const css = getNewCSS();
    document.documentElement.setAttribute('style', css);
}

/**
 * Generates new CSS code for scrollbars
 * @returns {string} css
 */
function getNewCSS() {
    const width = document.settings.width.value;
    let colThumb = (document.settings.customColors.value == 'yes') ? colorPickerThumb.color.hex : 'unset';
    let colTrack = (document.settings.customColors.value == 'yes') ? colorPickerTrack.color.hex : 'unset';

    const css = `scrollbar-width: ${width} !important; scrollbar-color: ${colThumb} ${colTrack} !important;`;

    return css;
}

let colorPickerThumb, colorPickerTrack, previousToggleValue;
let pendingChanges = false;
createColorPickers();
let data = browser.storage.local.get();
data.then(restore);

document.getElementById('saveChanges').addEventListener('click', save);
document.settings.addEventListener('change', toggleColors);
window.addEventListener('beforeunload', (event) => {
    // Prevent user from leaving if they have unsaved changes
    if (pendingChanges) {
        event.preventDefault();
        event.returnValue = '';
    }
});
