/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Add rule
 * @param {String} profile
 * @param {String} domain
 */
function addRule(profile, domain) {
    domain = domain.trim();
    let rule;

    if (domain.charAt(0) == '*') {
        rule = new Rule(profile, domain.substring(2), true);
    } else {
        rule = new Rule(profile, domain, false);
    }

    rules[domain] = rule;
    addListItem(rule);
}

/**
 * Add rule list item to UI
 * @param {Object} rule
 */
function addListItem(rule) {
    const list = document.getElementById('rule-list');
    const template = document.getElementById('template-rule');
    const clone = template.content.cloneNode(true).children[0];

    clone.getElementsByClassName('rule-domain')[0].textContent = rule.displayDomain();

    const profileNameOutput = clone.getElementsByClassName('rule-profile')[0];
    if (rule.profile == 'default') {
        profileNameOutput.textContent = browser.i18n.getMessage('profileUsingDefault', listOfProfiles[`profile_${defaultProfile}`]);
    } else if (listOfProfiles[rule.profile]) {
        profileNameOutput.textContent = listOfProfiles[rule.profile];
    } else {
        console.warn(`Scrollbar "${rule.profile}" cannot be loaded from storage for rule "${rule.fullDomain()}".`);
        profileNameOutput.textContent = `** ${browser.i18n.getMessage('ruleNoProfileSet')} **`;
        profileNameOutput.classList.add('profile-missing');
    }

    checkIfListIsEmpty();

    let sortIndex = 0;
    const listItems = list.children;
    for (const item of listItems) {
        if (sortingFunction(rule, getRuleFromListItem(item)) > 0) {
            ++sortIndex;
        } else {
            break;
        }
    }

    list.insertBefore(clone, list.childNodes[sortIndex]);
    clone.scrollIntoView();
}

/**
 * Remove rule
 * @param {String} domain
 */
function removeRule(domain) {
    delete rules[domain.trim()];
}

/**
 * Convert raw Storage API data to Rule objects
 * @param {Object} raw
 */
function parseRules(raw) {
    for (const rule of Object.keys(raw)) {
        addRule(raw[rule], rule);
    }
    checkIfListIsEmpty();
    selectAll(false);
    updateBulkToolbar();
}

/**
 * Save rules to Storage API
 */
function saveRules() {
    showProgressBar(true);

    let temp = {};

    for (const rule of Object.values(rules)) {
        temp[rule.fullDomain()] = rule.profile;
    }

    const localFileProfile = parseInt(settings.localFileProfile.value);
    const object = {
        localFileProfile: (!isNaN(localFileProfile)) ? localFileProfile : null,
        framesInherit: settings.framesInherit.value == 'yes',
        rules: temp
    };

    browser.storage.local.set(object, () => {
        showProgressBar(false);
    });
    toggleChangesWarning(false);
}

/**
 * Sorts list items by domain
 * @param {Object} a
 * @param {Object} b
 * @returns Sorted position
 */
function sortByDomain(a, b) {
    const aParts = a.domain.split('.');
    const bParts = b.domain.split('.');

    let aIndex = aParts.length - 2;
    let bIndex = bParts.length - 2;

    while (true) {
        if (aIndex < 0 && bIndex < 0) {
            if (a.includeSubdomains && !b.includeSubdomains) {
                return -1;
            } else if (!a.includeSubdomains && b.includeSubdomains) {
                return 1;
            }
            return 0;
        } else if (aIndex < 0) {
            return 1;
        } else if (bIndex < 0) {
            return -1;
        }

        if (aParts[aIndex] != bParts[bIndex]) {
            return aParts[aIndex].localeCompare(bParts[bIndex]);
        }

        aIndex--;
        bIndex--;
    }
}

/**
 * Sorts list items by profile name
 * @param {Object} a
 * @param {Object} b
 * @returns Sorted position
 */
function sortByProfile(a, b) {
    const aName = listOfProfiles[a.profile];
    const bName = listOfProfiles[b.profile];

    if (aName == bName) {
        return sortByDomain(a, b);
    }

    return listOfProfiles[a.profile].localeCompare(listOfProfiles[b.profile]);
}

/**
 * Change the sorting method
 */
