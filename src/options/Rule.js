/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/. */

class Rule {
    constructor(profile, domain, includeSubdomains) {
        this.profile = profile;
        this.domain = domain;
        this.includeSubdomains = includeSubdomains;
    }

    fullDomain() {
        return (this.includeSubdomains) ? '*.' + this.domain : this.domain;
    }

    displayDomain() {
        if (this.includeSubdomains) {
            return `${this.domain} (${browser.i18n.getMessage('subdomainsOnly')})`;
        } else {
            return this.domain;
        }
    }
}