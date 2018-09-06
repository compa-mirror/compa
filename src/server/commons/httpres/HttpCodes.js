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
class HttpCodes {

    constructor() {
        this.statuses = {};
        this.types = {};

        Object.keys(statusCodes).forEach((code) => {
            const [ status ] = statusCodes[code];
            const methodType = camelCase(status);

            this.statuses[status] = code;
            this.types[status] = methodType;
        });
    }

}

module.exports = HttpCodes;
