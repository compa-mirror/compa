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

const _ = require("lodash");
const Server = require("../compa");
const defaults = require("./defaults");
const helpers = require("./");

let mockConfig = _.cloneDeep(defaults);
let appServer = {};

describe("Test for compa helpers", () => {

    it("should return the helpers", () => {
        expect(helpers).to.be.an("object");
    });
});

describe("Logger helper", () => {

    afterEach(() => {
        mockConfig = _.cloneDeep(defaults);
    });

    it("should reject with error on setup with empty configuration", () => {
        const { logger } = helpers;

        return expect(logger.setup()).to.be.rejectedWith(Error);
    });

    it("should have empty ring buffer when logger option is false", (done) => {
        const { logger } = helpers;
        mockConfig.server.logger = false;

        logger.setup(mockConfig).then((log) => {
            expect(log).nested.include({ "fields.name": "compa-server" });
            expect(logger.records()).to.be.an("undefined");
            done();
        }).catch(done);
    });

    describe("Logger helper with server runing", () => {
        before(() => {
            const compa = new Server(mockConfig);

            return compa.create().then((instance) => {
                appServer  = instance.server;
                return instance;
            });
        });

        after((done) => {
            if (appServer.close) {
                appServer.close(done);
            } else {
                done();
            }
        });

        it("should return the logger by type", () => {
            const { logger } = helpers;
            const log = logger.get("access");

            expect(log).to.be.an("object");
            expect(log).to.nested.include({ "fields.name": "compa-access" });
        });

        it("should return the default logger type", () => {
            const { logger } = helpers;
            const log = logger.get();

            expect(log).to.be.an("object");
            expect(log).to.nested.include({ "fields.name": "compa-server" });
        });
    });
});