function changeSorting() {
    const sortInput = document.getElementById('ruleSorting');

    switch (sortInput.value) {
        case 'domain':
            sortingFunction = sortByDomain;
            break;
        case 'profile':
            sortingFunction = sortByProfile;
            break;
        default:
            sortingFunction = sortByDomain;
            sortInput.value = 'domain';
            break;
    }

    const list = document.getElementById('rule-list');
    list.textContent = '';

    for (const rule of Object.values(rules)) {
        addListItem(rule);
    }
    checkIfListIsEmpty();
}

/**
 * Filter rules by search term
 */
function searchRules() {
    if (Object.keys(rules).length > 0) {
        const listItems = document.getElementById('rule-list').children;
        const searchTerm = document.getElementById('ruleSearch').value.trim().toLowerCase();
        let found = false;

        for (const item of listItems) {
            const rule = getRuleFromListItem(item);

            if (rule && rule.displayDomain().toLowerCase().includes(searchTerm)) {
                item.classList.remove('hide');
                found = true;
            } else {
                item.classList.add('hide');
            }
        }

        const list = document.getElementById('rule-list');
        const empty = document.getElementById('rule-list-not-found');

        if (found) {
            if (empty) list.removeChild(empty);
        } else {
            if (!empty) {
                const template = document.getElementById('template-rule');
                const clone = template.content.cloneNode(true).children[0];

                clone.getElementsByClassName('text')[0].textContent = browser.i18n.getMessage('noRulesFound');
                clone.getElementsByClassName('text-shortcut')[0].textContent = '';
                clone.id = 'rule-list-not-found';

                list.appendChild(clone);
            } else {
                empty.classList.remove('hide');
            }
        }
    } else {
        checkIfListIsEmpty();
    }

    updateBulkToolbar();
}

/**
 * Select/Deselect all visible rules
 * @param {boolean} check
 */
function selectAll(check) {
    if (Object.keys(rules).length > 0) {
        const listItems = document.getElementById('rule-list').children;

        for (const item of listItems) {
            if (!item.classList.contains('hide')) {
                const checkbox = item.getElementsByClassName('rule-select-checkbox')[0];
                if (checkbox) {
                    checkbox.checked = check;
                }
            }
        }
    }

    updateBulkToolbar();
}

/**
 * Get all selected rule list items
 * @returns List of selected rule items
 */
function getSelected() {
    const listItems = document.getElementById('rule-list').children;
    const selectedItems = [];

    for (const item of listItems) {
        if (!item.classList.contains('hide')) {
            const checkbox = item.getElementsByClassName('rule-select-checkbox')[0];
            if (checkbox && checkbox.checked) {
                selectedItems.push(item);
            }
        }
    }

    return selectedItems;
}

/**
 * Delete selected rules
 */
function bulkDelete() {
    confirmAction(
        browser.i18n.getMessage('dialogCannotBeUndone'),
        () => {
            for (const item of getSelected()) {
                const rule = getRuleFromListItem(item);
                removeRule(rule.fullDomain());
                document.getElementById('rule-list').removeChild(item);
            }

            toggleChangesWarning(true);
            checkIfListIsEmpty();
            searchRules();
        },
        null,
        false
    );
}

/**
 * Change profile of selected rules
 */
function bulkChangeProfile() {
    showDowndown(
        browser.i18n.getMessage('changeProfileFor', browser.i18n.getMessage('selectedRules')),
        null,
        (value) => {
            for (const item of getSelected()) {
                const profileNameOutput = item.getElementsByClassName('rule-profile')[0];
                const rule = getRuleFromListItem(item);
                rule.profile = `profile_${value}`;

                if (listOfProfiles[rule.profile]) {
                    profileNameOutput.textContent = listOfProfiles[rule.profile];
                    profileNameOutput.classList.remove('profile-missing');
                } else {
                    console.warn(`Scrollbar "${rule.profile}" cannot be loaded from storage for rule "${rule.fullDomain()}".`);
                    profileNameOutput.textContent = `** ${browser.i18n.getMessage('ruleNoProfileSet')} **`;
                    profileNameOutput.classList.add('profile-missing');
                }
            }

            toggleChangesWarning(true);
        },
        null
    );
}

