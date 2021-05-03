/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Load i18n data
 */
function parsei18n() {
    document.title = browser.i18n.getMessage('optionsTitle');

    const elements = document.querySelectorAll('[data-i18n]');
    for (e of elements) {
        e.textContent = browser.i18n.getMessage(e.dataset.i18n);
    }
}

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
    const colTrack = (document.settings.customColors.value == 'yes') ? colorPickerTrack.color.hex8String : null;
    const colThumb = (document.settings.customColors.value == 'yes') ? colorPickerThumb.color.hex8String : null;

    browser.storage.local.set({
        width: document.settings.width.value,
        colorTrack: colTrack,
        colorThumb: colThumb,
        allowOverride: parseInt(document.settings.override.value)
    });

    toggleChangesWarning(false);
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
 * Create color picker utilities
 */
 function createColorPickers() {
    colorPickerThumb = createColorPicker(
        document.getElementById('colorThumb'),
        getColorInputs('colorThumb'),
        document.getElementById('colorThumbPreview'),
        defaults.colorThumb
    );
    colorPickerTrack = createColorPicker(
        document.getElementById('colorTrack'),
        getColorInputs('colorTrack'),
        document.getElementById('colorTrackPreview'),
        defaults.colorThumb
    );
}

/**
 * Create color picker
 * @param {HTMLElement} container
 * @param {Object} inputs
 * @param {HTMLElement} preview
 * @param {string} setTo
 * @returns 
 */
function createColorPicker(container, inputs, preview, setTo) {
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
        inputs.hex.value = color.hex8String;

        inputs.rgb.red.value = Math.round(color.red);
        inputs.rgb.green.value = Math.round(color.green);
        inputs.rgb.blue.value = Math.round(color.blue);
        inputs.rgb.alpha.value = Math.round(color.alpha * 100);

        inputs.hsv.hue.value = Math.round(color.hue);
        inputs.hsv.saturation.value = Math.round(color.saturation);
        inputs.hsv.value.value = Math.round(color.value);
        inputs.hsv.alpha.value = Math.round(color.alpha * 100);

        preview.style.backgroundColor = color.hex8String;
        toggleChangesWarning(true);
    });

    inputs.tabs.hex.addEventListener('click', () => { changeColorMode(inputs.tabs, inputs.tabs.hex, 'hex') });
    inputs.tabs.rgb.addEventListener('click', () => { changeColorMode(inputs.tabs, inputs.tabs.rgb, 'rgb') });
    inputs.tabs.hsv.addEventListener('click', () => { changeColorMode(inputs.tabs, inputs.tabs.hsv, 'hsv') });

    inputs.hex.addEventListener('change', () => {
        picker.color.hex8String = inputs.hex.value.trim();
    });
    inputs.rgb.red.addEventListener('change', () => {
        validateColor(inputs.rgb.red, 255, picker.color.red, false);
        picker.color.red = inputs.rgb.red.value.trim();
    });
    inputs.rgb.green.addEventListener('change', () => {
        validateColor(inputs.rgb.green, 255, picker.color.green, false);
        picker.color.green = inputs.rgb.green.value.trim();
    });
    inputs.rgb.blue.addEventListener('change', () => {
        validateColor(inputs.rgb.blue, 255, picker.color.blue, false);
        picker.color.blue = inputs.rgb.blue.value.trim();
    });
    inputs.rgb.alpha.addEventListener('change', () => {
        validateColor(inputs.rgb.alpha, 100, picker.color.alpha, true);
        picker.color.alpha = inputs.rgb.alpha.value.trim();
    });
    inputs.hsv.hue.addEventListener('change', () => {
        validateColor(inputs.hsv.hue, 360, picker.color.hue, false);
        picker.color.hue = inputs.hsv.hue.value.trim();
    });
    inputs.hsv.saturation.addEventListener('change', () => {
        validateColor(inputs.hsv.saturation, 100, picker.color.saturation, false);
        picker.color.saturation = inputs.hsv.saturation.value.trim();
    });
    inputs.hsv.value.addEventListener('change', () => {
        validateColor(inputs.hsv.value, 100, picker.color.value, false);
        picker.color.value = inputs.hsv.value.value.trim();
    });
    inputs.hsv.alpha.addEventListener('change', () => {
        validateColor(inputs.hsv.alpha, 100, picker.color.alpha, true);
        picker.color.alpha = inputs.hsv.alpha.value.trim();
    });

    inputs.hex.value = picker.color.hex8String;

    inputs.rgb.red.value = Math.round(picker.color.red);
    inputs.rgb.green.value = Math.round(picker.color.green);
    inputs.rgb.blue.value = Math.round(picker.color.blue);
    inputs.rgb.alpha.value = Math.round(picker.color.alpha * 100);

    inputs.hsv.hue.value = Math.round(picker.color.hue);
    inputs.hsv.saturation.value = Math.round(picker.color.saturation);
    inputs.hsv.value.value = Math.round(picker.color.value);
    inputs.hsv.alpha.value = Math.round(picker.color.alpha * 100);

    preview.style.backgroundColor = picker.color.hex8String;

    return picker;
}

