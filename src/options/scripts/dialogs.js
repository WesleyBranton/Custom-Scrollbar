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

    actionYes = (yesAction) ? yesAction : ()=>{};
    actionNo = (noAction) ? noAction : ()=>{};

    document.getElementById('dialog-overlay').classList.remove('hide');
}

/**
 * Hide dialog from screen
 */
function closeDialog() {
    document.getElementById('dialog-overlay').classList.add('hide');
    document.getElementById('dialog-error').textContent = '';
    document.getElementById('dialog-input').value = '';
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

let actionYes = ()=>{};
let actionNo = ()=>{};
document.getElementById('prompt-yes').addEventListener('click', () => {
    const text = document.getElementById('dialog-input').value.trim();

    if (text.length > 0) {
        actionYes(text);
        closeDialog();
    }
});
document.getElementById('prompt-no').addEventListener('click', () => {
    actionNo();
    closeDialog();
});
document.getElementById('confirmation-yes').addEventListener('click', () => {
    actionYes();
    closeDialog();
});
document.getElementById('confirmation-no').addEventListener('click', () => {
    actionNo();
    closeDialog();
});
document.getElementById('popup-yes').addEventListener('click', () => {
    actionYes();
    closeDialog();
});