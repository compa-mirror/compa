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
const Server = require("../../compa");
const defaults = require("../defaults");
const logger = require("./");

let mockConfig = _.cloneDeep(defaults);
let appServer = {};

describe("Logger helper", () => {

    afterEach(() => {
        mockConfig = _.cloneDeep(defaults);
    });

    it("should return the helpers", () => {
        expect(logger).to.be.an("object");
    });

    it("should reject with error on setup with empty configuration", () => {
        return expect(logger.setup()).to.be.rejectedWith(Error);
    });

    it("should reject with error with logger type 'file' without 'loggerDir'", () => {
        mockConfig.server.loggerType = "file";
        mockConfig.server.loggerDir = null;

        return expect(logger.setup(mockConfig)).to.be.rejectedWith(Error);
    });

    it("should have empty ring buffer when logger option is false", (done) => {
        mockConfig.server.logger = false;

        logger.setup(mockConfig).then((log) => {
            expect(log).nested.include({ "fields.name": "compa-server" });
            expect(logger.records()).to.be.an("undefined");
            done();
        }).catch(done);
    });

    describe("Logger helper disabled with server runing", () => {
        before(() => {
            mockConfig.server.logger = false;
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

        it("should return the default logger and empty records", () => {
            const log = logger.get();
            const records = logger.records();

            expect(log).to.be.an("object");
            expect(log).to.nested.include({ "fields.name": "compa-server" });
            expect(records).to.be.an("undefined");
        });
    });

    describe("Logger helper enabled with server runing", () => {
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
            const log = logger.get("access");

            expect(log).to.be.an("object");
            expect(log).to.nested.include({ "fields.name": "compa-access" });
        });

        it("should return the default logger type", () => {
            const log = logger.get();

            expect(log).to.be.an("object");
            expect(log).to.nested.include({ "fields.name": "compa-server" });
        });
    });
});
