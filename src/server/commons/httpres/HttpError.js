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

const { camelCase } = require("../helpers");
const statusCodes = require("./codes.json");

/**
 * HttpError main class for HTTP error response objects
 * @extends Error
 */
class HttpError extends Error {

    constructor(err, options = {}) {
        let message;
        let stack;

        if (err instanceof Error) {
            ({ stack } = err);
            message = options.message || err.message;
        } else if (err) {
            message = err;
        }

        super(message);

        const { statusCode = 500, data = null, constructor = this.constructor } = options;

        // Keep the our class name
        this.name = this.constructor.name;

        // The stack to external called
        Error.captureStackTrace(this, constructor);
        if (stack) {
            // Keep the original stack if a error instance
            this.stack = `${this.stack}\n${stack}`;
        }
        this.data = data;
        this.format(statusCode, message);

        if (options.decorate) {
            Object.assign(this, options.decorate);
        }
    }

    format (statusCode, message) {
        let code = parseInt(statusCode || this.code, 10);

        if (!code) {
            code = 500;
        }

        if (!this.hasOwnProperty("data")) {
            this.data = null;
        }

        const [ type, status ] = statusCodes[code] || [];

        this.code = code;
        this.type = camelCase(type || "unknown");
        this.payload = {
            statusCode: code,
            error: status || "Unknown error"
        };

        if (!this.message) {
            this.message = this.payload.error;
        }

        if (code === 500) {
            // Hide the internal error from response
            this.payload.message = "Internal server error occurred";
        } else {
            this.payload.message = message || this.message;
        }

        return this;
    }

}

// Extend static methods per status type
Object.keys(statusCodes).forEach((code) => {
    const [ status ] = statusCodes[code];
    const methodType = camelCase(status);
    const codeNumber = Number(code);

    if (code < 400) {
        return;
    }

    Object.defineProperty(HttpError, methodType, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: function statusMethod(err, data) {
            return new HttpError(err, { statusCode: codeNumber, data: data, constructor: HttpError[methodType] });
        }
    });
});

module.exports = HttpError;
