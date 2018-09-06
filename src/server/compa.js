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
const has = require("lodash/has");
const express = require("express");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const methodOverride = require("method-override");
const compression = require("compression");
const Promise = require("bluebird");
const sslConfig = require("ssl-config");
const { logger } = require("./commons");
const { mailer } = require("./core");
const { HttpError } = require("./commons/httpres");
const boom = require("boom");
var errTest = new Error('test err');
var errTest2 = new Error('test err2');

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
        const { app, config } = this;
        const { server: confServer } = config;
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
            // Setup logger
            return logger.setup(this.config);
        }).then((logInstance) => {
            log = logInstance;
            log.info("Initializing Compa server");
            app.use(logger.accessMiddleware());

            // Setup email
            if (has(config, "mailer.host")) {
                return mailer.setup(config, log);
            }

            return Promise.resolve();
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

                log.debug("Run over HTTPS server");

                // TODO: bounce?
                return https.createServer({
                    key: key,
                    cert: cert,
                    ciphers: ssl.ciphers,
                    honorCipherOrder: true,
                    secureOptions: ssl.minimumTLSVersion
                }, app);
            }
            log.debug("Run over HTTP server");

            return http.createServer(app);
        }).then((appServer) => {
            // Proxy
            app.set("trust proxy", confServer.proxy || false);

            // Body parse
            app.use(bodyParser.urlencoded({ extended: true }));
            app.use(bodyParser.json());

            // Some middlewares
            app.use(methodOverride());
            app.use(cookieParser());
            // TODO: app.use(sessionMiddleware);
            app.use(express.query()); // TODO: for what?
            // app.use(app.isMalformed());
            if (confServer.compress) {
                app.use(compression());
            }

            // Secure policy
            app.use(helmet({
                dnsPrefetchControl: false,
                hidePoweredBy: { setTo: "Compa" }
            }));
            // CpsApp.use(helmet.contentSecurityPolicy()); TODO: CSP implement

            return Promise.fromCallback((callback) => {
                //console.log(httpres.badRequest('test', {data: 'algo'}));
                console.log(errTest.stack);
                var test = new HttpError('test');
                var test2 = new HttpError(errTest);
                console.log(test);
                console.log(test.name);
                console.log(test instanceof Error);
                console.log(test instanceof HttpError);
                console.log(test.stack);
                console.log(test2);
                console.log(test2.stack);
                console.log(test.format);
                console.log(test.getTest);
                console.log(HttpError.badRequest('a bad request', {test: 'algo'}));
                console.log(HttpError.badRequest('a bad request', {test: 'algo'}).constructor);
                console.log(typeof HttpError.badRequest('a bad request', {test: 'algo'}));
                var test3 = new boom('test');
                var test4 = new boom(errTest2);
                console.log(test3);
                console.log(test3.name);
                console.log(test3.stack);
                console.log(test4);
                console.log(test4.stack);
                console.log(boom.badRequest('a bad request', {test: 'algo'}));
                console.log(boom.badRequest('a bad request', {test: 'algo'}).constructor);
                console.log(typeof boom.badRequest('a bad request', {test: 'algo'}));
                console.log(HttpError);
                console.log(boom);
                appServer.listen(port, address, () => {
                    log.info("Listening Compa on %s:%s", address, port);
                    callback(null, { server: appServer, app: app });
                });
            });
        });
    }

}

module.exports = CompaServer;
