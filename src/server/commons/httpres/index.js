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

/**
 * HttpsRes main class for HTTP response objects
 * @extends Error
 */
class Httpsres extends Error {

    static [Symbol.hasInstance](instance) {

        return internals.Boom.isBoom(instance);
    }

    constructor(message, options = {}) {
        super();

        if (message instanceof Error) {
            return internals.Boom.boomify(Hoek.clone(message), options);
        }

        const { statusCode = 500, data = null, ctor = internals.Boom } = options;
        const error = new Error(message ? message : undefined);         // Avoids settings null message
        Error.captureStackTrace(error, ctor);                           // Filter the stack to our external API
        error.data = data;
        internals.initialize(error, statusCode);
        error.typeof = ctor;

        if (options.decorate) {
            Object.assign(error, options.decorate);
        }

        return error;
    }
}

module.exports = Httpsres;
