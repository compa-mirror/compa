// Helpers for compa
//
// Compa -- worldwide social directory decentralized and federated
// Copyright (C) 2017 Distopico <distopico@riseup.net>
// helpers/index.js is part of Compa.
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

const has = require("lodash/has");
const get = require("lodash/get");
const omit = require("lodash/omit");
const pick = require("lodash/pick");
const clone = require("lodash/clone");
const cloneDeep = require("lodash/cloneDeep");
const defaults = require("lodash/defaults");
const defaultsDeep = require("lodash/defaultsDeep");
const remove = require("lodash/remove");
const isEmpty = require("lodash/isEmpty");
const isPlainObject = require("lodash/isPlainObject");
const truncate = require("lodash/truncate");

/**
 * The all available helpers
 * only export the Lodash methods allowed and more used
 * @module helpers
 */
const helpers = {
    has,
    get,
    omit,
    pick,
    clone,
    cloneDeep,
    defaults,
    defaultsDeep,
    remove,
    isEmpty,
    isPlainObject,
    truncate
};

module.exports = helpers;
