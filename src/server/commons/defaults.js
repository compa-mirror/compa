// Default configuration for Compa
//
// Compa -- worldwide social directory decentralized and federated
// Copyright (C) 2017 Distopico <distopico@riseup.net>
// defaults.js is part of Compa.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as
// published by the Free Software Foundation, either version 3 of the
// License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.

"use strict";

const path = require("path");

/**
 * All available configuration properties, for some properties the default value
 * will be defined when the application starts, this is only for reference.
 * @module defaults
 */
const defaults = {
    instance: {
        name: "Compa",
        maintainer: null,
        maintainerUrl: null,
        contactEmail: null
    },
    server: {
        port: 1204,
        hostname: "127.0.0.1",
        address: null,
        secret: "keep it in secret",
        key: null,
        cert: null,
        logger: true,
        loggerLevel: "info",
        loggerType: "stream",
        loggerDir: null,
        alerts: false,
        dataDir: "/var/local/compa",
        enableUploads: true,
        serverUser: null,
        serverGroup: null,
        proxy: null,
        compress: false
    },
    database: {
        adapter: "memory"
    },
    mailer: {
        host: null,
        port: 25,
        user: null,
        pass: null,
        useSSL: false,
        useTLS: true,
        timeout: 30000,
        hostname: null,
        verbose: false
    },
    webapp: {
        enable: true,
        debug: false,
        favicon: path.resolve(__dirname, "../public/images/favicon.ico")
    }
};

module.exports = defaults;
