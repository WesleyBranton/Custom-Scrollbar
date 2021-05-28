/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Load i18n data
 */
function parsei18n() {
    document.title = browser.i18n.getMessage('optionsTitle', browser.i18n.getMessage('extensionName'));

    const elements = document.querySelectorAll('[data-i18n]');
    for (e of elements) {
        const placeholders = [];

        if (e.hasAttribute('data-i18n-placeholders')) {
            const num = parseInt(e.getAttribute('data-i18n-placeholders'));

            for (let i = 1; i <= num; i++) {
                placeholders.push(browser.i18n.getMessage(e.getAttribute('data-i18n-placeholder-' + i)));
            }
        }

        e.textContent = browser.i18n.getMessage(e.dataset.i18n, placeholders);
    }

    document.getElementById('customWidthHelp').title = browser.i18n.getMessage('linkHelp');
}

/**
 * Load settings from Storage API
 * @param {Object} setting - The Storage API object
 */
function restore(setting) {
    setting = setting[Object.keys(setting)[0]];

    if (typeof setting == 'undefined') {
        return;
    }

    document.settings.customColors.value = (!setting.colorThumb || !setting.colorTrack) ? 'no' : 'yes';

    setting = loadWithDefaults(setting);
    if (setting.width == 'unset') setting.width = 'auto';
    document.settings.width.value = setting.width;
    document.settings.override.value = setting.allowOverride;
    document.settings.customWidthValue.value = setting.customWidthValue;
    document.settings.customWidthUnit.value = setting.customWidthUnit;

    previousToggleValue = document.settings.customColors.value;
    toggleColors();

    colorPickerThumb.color.hex8String = setting.colorThumb;
    colorPickerTrack.color.hex8String = setting.colorTrack;

    browser.extension.isAllowedIncognitoAccess(togglePrivateNotice);
    toggleChangesWarning(false);
    toggleCustomWidth();
    parseCustomWidthValue(false);
}

/**
 * Save settings to Storage API
 */
