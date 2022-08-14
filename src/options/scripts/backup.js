/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

/**
 * Save Storage API backup (requires permission)
 */
function saveBackup() {
    showProgressBar(true);

    browser.permissions.request({
        permissions: ['downloads']
    }, (granted) => {
        if (granted) {
            browser.storage.local.get((data) => {
                const file = new Blob([JSON.stringify(data)], {
                    type: 'application/json'
                });
                const fileURL = URL.createObjectURL(file);

                browser.downloads.download({
                    filename: `custom-scrollbars-backup-${Date.now()}.json`,
                    saveAs: true,
                    url: fileURL
                }, () => {
                    showProgressBar(false);
                });
            });
        } else {
            console.error('Missing persmission to manage downloads');
            showAlert(browser.i18n.getMessage('dialogPermissionRequired'), null, null);
            showProgressBar(false);
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
    showProgressBar(true);
    const fileInput = document.getElementById('restore-file');

    if (fileInput.files.length == 1) {
        const reader = new FileReader();
        reader.onload = processBackupFile;
        reader.readAsText(fileInput.files[0]);
    } else {
        showProgressBar(false);
    }
}

/**
 * Restore the applied file into the Storage API
 * @param {Event} event
 */
function processBackupFile(event) {
    let data;

    // Parse file contents into JSON object
    try {
        data = JSON.parse(event.target.result);
    } catch (error) {
        console.error('File is not in JSON format');
        showAlert(
            browser.i18n.getMessage('dialogInvalidBackup'),
            clearFile,
            null
        );
        showProgressBar(false);
        return;
    }

    // Verify integrity of file data
    if (!data.schema || !data.defaultProfile || !data[`profile_${data.defaultProfile}`]) {
        if (!data.schema) console.error('File missing schema marker');
        if (!data.defaultProfile) console.error('File missing default scrollbar marker');
        else if (!data[`profile_${data.defaultProfile}`]) console.error('File missing default scrollbar');

        showAlert(
            browser.i18n.getMessage('dialogInvalidBackup'),
            clearFile,
            null
        );
        showProgressBar(false);
        return;
    }

    // Overwrite Storage API with data from file
    browser.storage.local.clear(() => {
        browser.storage.local.set(data, () => {
            showAlert(
                browser.i18n.getMessage('dialogBackupRestored'),
                () => {
                    window.location.replace('scrollbars.html');
                },
                null
            );
            showProgressBar(false);
        });
    });
}

clearFile();
getDefaultScrollbar();
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
