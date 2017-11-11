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
const _ = require("lodash");
const Promise = require("bluebird");
const console = require("better-console");

class Run {

    constructor() {
        this.command = "run";
        this.describe = "Start compa app";

        // Re asigns instance for prevent error with yags
        this.builder = this.builder.bind(this);
        this.handler = this.handler.bind(this);
    }

    builder(argv) {
        const defaultConfig = ["/etc/compa.json"];

        if (process.env.HOME) {
            defaultConfig.push(path.join(process.env.HOME, ".compa.json"));
        }

        argv.usage("Usage: -c <configfile>")
            .alias("c", "config")
            .default("c", defaultConfig, "/etc/compa.json or ~/.compa.json")
            .string("c")
            .env("COMPA")
            .number(["port"]);

        return argv;
    }

    handler(argv) {

        if (argv.config) {
            this.getConfig(argv.config).then((config) => {
                argv = _.extend(config, argv);

            }).catch((err) => {
                console.error(_.has(err, "message") ? err.message : err);
                process.exitCode = 1;
            });
        }
    }

    getConfig(filename) {
        const config = {};
        const errors = [];
        let files;

        if (_.isArray(filename)) {
            files = filename;
        } else {
            files = [filename];
        }

        return Promise.map(files, (file) => {

            const promise = new Promise((resolve, reject) => {
                fs.readFile(file, (err, raw) => {
                    if (err) {
                        errors.push(err.message);
                    }

                    if (files.length == errors.length) {
                        reject(errors.join(os.EOL));
                    } else {
                        resolve(raw || null);
                    }

                });
            });

            return promise;
        }).then((filesRaw) => {

            _.remove(filesRaw, _.isNull);
            return filesRaw;
        }).all().then((raw) => {

            try {
                _.extend(config, JSON.parse(raw));

                return config;
            } catch (err) {
                throw new Error(`Error parsing JSON configuration: ${err.toString()}, Please validate your JSON file.`);
            }
        });
    }
}

module.exports = new Run();