/**
 * Enable/Disable bulk edit tools
 */
function updateBulkToolbar() {
    const disable = getSelected().length < 1;

    document.getElementById('rule-deselect-all').disabled = disable;
    document.getElementById('rule-delete-all').disabled = disable;
    document.getElementById('rule-change-all').disabled = disable;
}

/**
 * Load rule from provided UI list item
 * @param {HTMLElement} item
 * @returns Rule
 */
function getRuleFromListItem(item) {
    let text = item.getElementsByClassName('text')[0].textContent.trim();

    if (text.split(' ').length > 1) {
        text = '*.' + text.split(' ')[0];
    }

    return rules[text];
}

/**
 * Handle change profile button click
 * @param {HTMLElement} item
 */
function triggerChangeProfile(item) {
    const rule = getRuleFromListItem(item);
    document.getElementById('dialog-dropdown').value = rule.profile.split('_')[1];

    showDowndown(
        browser.i18n.getMessage('changeProfileFor', rule.displayDomain()),
        null,
        (value) => {
            const profileNameOutput = item.getElementsByClassName('rule-profile')[0];
            rule.profile = `profile_${value}`;

            if (listOfProfiles[rule.profile]) {
                profileNameOutput.textContent = listOfProfiles[rule.profile];
                profileNameOutput.classList.remove('profile-missing');
            } else {
                console.warn(`Scrollbar "${rule.profile}" cannot be loaded from storage for rule "${rule.fullDomain()}".`);
                profileNameOutput.textContent = `** ${browser.i18n.getMessage('ruleNoProfileSet')} **`;
                profileNameOutput.classList.add('profile-missing');
            }

            toggleChangesWarning(true);
        },
        null
    );

    loadProfileDetailsIntoDialog(document.getElementById('dialog-dropdown').value);
}

/**
 * Handle remove rule button click
 * @param {HTMLElement} item
 */
function triggerRemoveProfile(item) {
    confirmAction(
        browser.i18n.getMessage('dialogCannotBeUndone'),
        () => {
            const rule = getRuleFromListItem(item);
            removeRule(rule.fullDomain());
            document.getElementById('rule-list').removeChild(item);
            toggleChangesWarning(true);
            checkIfListIsEmpty();
            searchRules();
        },
        null,
        false
    );
}

/**
 * Prompt user for new rule
 */
function triggerAddNewRule() {
    showRuleAdd(
        null,
        browser.i18n.getMessage('domain'),
        browser.i18n.getMessage('optionsSectionProfile'),
        browser.i18n.getMessage('subdomainsOnly'),
        (domain, profile, includeSubdomains) => {
            if (includeSubdomains) {
                domain = '*.' + domain;
            }
            addRule(`profile_${profile}`, domain);
            toggleChangesWarning(true);
            checkIfListIsEmpty();
            searchRules();
        },
        null,
        userInputDomainValidation
    );
    loadProfileDetailsIntoDialog(document.getElementById('dialog-dropdown').value);
}

/**
 * Add/Remove the empty list message
 */
function checkIfListIsEmpty() {
    const list = document.getElementById('rule-list');
    const empty = document.getElementById('rule-list-empty');

    if (Object.keys(rules).length > 0) {
        if (empty) list.removeChild(empty);
    } else {
        if (!empty) {
            const template = document.getElementById('template-rule');
            const clone = template.content.cloneNode(true).children[0];

            clone.getElementsByClassName('text')[0].textContent = browser.i18n.getMessage('noRulesSet');
            clone.getElementsByClassName('text-shortcut')[0].textContent = '';
            clone.id = 'rule-list-empty';

            list.appendChild(clone);
        }
    }
}

/**
 * Check if user input fits valid new rule criteria
 * @param {String} input
 * @param {Boolean} checkbox
 * @param {HTMLElement} error
 * @returns Valid
 */
function userInputDomainValidation(input, checkbox, error) {
    const domainRegex = /^(?:(?![-])[a-zA-Z0-9-]+(?<!-)\.)+[a-zA-Z]{2,}$/;
    error.textContent = '';
    input = input.trim();

    if (!domainRegex.test(input)) {
        error.textContent = browser.i18n.getMessage('errorInvalidDomain');
        return false;
    }

    if (checkbox) {
        input = '*.' + input;
    }

    if (rules[input]) {
        error.textContent = browser.i18n.getMessage('errorRuleAlreadyExists');
        return false;
    }

    return true;
}

