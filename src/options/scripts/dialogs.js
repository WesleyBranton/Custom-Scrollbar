/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Show dialog on screen
 * @param {String} message
 * @param {String} type
 * @param {Function} yesAction
 * @param {Function} noAction
 */
function openDialog(message, type, yesAction, noAction) {
    document.getElementById('dialog-text').textContent = message;
    document.getElementById('dialog').className = type;

    actionYes = (yesAction) ? yesAction : () => {};
    actionNo = (noAction) ? noAction : () => {};

    document.getElementById('dialog-overlay').classList.remove('hide');
    setKeyboardNavigation(document.settings, false);
    document.body.addEventListener('keyup', bodyKeyHandler);
}

/**
 * Hide dialog from screen
 */
function closeDialog() {
    document.body.removeEventListener('keyup', bodyKeyHandler);
    document.getElementById('dialog-overlay').classList.add('hide');
    document.getElementById('dialog-error').textContent = '';
    document.getElementById('dialog-input').value = '';
    document.getElementById('dialog-checkbox').checked = false;
    setKeyboardNavigation(document.settings, true);
}

/**
 * Show user action confirmation dialog
 * @param {String} message
 * @param {Function} yesAction
 * @param {Function} noAction
 * @param {boolean} skip
 */
function confirmAction(message, yesAction, noAction, skip) {
    if (skip) {
        yesAction();
    } else {
        openDialog(message, 'confirmation', yesAction, noAction);
        document.getElementById('confirmation-no').focus();
    }
}

/**
 * Show user general alert
 * @param {String} message
 * @param {Function} yesAction
 * @param {boolean} skip
 */
function showAlert(message, yesAction, skip) {
    if (skip) {
        yesAction();
    } else {
        openDialog(message, 'popup', yesAction, null);
        document.getElementById('popup-yes').focus();
    }
}

/**
 * Prompt user for text input
 * @param {Function} yesAction
 * @param {Function} noAction
 * @param {String} prefill
 */
function showPrompt(label, yesAction, noAction, prefill) {
    const text = document.getElementById('dialog-input-label');
    if (label == null) {
        text.classList.add('hide');
    } else {
        text.classList.remove('hide');
        text.textContent = label + ':';
    }

    const input = document.getElementById('dialog-input');
    input.value = prefill.trim();
    openDialog('', 'prompt', yesAction, noAction);
    input.focus();
    input.selectionStart = prefill.trim().length;
    input.selectionEnd = prefill.trim().length;
}

/**
 * Prompt user for dropdown input
 * @param {String} message
 * @param {String} label
 * @param {Function} yesAction
 * @param {Function} noAction
 */
function showDowndown(message, label, yesAction, noAction) {
    const text = document.getElementById('dialog-dropdown-label');
    const input = document.getElementById('dialog-dropdown');

    if (label == null) {
        text.classList.add('hide');
    } else {
        text.classList.remove('hide');
        text.textContent = label + ':';
    }

    openDialog(message, 'dropdown', yesAction, noAction);
    input.focus();
}

/**
 * Prompt user for new website rule
 * @param {String} message
 * @param {String} inputText
 * @param {String} dropdownText
 * @param {String} checkboxText
 * @param {Function} yesAction
 * @param {Function} noAction
 * @param {Function} validate
 */
function showRuleAdd(message, inputText, dropdownText, checkboxText, yesAction, noAction, validate) {
    const input = document.getElementById('dialog-input');
    const inputLabel = document.getElementById('dialog-input-label');
    const dropdownLabel = document.getElementById('dialog-dropdown-label');
    const checkboxLabel = document.getElementById('dialog-checkbox-label');

    if (inputText == null) {
        inputLabel.classList.add('hide');
    } else {
        inputLabel.classList.remove('hide');
        inputLabel.textContent = inputText + ':';
    }

    if (checkboxText == null) {
        checkboxLabel.classList.add('hide');
    } else {
        checkboxLabel.classList.remove('hide');
        checkboxLabel.textContent = checkboxText + ':';
    }

    if (dropdownText == null) {
        dropdownLabel.classList.add('hide');
    } else {
        dropdownLabel.classList.remove('hide');
        dropdownLabel.textContent = dropdownText + ':';
    }

    validation = (validate) ? validate : () => {};

    openDialog(message, 'ruleadd', yesAction, noAction);
    input.focus();
}

/**
 * Handle generic dialog yes button click
 */
function clickDialogYes() {
    actionYes();
    closeDialog();
}

/**
 * Handle generic dialog no button click
 */
function clickDialogNo() {
    actionNo();
    closeDialog();
}

/**
 * Handle prompt dialog yes button click
 */
function clickPromptDialogYes() {
    const text = document.getElementById('dialog-input').value.trim();

    if (text.length > 0) {
        actionYes(text);
        closeDialog();
    }
}

/**
 * Handle drop-down dialog yes button click
 */
function clickDropdownDialogYes() {
    actionYes(document.getElementById('dialog-dropdown').value);
    closeDialog();
}

/**
 * Handle rule add dialog yes button click
 */
function clickRuleAddDialogYes() {
    if (validation(document.getElementById('dialog-input').value, document.getElementById('dialog-checkbox').checked, document.getElementById('dialog-error'))) {
        actionYes(document.getElementById('dialog-input').value, document.getElementById('dialog-dropdown').value, document.getElementById('dialog-checkbox').checked);
        closeDialog();
    }
}

/**
 * Handle keyup event when dialog is open
 * @param {KeyboardEvent} event
 */
function bodyKeyHandler(event) {
    if (event.key == 'Escape') {
        event.preventDefault();
        clickDialogNo();
    }
}

/**
 * Handle enter key on prompt dialog textbox
 * @param {KeyboardEvent} event
 */
function handleEnterKey(event) {
    if (event.key == 'Enter') {
        event.preventDefault();
        clickPromptDialogYes();
    }
}

let actionYes = () => {};
let actionNo = () => {};
let validation = () => {};
document.getElementById('prompt-yes').addEventListener('click', clickPromptDialogYes);
document.getElementById('prompt-no').addEventListener('click', clickDialogNo);
document.getElementById('confirmation-yes').addEventListener('click', clickDialogYes);
document.getElementById('confirmation-no').addEventListener('click', clickDialogNo);
document.getElementById('popup-yes').addEventListener('click', clickDialogYes);
document.getElementById('dropdown-yes').addEventListener('click', clickDropdownDialogYes);
document.getElementById('dropdown-no').addEventListener('click', clickDialogNo);
document.getElementById('ruleadd-yes').addEventListener('click', clickRuleAddDialogYes);
document.getElementById('ruleadd-no').addEventListener('click', clickDialogNo);
document.getElementById('dialog-input').addEventListener('keyup', handleEnterKey);
