/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

 function i18nParse() {
    const elements = document.querySelectorAll('[data-i18n]');
    for (const element of elements) {
        const placeholders = [];

        if (element.dataset.i18nPlaceholders) {
            for (const placeholder of element.dataset.i18nPlaceholders.split(',')) {
                placeholders.push(
                    browser.i18n.getMessage(placeholder.trim())
                );
            }
        }

        element.textContent = browser.i18n.getMessage(element.dataset.i18n, placeholders);
    }
}