/**
 * Handle list item click
 * @param {Event} event
 */
function handleListClick(event) {
    const listButton = getListButton(event.target);

    if (listButton != null) {
        switch (listButton.getAttribute('data-action')) {
            case 'change':
                triggerChangeProfile(listButton.parentNode.parentNode);
                break;
            case 'remove':
                triggerRemoveProfile(listButton.parentNode.parentNode);
                break;
            default:
                break;
        }
    }

    updateBulkToolbar();
}

/**
 * Get click list button from click event
 * (Prevents issues if the user clicks the text or icon of button)
 * @param {HTMLElement} element
 * @returns Button
 */
function getListButton(element) {
    switch (element.tagName.toLowerCase()) {
        case 'button':
            return element;
        case 'span':
        case 'img':
            return element.parentElement.parentElement;
        case 'div':
            return element.parentElement;
        default:
            return null;
    }
}

/**
 * Initial load of data from Storage API
 */
function init() {
    browser.storage.local.get((data) => {
        // Generate list of profiles
        for (const key of Object.keys(data)) {
            if (key.split('_')[0] == 'profile') {
                listOfProfiles[key] = data[key].name;
            }
        }

        defaultProfile = data.defaultProfile;

        reloadProfileSelection(document.getElementById('dialog-dropdown'), null);
        const localProfileSelectionDropdown = document.getElementById('profileSelectionForLocalFileProfile');
        reloadProfileSelection(localProfileSelectionDropdown, () => {
            addDefaultProfileOption(localProfileSelectionDropdown);
        });

        // Load advanced setting
        data.framesInherit = (typeof data.framesInherit == 'boolean') ? data.framesInherit : true;
        settings.framesInherit.value = (data.framesInherit) ? 'yes' : 'no';

        if (typeof data.localFileProfile == 'number' && data.localFileProfile != null) {
            settings.localFileProfile.value = data.localFileProfile;
        }

        // Load rules
        if (data.rules) {
            parseRules(data.rules);
        }
    });
}

/**
 * Parse i18n on template
 */
function parsei18nOfTemplate() {
    const elements = document.getElementById('template-rule').content.children[0].querySelectorAll('[data-i18n]');
    for (const element of elements) {
        element.textContent = browser.i18n.getMessage(element.dataset.i18n);
    }
}

/**
 * Reset UI to default state
 */
function clear() {
    document.getElementById('ruleSorting').value = 'domain';
    document.getElementById('ruleSearch').value = '';
}

/**
 * Load profile from Storage API
 * @param {number} id
 */
 function loadProfileDetailsIntoDialog(id) {
    showProgressBar(true);

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

        showProgressBar(false);
    });
}

updatePreview = () => {};

let rules = {};
let listOfProfiles = {};
let defaultProfile;
let sortingFunction = sortByDomain;

clear();
parsei18nOfTemplate();
init();
getDefaultScrollbar();
toggleChangesWarning(false);
checkIfListIsEmpty();
updateBulkToolbar();
document.getElementById('advanced-settings').addEventListener('change', () => {
    toggleChangesWarning(true);
});
document.getElementById('rule-list').addEventListener('click', handleListClick);
document.getElementById('rule-add').addEventListener('click', triggerAddNewRule);
document.getElementById('saveChanges').addEventListener('click', saveRules);
document.getElementById('ruleSorting').addEventListener('change', changeSorting);
document.getElementById('ruleSearch').addEventListener('keyup', searchRules);
document.getElementById('rule-select-all').addEventListener('click', () => {
    selectAll(true);
});
document.getElementById('rule-deselect-all').addEventListener('click', () => {
    selectAll(false);
});
document.getElementById('rule-delete-all').addEventListener('click', bulkDelete);
document.getElementById('rule-change-all').addEventListener('click', bulkChangeProfile);
document.getElementById('dialog-dropdown').addEventListener('change', () => {
    loadProfileDetailsIntoDialog(document.getElementById('dialog-dropdown').value);
});
