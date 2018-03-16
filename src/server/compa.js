// Main input for compa server
//
// Compa -- worldwide social directory decentralized and federated
// Copyright (C) 2017 Distopico <distopico@riseup.net>
// compa.js is part of Compa.
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

const fs = require("fs");
const http = require("http");
const https = require("https");
const express = require("express");
const Promise = require("bluebird");
const sslConfig = require("ssl-config");
const { logger, mailer } = require("./commons");


/**
 * Compa server with support http/https.
 */
class CompaServer {

    /**
     * Initialize express instance and set server configuration.
     * @param {object} config - compa configuration
     */
    constructor(config) {
        this.config = config;
        this.app = express();
    }

    /**
     * Create and setup all server requirements.
     * @returns {Promise} on success return express/server instance
     */
    create() {
        const { app, config: { server: confServer } } = this;
        const { port, hostname } = confServer;
        const address = confServer.address || hostname;
        let log;

        return new Promise((resolve, reject) => {
            if (process.getuid && port < 1024 && process.getuid() !== 0) {
                return reject(new Error(
                    "Can't listen ports lower than 1024 on POSIX systems unless you're root"
                ));
            }

            resolve();
        }).then(() => {
            return logger.setup(this.config);
        }).then((logInstance) => {
            log = logInstance;
            app.use(logger.accessMiddleware());

            return mailer.setup(this.config, log);
        }).then(() => {
            if (confServer.key && confServer.cert) {
                const readFile = Promise.promisify(fs.readFile);
                const key = readFile(confServer.key);
                const cert = readFile(confServer.cert);

                return [ key, cert ];
            }

            return [];
        }).spread((key, cert) => {
            if (key && cert) {
                const ssl = sslConfig("intermediate");

                // TODO: bounce?
                return https.createServer({
                    key: key,
                    cert: cert,
                    ciphers: ssl.ciphers,
                    honorCipherOrder: true,
                    secureOptions: ssl.minimumTLSVersion
                }, app);
            }

            return http.createServer(app);
        }).then((appServer) => {
            return Promise.fromCallback((callback) => {
                appServer.listen(port, address, () => {
                    log.info("Listening Compa on %s:%s", address, port);
                    callback(null, { server: appServer, app: app });
                });
            });
        });
    }

}

module.exports = CompaServer;
