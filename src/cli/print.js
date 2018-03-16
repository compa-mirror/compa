// Print in console utility for compa CLI
//
// Compa -- worldwide social directory decentralized and federated
// Copyright (C) 2017 Distopico <distopico@riseup.net>
// print.js is part of Compa.
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

const _ = require("lodash");
const console = require("better-console");

/**
 * Console/print utility, inherits the same "better-console" method.
 * @module cli/print
 */
const print = _.clone(console);

/**
 * Add additionally behavior for `better-console` in error levels,
 * when `NODE_ENV` if different to 'development' or 'test' only show the error message,
 * in debug mode (development|test) shows stack error.
 * @private
 * @param {string} method - console method for send
 * @param {object[]} args - called arguments
 */
const logError = (method, args) => {
    const isDebug = process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development";
    let stack = null;

    if (!_.isArray(args)) {
        console[method].apply(this, args);

        return;
    }

    for (let i = 0; i < args.length; i++) {
        const value = args[i];

        // Show only error message in production
        if (!isDebug && (value instanceof Error)) {
            args[i] = value.message;
            continue;
        }

        // Show error stack only in debug mode
        if (isDebug && _.has(value, "stack")) {
            ({ stack } = value);
        }
    }

    console[method].apply(this, args);

    if (stack) {
        console.log(stack);
    }
};

/**
 * Extend `error` level with custom behavior in "debug" mode
 * @param {...(string|object|number)} args - called arguments
 */
print.error = (...args) => {
    logError("error", args);
};

/**
 * Extend `warn` level with custom behavior in "debug" mode
 * @param {...(string|object|number)} args called arguments
 */
print.warn = (...args) => {
    logError("warn", args);
};

module.exports = print;
