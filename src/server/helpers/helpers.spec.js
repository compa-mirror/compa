// Unit test for helpers module
//
// Compa -- worldwide social directory decentralized and federated
// Copyright (C) 2018 Distopico <distopico@riseup.net>
// helpers/helpers.spec.js is part of Compa.
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

const { expect } = require("chai");
const helpers = require("./");

describe("Test for compa helpers", () => {

    it("should return the helpers", () => {
        expect(helpers).to.be.an("object");
    });
});