/**
 * Make sure that the color entered is valid
 * @param {HTMLElement} value
 * @param {number} max
 * @param {number} original
 * @param {boolean} percentage
 */
function validateColor(value, max, original, percentage) {
    const parsedValue = parseFloat(value.value.trim());
    if (isNaN(parsedValue)) value.value = original;
    else if (parsedValue < 0) value.value = 0;
    else if (parsedValue > max) value.value = max;
    if (percentage) value.value = parsedValue / 100;
}

/**
 * Change between Hex, RGB or HSV mode
 * @param {Object} tabs 
 * @param {HTMLElement} selected 
 * @param {string} key 
 */
function changeColorMode(tabs, selected, key) {
    clearTabSelection(tabs);
    selected.classList.add('selected');
    selected.parentNode.parentNode.classList.add('show' + key.toUpperCase());
}

/**
 * Get all elements of the color inputs
 * @param {string} parentId
 * @returns Object of all HTML elements
 */
function getColorInputs(parentId) {
    const hex = document.getElementById(parentId + 'HEX');
    const rgb = document.getElementById(parentId + 'RGB');
    const hsv = document.getElementById(parentId + 'HSV');
    const tabs = document.getElementById(parentId + "Tabs");

    const obj = {
        hex: hex,
        rgb: {
            red: rgb.getElementsByTagName('input')[0],
            green: rgb.getElementsByTagName('input')[1],
            blue: rgb.getElementsByTagName('input')[2],
            alpha: rgb.getElementsByTagName('input')[3]
        },
        hsv: {
            hue: hsv.getElementsByTagName('input')[0],
            saturation: hsv.getElementsByTagName('input')[1],
            value: hsv.getElementsByTagName('input')[2],
            alpha: hsv.getElementsByTagName('input')[3]
        },
        container: document.getElementById(parentId).parentElement,
        tabs: {
            hex: tabs.getElementsByTagName('button')[0],
            rgb: tabs.getElementsByTagName('button')[1],
            hsv: tabs.getElementsByTagName('button')[2],
        }
    };

    return obj;
}

/**
 * Reset the tab selection
 * @param {Object} tabs 
 */
function clearTabSelection(tabs) {
    tabs.hex.classList.remove('selected');
    tabs.rgb.classList.remove('selected');
    tabs.hsv.classList.remove('selected');

    const container = tabs.hex.parentNode.parentNode;
    container.classList.remove('showHEX');
    container.classList.remove('showRGB');
    container.classList.remove('showHSV');
}

parsei18n();
let colorPickerThumb, colorPickerTrack, previousToggleValue;
const colorInputs = {};
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
