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

    toggleColors();

    colPicker1.setColor(setting.colorThumb);
    colPicker2.setColor(setting.colorTrack);

    toggleChangesWarning(false);
}

/**
 * Save settings to Storage API
 */
function save() {
    browser.storage.local.set({
        width: document.settings.width.value,
        colorTrack: document.settings.colorTrack.value,
        colorThumb: document.settings.colorThumb.value
    });
    toggleChangesWarning(false);
}

/**
 * Create color picker utilities
 */
function createColorPickers() {
    colPicker1 = new Picker({
        parent: document.getElementById('picker1'),
        popup: false,
        color: '#CDCDCDFF'
    });
    colPicker2 = new Picker({
        parent: document.getElementById('picker2'),
        popup: false,
        color: '#FFFFFF00'
    });

    colPicker1.onChange = function (color) {
        document.settings.colorThumb.value = color.hex;
        toggleChangesWarning(true);
    };
    colPicker2.onChange = function (color) {
        document.settings.colorTrack.value = color.hex;
        toggleChangesWarning(true);
    };
}

/**
 * Show/hide custom colors
 */
function toggleColors() {
    toggleChangesWarning(true);

    if (document.settings.customColors.value == 'yes') {
        document.settings.colorThumb.value = '#CDCDCDFF';
        document.settings.colorTrack.value = '#FFFFFF00';
        colPicker1.setColor('#CDCDCDFF');
        colPicker2.setColor('#FFFFFF00');
        document.settings.className = '';
    } else {
        document.settings.className = 'no-custom-colors';
        document.settings.colorThumb.value = '';
        document.settings.colorTrack.value = '';
    }
}

/**
 * Change the unsaved changes warning banner
 * @param {boolean} show
 */
function toggleChangesWarning(show) {
    console.log("Trigger");
    if (show) {
        document.getElementById('saveWarning').className = 'unsaved';
    } else {
        document.getElementById('saveWarning').className = 'saved';
    }
}

let colPicker1, colPicker2;
createColorPickers();
let data = browser.storage.local.get();
data.then(restore);

document.getElementById('saveChanges').addEventListener('click', save);
document.settings.addEventListener('change', toggleColors);
