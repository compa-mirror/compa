// HTTP response objects modules for Compa
//
// Compa -- worldwide social directory decentralized and federated
// Copyright (C) 2017 Distopico <distopico@riseup.net>
// httpres/index.js is part of Compa.
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


/**
 * Response HTTP code/message with friendly objects
 * @module httpres
 */

const statuses = require("statuses");
const { camelCase } = require("../helpers");

const statusCodes = statuses.STATUS_CODES;

/**
 * HttpsRes main class for HTTP response objects
 * @extends Error
 */
class Httpsres extends Error {

    constructor(err, options = {}) {
        super();

        const { statusCode = 500, data = null, instance = Httpsres } = options;
        let errorInstance;
        let message;

        if (err instanceof Error) {
            errorInstance = err;
            message = options.message || err.message;
        } else {
            message = err;
            errorInstance = message ? new Error(message) : new Error();
        }


        // The stack to external called
        Error.captureStackTrace(errorInstance, instance);
        errorInstance.data = data;
        errorInstance.typeof = instance;
        this.format(errorInstance, statusCode, message);

        if (options.decorate) {
            Object.assign(errorInstance, options.decorate);
        }

        return errorInstance;
    }

    format (error, statusCode, message) {
        let code = parseInt(statusCode, 10);

        if (!code) {
            code = 500;
        }

        if (!error.hasOwnProperty("data")) {
            error.data = null;
        }

        error.code = code;
        error.payload = {
            statusCode: code,
            error: statuses[code] || "Unknown error"
        };

        if (!error.message) {
            error.message = error.payload.error;
        }

        if (this.code === 500) {
            // Hide the internal error from response
            error.payload.message = "Internal server error";
        } else {
            error.payload.message = message || error.message;
        }

        return error;
    }

}

Object.keys(statusCodes).forEach((status) => {
    const method = camelCase(statusCodes[status]);
    const code = Number(status);

    if (code < 400) {
        return;
    }

    Httpsres[method] = function statusMethod(err, data) {
        return new Httpsres(err, { statusCode: code, data: data, instance: Httpsres[method] });
    };
});

module.exports = Httpsres;
