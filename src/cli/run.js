// CLI library for run/start compa server
//
// Compa -- worldwide social directory decentralized and federated
// Copyright (C) 2017 Distopico <distopico@riseup.net>
// run.js is part of Compa.
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

const os = require("os");
const fs = require("fs");
const path = require("path");
const Promise = require("bluebird");
const CompaServer  = require("../server/compa");
const { defaults, helpers }  = require("../server/commons");
const print = require("./print");

const { cloneDeep, defaultsDeep, remove }  = helpers;

/**
 * CLI command for run/start Compa server.
 * @module cli/run
 */
class Run {

    /**
     * Set required properties for 'yargs' command.
     * @constructor
     */
    constructor() {
        this.command = "run";
        this.describe = "Start compa app";

        // Re asigns instance for prevent error with yags
        this.builder = this.builder.bind(this);
        this.handler = this.handler.bind(this);
    }

    /**
     * Setup the command, if no pass `-c` option the default configurations
     * files will be ["/etc/compa.json" and "~/.compa.json"],
     * all parameters can be set in the environment variable 'COMPA_'.
     * @param {Yags} argv - instance of 'Yags' for setup command
     * @returns {Yags} command instance extended
     */
    builder(argv) {
        const defaultConfig = [ "/etc/compa.json" ];

        if (process.env.HOME) {
            defaultConfig.push(path.join(process.env.HOME, ".compa.json"));
        }

        argv.usage("Usage: -c <configfile>")
            .alias("c", "config")
            .default("c", defaultConfig, "/etc/compa.json or ~/.compa.json")
            .string("c")
            .env("COMPA")
            .number([ "port" ]);

        return argv;
    }

    /**
     * When the command is called get configuration and run compa server.
     * @param {object} argv - parameters already parse
     */
    handler(argv) {
        if (argv.config) {
            this.getConfig(argv.config).then((configData) => {
                let config = cloneDeep(configData);

                config = defaultsDeep(config, defaults);

                const server = new CompaServer(config);

                return server.create().then(() => {
                    print.info("Compa server runs successfully");
                });
            }).catch((err) => {
                print.error(err);
                process.exitCode = 1;
            });
        }
    }

    /**
     * Get and parse configuration file/files from JSON.
     * @param {(string|string[])} filename - full path of file will parsed
     * @returns {Promise} on success run configuration object
     * @throws {Error} will throw an error if the JSON is invalid
     */
    getConfig(filename) {
        const config = {};
        const errors = [];
        let files;

        if (Array.isArray(filename)) {
            files = filename;
        } else {
            files = [ filename ];
        }

        return Promise.map(files, (file) => {
            const promise = new Promise((resolve, reject) => {
                fs.readFile(file, (err, raw) => {
                    if (err) {
                        errors.push(err.message);
                    }

                    if (files.length === errors.length) {
                        reject(new Error(errors.join(os.EOL)));
                    } else {
                        resolve(raw || null);
                    }
                });
            });

            return promise;
        }).then((filesRaw) => {
            // Remove null for get last available file
            remove(filesRaw, (value) => {
                return value === null;
            });

            return filesRaw;
        }).all().then((raw) => {
            try {
                return Object.assign(config, JSON.parse(raw));
            } catch (err) {
                throw new Error(`Error parsing JSON configuration: ${err.toString()}, Please validate your JSON file.`);
            }
        });
    }

}

module.exports = new Run();