function save() {
    const colTrack = (document.settings.customColors.value == 'yes') ? colorPickerTrack.color.hex8String : null;
    const colThumb = (document.settings.customColors.value == 'yes') ? colorPickerThumb.color.hex8String : null;
    const profileName = document.getElementById('profileSelection').options[document.getElementById('profileSelection').selectedIndex].textContent.trim();
    const save = {
        name: profileName,
        width: document.settings.width.value,
        colorTrack: colTrack,
        colorThumb: colThumb,
        allowOverride: parseInt(document.settings.override.value)
    };

    if (save.width == 'other') {
        save['customWidthValue'] = parseInt(document.settings.customWidthValue.value);
        save['customWidthUnit'] = document.settings.customWidthUnit.value;
    }

    const wrapper = {};
    wrapper[`profile_${selectedProfile}`] = save;

    browser.storage.local.set(wrapper, () => {
        toggleChangesWarning(false);
        reloadProfileSelection();
    });
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
    const colThumb = (document.settings.customColors.value == 'yes') ? colorPickerThumb.color.hex8String : null;
    const colTrack = (document.settings.customColors.value == 'yes') ? colorPickerTrack.color.hex8String : null;
    const customWidth = (document.settings.width.value == 'other') ? document.settings.customWidthValue.value + document.settings.customWidthUnit.value : null;

    return generateCSS(width, colTrack, colThumb, 0, customWidth);
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
    let layout;
    if (CSS.supports('background', 'rgba(0, 0, 0, 0) conic-gradient(red, magenta, blue, aqua, lime, yellow, red) repeat scroll 0% 0%')) {
        layout = [
            { component: iro.ui.Wheel },
            {
                component: iro.ui.Slider,
                options: { sliderType: 'value' }
            },
            {
                component: iro.ui.Slider,
                options: { sliderType: 'alpha' }
            }
        ];
    } else {
        layout = [
            { component: iro.ui.Box },
            {
                component: iro.ui.Slider,
                options: { sliderType: 'hue' }
            },
            {
                component: iro.ui.Slider,
                options: { sliderType: 'alpha' }
            }
        ];
    }

    const picker = new iro.ColorPicker(container, {
        color: setTo,
        layout: layout,
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

/**
 * Toggle the options for width of other
 */
function toggleCustomWidth() {
    const customWidthValue = document.getElementById('customWidthValue');
    const customWidthUnit = document.getElementById('customWidthUnit');

    if (document.settings.width.value == 'other') {
        customWidthValue.disabled = false;
        customWidthUnit.disabled = false;
    } else {
        customWidthValue.disabled = true;
        customWidthUnit.disabled = true;
    }
}

/**
 * Parse and handle focus of custom with value
 * @param {boolean} showNumber
 */
function parseCustomWidthValue(showNumber) {
    const otherText = document.getElementById('customWidthValue');

    if (showNumber) {
        otherText.type = 'number';
    } else {
        otherText.type = 'text';
        if (isNaN(parseInt(otherText.value))) {
            otherText.value = defaults.customWidthValue;
        }
    }
}

/**
 * Load data from the Storage API
 * @param {Object} data
 */
function loadStorage(data) {
    if (data.defaultProfile) {
        selectedProfile = data.defaultProfile;
        defaultProfile = selectedProfile;
        changeProfile(selectedProfile);
    }

    reloadProfileSelection();
    settings.profile.value = selectedProfile;
}

/**
 * Change the selected profile
 * @param {number} id
 */
function changeProfile(id) {
    selectedProfile = id;
    document.getElementById('profile-setDefault').disabled = selectedProfile == defaultProfile;
    browser.storage.local.get(`profile_${id}`, restore);
}

/**
 * Add new profile
 */
function addProfile() {
    const id = Date.now();
    const newProfile = {};
    newProfile[`profile_${id}`] = {
        name: generateUnconflictingProfileName(browser.i18n.getMessage('defaultProfileName'), id)
    };

    browser.storage.local.set(newProfile, () => {
        reloadProfileSelection();
        changeProfile(id);
    });
}

/**
 * Remove selected profile
 */
function removeProfile() {
    browser.storage.local.remove(`profile_${selectedProfile}`, () => {
        reloadProfileSelection();
        changeProfile(defaultProfile);
    })
}

/**
 * Change the profile that's used as default
 */
function updateDefaultProfile() {
    browser.storage.local.set({defaultProfile: selectedProfile}, () => {
        defaultProfile = selectedProfile;
        reloadProfileSelection();
    });
}

/**
 * Rename the profile that's currently selected
 * @param {String} input
 */
function renameProfile(input) {
    input = generateUnconflictingProfileName(input, selectedProfile);

    browser.storage.local.get(`profile_${selectedProfile}`, (data) => {
        data[`profile_${selectedProfile}`].name = input;
        browser.storage.local.set(data, () => {
            reloadProfileSelection();
        });
    })
}

/**
 * Reload the list of profiles from the Storage API
 */
function reloadProfileSelection() {
    browser.storage.local.get((data) => {
        const selector = document.getElementById('profileSelection');
        selector.textContent = '';

        for (let key of Object.keys(data)) {
            if (key.split('_')[0]  == 'profile') {
                const option = document.createElement('option');
                option.textContent = data[key].name;
                option.value = key.split('_')[1];
                selector.appendChild(option);
            }
        }

        let options = selector.options;
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

        document.settings.profile.value = selectedProfile;
        document.getElementById('profile-setDefault').disabled = selectedProfile == defaultProfile;
    });
}

/**
 * Generate a unique name from the given string (prevents duplicate profile names)
 * @param {String} name
 * @param {number} id
 * @returns Unique Name
 */
 function generateUnconflictingProfileName(name, id) {
    const selector = document.getElementById('profileSelection');
    const names = selector.getElementsByTagName('option');
    let finalName = name;
    let counter = 1;

    for (let i = 0; i < names.length; i++) {
        if (names[i].textContent == finalName && names[i].value != id) {
            i = -1;
            counter++;
            finalName = `${name} (${counter})`;
        }
    }

    return finalName;
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

    // Show correct section
    const tabs = document.getElementsByClassName('tab-section');
    for (let tab of tabs) {
        if (tab.id == `tab-${selected}`) {
            tab.classList.remove('hide');
        } else {
            tab.classList.add('hide');
        }
    }

    // Change selected tab on tab bar
    const tabButtons = document.getElementById('tab-bar').getElementsByTagName('button');
    for (let button of tabButtons) {
        button.classList.remove('selected');
    }
    document.getElementById(`tabselect-${selected}`).classList.add('selected');
}

/**
 * Save Storage API backup (requires permission)
 */
function saveBackup() {
    browser.permissions.request({ permissions: ['downloads'] }, (granted) => {
        if (granted) {
            browser.storage.local.get((data) => {
                const file = new Blob([JSON.stringify(data)], {type: 'application/json'});
                const fileURL = URL.createObjectURL(file);

                browser.downloads.download({
                    filename: `custom-scrollbars-backup-${Date.now()}.json`,
                    saveAs: true,
                    url: fileURL
                });
            });
        } else {
            console.error('Missing persmission to manage downloads');
            showAlert(browser.i18n.getMessage('dialogPermissionRequired'), null, null);
        }
    });
}

/**
 * Update file selection
 */
function selectFile() {
    const fileInput = document.getElementById('restore-file');
    const fileNameOutput = document.getElementById('restore-file-name');
    const restoreButton = document.getElementById('button-restore');
    const clearFileButton = document.getElementById('button-removeFile');

    if (fileInput.files.length == 1) {
        fileNameOutput.textContent = fileInput.files[0].name;
        restoreButton.disabled = false;
        clearFileButton.classList.remove('hide');
    } else {
        fileNameOutput.textContent = browser.i18n.getMessage('noFileSelected');
        restoreButton.disabled = true;
        clearFileButton.classList.add('hide');
    }
}

/**
 * Clear the selected file
 */
function clearFile() {
    document.getElementById('restore-file').value = '';
    selectFile();
}

/**
 * Apply backup to Storage API
 */
function loadBackup() {
    const fileInput = document.getElementById('restore-file');

    if (fileInput.files.length == 1) {
        const reader = new FileReader();
        reader.onload = processBackupFile;
        reader.readAsText(fileInput.files[0]);
    }
}

/**
 * Restore the applied file into the Storage API
 * @param {Event} event
 */
function processBackupFile(event) {
    let data;

    try {
        data = JSON.parse(event.target.result);
    } catch (error) {
        console.error('File is not in JSON format');
        showAlert(
            browser.i18n.getMessage('dialogInvalidBackup'),
            clearFile,
            null
        );
        return;
    }

    if (!data.schema || !data.defaultProfile || !data[`profile_${data.defaultProfile}`]) {
        if (!data.schema) console.error('File missing schema marker');
        if (!data.defaultProfile) console.error('File missing default profile marker');
        else if (!data[`profile_${data.defaultProfile}`]) console.error('File missing default profile');

        showAlert(
            browser.i18n.getMessage('dialogInvalidBackup'),
            clearFile,
            null
        );
        return;
    }

    browser.storage.local.clear(() => {
        browser.storage.local.set(data, () => {
            showAlert(
                browser.i18n.getMessage('dialogBackupRestored'),
                () => { window.location.reload() },
                null
            );
        });
    });
}

parsei18n();
let colorPickerThumb, colorPickerTrack, previousToggleValue;
let defaultProfile, selectedProfile, selectedProfileName;
const colorInputs = {};
let pendingChanges = false;
createColorPickers();
updatePrivateBrowsingName();
clearFile();
let data = browser.storage.local.get('defaultProfile', loadStorage);

// Add browser tag to body class
if (runningOn == browsers.FIREFOX) {
    document.body.classList.add('firefox');
} else {
    document.body.classList.add('chromium');
}

document.getElementById('saveChanges').addEventListener('click', save);
document.settings.addEventListener('change', toggleColors);
document.settings.addEventListener('change', toggleCustomWidth);
document.getElementById('customWidthValue').addEventListener('focus', () => { parseCustomWidthValue(true) });
document.getElementById('customWidthValue').addEventListener('blur', () => { parseCustomWidthValue(false) });
document.getElementById('tab-bar').addEventListener('click', changeTab);

document.settings.profile.addEventListener('change', () => {
    confirmAction(
        browser.i18n.getMessage('dialogChangesWillBeLost'),
        function() { changeProfile(document.settings.profile.value) },
        function() { document.settings.profile.value = selectedProfile },
        !pendingChanges
    );
});
document.getElementById('profile-add').addEventListener('click', () => {
    confirmAction(
        browser.i18n.getMessage('dialogChangesWillBeLost'),
        addProfile,
        null,
        !pendingChanges
    );
});
document.getElementById('profile-rename').addEventListener('click', () => {
    const selector = document.getElementById('profileSelection');
    showPrompt(
        renameProfile,
        null,
        selector.options[selector.selectedIndex].textContent
    );
});
document.getElementById('profile-remove').addEventListener('click', () => {
    if (selectedProfile == defaultProfile) {
        showAlert(
            browser.i18n.getMessage('dialogCannotDeleteDefault'),
            null,
            false
        );
        return;
    }

    confirmAction(
        browser.i18n.getMessage('dialogCannotBeUndone'),
        removeProfile,
        null,
        false
    );
});
document.getElementById('profile-setDefault').addEventListener('click', updateDefaultProfile);

document.getElementById('button-backup').addEventListener('click', saveBackup);
document.getElementById('button-removeFile').addEventListener('click', clearFile);
document.getElementById('restore-file').addEventListener('change', selectFile);
document.getElementById('button-changeFile').addEventListener('click', () => {
    document.getElementById('restore-file').click();
});
document.getElementById('button-restore').addEventListener('click', () => {
    confirmAction(
        browser.i18n.getMessage('dialogDataOverwrite'),
        loadBackup,
        null,
        false
    );
});

window.addEventListener('beforeunload', (event) => {
    // Prevent user from leaving if they have unsaved changes
    if (pendingChanges) {
        event.preventDefault();
        event.returnValue = '';
    }
});
