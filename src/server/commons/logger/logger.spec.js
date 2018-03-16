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

const os = require("os");
const path = require("path");
const sinon = require("sinon");
const Promise = require("bluebird");
const { mkdirp } = require("fs-extra");
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
        assert.isObject(logger);
    });

    it("should reject with error on setup with empty configuration", () => {
        return assert.isRejected(logger.setup(), Error);
    });

    it("should have empty ring buffer when logger option is false", () => {
        mockConfig.server.logger = false;
        const promise = logger.setup(mockConfig).then((log) => {
            assert.isUndefined(logger.records());

            return log;
        });

        return Promise.all([
            assert.isFulfilled(promise),
            assert.eventually.nestedInclude(promise, { "fields.name": "compa-server" }),
            assert.eventually.nestedInclude(promise, { "streams[0].path": "/dev/null" }),
            assert.eventually.nestedInclude(promise, { "streams[0].level": 30 })
        ]);
    });

    it("should use logger type stream when a wrong type is set", () => {
        mockConfig.server.loggerType = "test";
        const promise = logger.setup(mockConfig);

        return Promise.all([
            assert.eventually.nestedInclude(promise, { "fields.name": "compa-server" }),
            assert.eventually.nestedInclude(promise, { "streams[0].type": "stream" })
        ]);
    });

    it("should use default logger level info when is unset", () => {
        mockConfig.server.loggerLevel = undefined;
        const promise = logger.setup(mockConfig);

        return assert.eventually.nestedInclude(promise, { "streams[0].level": 30 });
    });

    it("should work with loggerLevel number", () => {
        mockConfig.server.loggerLevel = 20;
        const promise = logger.setup(mockConfig);

        return assert.eventually.nestedInclude(promise, { "streams[0].level": 20 });
    });

    it("should configure the email stream when alerts is true and have contactEmail", () => {
        mockConfig.server.alerts = true;
        mockConfig.instance.contactEmail = "test@email.com";
        const promise = logger.setup(mockConfig).then((log) => {
            assert.isArray(logger.records());

            return log;
        });

        return Promise.all([
            assert.isFulfilled(promise),
            assert.eventually.nestedInclude(promise, { "streams[1].level": 30 }),
            assert.eventually.nestedInclude(promise, { "streams[2].level": 40 }),
            assert.eventually.nestedInclude(promise, { "streams[2].type": "raw" })
        ]);
    });

    it("should configure the email stream when alerts object with emails", () => {
        mockConfig.server.alerts = { to: "test@email.com" };
        const promise = logger.setup(mockConfig);

        return Promise.all([
            assert.eventually.nestedInclude(promise, { "streams[2].type": "raw" }),
            assert.eventually.nestedInclude(promise, { "streams[2].level": 40 })
        ]);
    });

    it("should reject with error when logger type is 'file' without 'loggerDir'", () => {
        mockConfig.server.loggerType = "file";
        mockConfig.server.loggerDir = null;

        return assert.isRejected(logger.setup(mockConfig), Error);
    });

    it("should reject when logger type is 'file' with wrong 'loggerDir'", () => {
        mockConfig.server.loggerType = "file";
        mockConfig.server.loggerDir = "path/not-exist";

        return assert.isRejected(logger.setup(mockConfig), Error);
    });

    it("should have success setup when logger type is 'file'", () => {
        const loggerDir = path.join(os.tmpdir(), "compa-log-test", `${Date.now()}`);

        mockConfig.server.loggerType = "file";
        mockConfig.server.loggerDir = loggerDir;
        const promise = mkdirp(loggerDir).then(() => {
            return logger.setup(mockConfig);
        });

        return Promise.all([
            assert.eventually.nestedInclude(promise, { "streams[1].type": "file" }),
            assert.eventually.nestedInclude(promise, { "streams[1].level": 40 }),
            assert.eventually.nestedInclude(promise, {
                "streams[0].path": path.join(loggerDir, "compa-server.log")
            })
        ]);
    });

    it("should set default error level when type is 'file' and level is undefined", () => {
        const loggerDir = path.join(os.tmpdir(), "compa-log-test", `${Date.now()}`);

        mockConfig.server.loggerType = "file";
        mockConfig.server.loggerLevel = undefined;
        mockConfig.server.loggerDir = loggerDir;
        const promise = mkdirp(loggerDir).then(() => {
            return logger.setup(mockConfig);
        });

        return assert.eventually.nestedInclude(promise, { "streams[1].level": 40 });
    });

    it("should have success setup when logger type is 'rotate'", () => {
        const loggerDir = path.join(os.tmpdir(), "compa-log-test", `${Date.now()}`);

        mockConfig.server.loggerType = "rotate";
        mockConfig.server.loggerDir = loggerDir;
        const promise = mkdirp(loggerDir).then(() => {
            return logger.setup(mockConfig);
        });

        return Promise.all([
            assert.eventually.nestedInclude(promise, { "streams[0].level": 30 }),
            assert.eventually.nestedInclude(promise, { "streams[1].level": 40 }),
            assert.eventually.nestedInclude(promise, { "streams[0].type": "stream" }),
            assert.eventually.nestedInclude(promise, { "streams[1].type": "stream" })
        ]);
    });

    describe("Logger helper enabled with server runing", () => {
        before(() => {
            // Remove logs from mocha
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

        it("should return the logger by type", () => {
            const log = logger.get("access");

            assert.isObject(log, "object");
            assert.nestedInclude(log, { "fields.name": "compa-access" });
        });

        it("should return the default logger type", () => {
            const log = logger.get();

            assert.isObject(log, "object");
            assert.nestedInclude(log, { "fields.name": "compa-server" });
        });

        it("should serialize correctly the error object", () => {
            const log = logger.get();
            const errSpy = sinon.spy(log.serializers, "err");

            log.warn({ err: { _private: "value", status: 500 } });
            assert.isTrue(errSpy.calledOnce);
            assert.deepEqual(errSpy.returnValues[0], { status: 500 });
            errSpy.restore();
        });

        it("should serialize correctly the data object", () => {
            const log = logger.get();
            const dataSpy = sinon.spy(log.serializers, "data");

            log.info({ data: { password: "value", name: "ami" } });
            assert.isTrue(dataSpy.calledOnce);
            assert.deepEqual(dataSpy.returnValues[0], { name: "ami" });
            dataSpy.restore();
        });

        it("should not serialize data object when is empty", () => {
            const log = logger.get();
            const dataSpy = sinon.spy(log.serializers, "data");

            log.info({ data: null });
            assert.isTrue(dataSpy.calledOnce);
            assert.equal(dataSpy.returnValues[0], undefined);
            dataSpy.restore();
        });

        it("should serialize correctly the user object", () => {
            const log = logger.get();
            const userData = {
                id: 23,
                name: "ami",
                type: "remote"
            };
            const userSpy = sinon.spy(log.serializers, "user");

            log.info({ user: userData });
            assert.isTrue(userSpy.calledOnce);
            assert.deepEqual(userSpy.returnValues[0], _.omit(userData, "name"));
            userSpy.restore();
        });

        it("should not serialize user object when is empty", () => {
            const log = logger.get();
            const userSpy = sinon.spy(log.serializers, "user");

            log.info({ user: null });
            assert.isTrue(userSpy.calledOnce);
            assert.deepEqual(userSpy.returnValues[0], { id: "<none>" });
            userSpy.restore();
        });

        it("should serialize correctly the consumer object", () => {
            const log = logger.get();
            const consumerData = {
                token: "public_token",
                secret: "secret_token",
                name: "remote app"
            };
            const consumerSpy = sinon.spy(log.serializers, "consumer");

            log.info({ consumer: consumerData });
            assert.isTrue(consumerSpy.calledOnce);
            assert.deepEqual(consumerSpy.returnValues[0], _.omit(consumerData, "secret"));
            consumerSpy.restore();
        });

        it("should serialize correctly the consumer object without app name", () => {
            const log = logger.get();
            const consumerData = {
                token: "public_token",
                secret: "secret_token"
            };
            const consumerSpy = sinon.spy(log.serializers, "consumer");

            log.info({ consumer: consumerData });
            assert.isTrue(consumerSpy.calledOnce);
            assert.deepEqual(consumerSpy.returnValues[0], {
                name: "<none>",
                token: "public_token"
            });
            consumerSpy.restore();
        });

        it("should not serialize consumer object when is empty", () => {
            const log = logger.get();
            const consumerSpy = sinon.spy(log.serializers, "consumer");

            log.info({ consumer: null });
            assert.isTrue(consumerSpy.calledOnce);
            assert.deepEqual(consumerSpy.returnValues[0], {
                token: "<none>",
                name: "<none>"
            });
            consumerSpy.restore();
        });
    });
});
