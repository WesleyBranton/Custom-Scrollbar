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

    colorPickerThumb.color.hex8String = setting.colorThumb;
    colorPickerTrack.color.hex8String = setting.colorTrack;

    browser.extension.isAllowedIncognitoAccess(togglePrivateNotice);
    toggleChangesWarning(false);
}

/**
 * Save settings to Storage API
 */
function save() {
    const colTrack = (document.settings.customColors.value == 'yes') ? colorPickerTrack.color.hex8String : '';
    const colThumb = (document.settings.customColors.value == 'yes') ? colorPickerThumb.color.hex8String : '';

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
    colorPickerThumb = createColorPicker(
        document.getElementById('colorThumb'),
        document.getElementsByName('colorThumb')[0],
        document.getElementById('colorThumbPreview'),
        defaults.colorThumb
    );
    colorPickerTrack = createColorPicker(
        document.getElementById('colorTrack'),
        document.getElementsByName('colorTrack')[0],
        document.getElementById('colorTrackPreview'),
        defaults.colorThumb
    );
}

function createColorPicker(container, input, preview, setTo) {
    const picker = new iro.ColorPicker(container, {
        color: setTo,
        layout: [
            { component: iro.ui.Wheel },
            {
                component: iro.ui.Slider,
                options: { sliderType: 'value' }
            },
            {
                component: iro.ui.Slider,
                options: { sliderType: 'alpha' }
            }
        ],
        layoutDirection: 'horizontal'
    });

    picker.on('color:change', (color) => {
        input.value = color.hex8String;
        preview.style.backgroundColor = color.hex8String;
        toggleChangesWarning(true);
    });

    input.addEventListener('change', () => {
        picker.color.hex8String = input.value.trim();
    })

    input.value = picker.color.hex8String;
    preview.style.backgroundColor = picker.color.hex8String;

    return picker;
}

/**
 * Show/hide custom colors
 */
function toggleColors() {
    toggleChangesWarning(true);

    if (document.settings.customColors.value == 'yes') {
        if (previousToggleValue != 'yes') {
            colorPickerThumb.color.hex8String = defaults.colorThumb;
            colorPickerTrack.color.hex8String = defaults.colorTrack;
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
    let colThumb = (document.settings.customColors.value == 'yes') ? colorPickerThumb.color.hex8String : null;
    let colTrack = (document.settings.customColors.value == 'yes') ? colorPickerTrack.color.hex8String : null;

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
