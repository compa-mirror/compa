// Logger utility for compa
//
// Compa -- worldwide social directory decentralized and federated
// Copyright (C) 2017 Distopico <distopico@riseup.net>
// logger.js is part of Compa.
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

const fs = require("fs");
const _ = require("lodash");
const path = require("path");
const Promise = require("bluebird");
const cluster = require("cluster");
const uuid = require("uuid");
const bunyan = require("bunyan");
const fileStreamRotator = require("file-stream-rotator");
const emailStream = require("./emailstream");

//  Private methods
const getLoggerStreams = Symbol("getLoggerStreams");

/**
 * Logger utility class.
 * @module helpers/logger
 */
class Logger {

    /**
     * Initialize the logger configuration.
     * @constructor
     */
    constructor() {
        this.log = null;
        this.weblog = null;
        this.socketlog = null;

        this.ringBuffer = {};
        this.logConfig = {
            name: "compa",
            worker: cluster.worker && cluster.worker.id || 0,
            serializers: {
                req: bunyan.stdSerializers.req,
                res: bunyan.stdSerializers.res,
                err: (err) => {
                    const obj = bunyan.stdSerializers.err(err);
                    // Remove private properties (with underscore)
                    return _.pick(obj, _.filter(_.keys(obj), (key) => {
                        return key[0] !== "_";
                    }));
                },
                data: (data) => {
                    if (data) {
                        // Remove private data
                        return _.omit(data, [ "password" ]);
                    }
                },
                user: (user) => {
                    if (user) {
                        return { id: user.id, type: user.type };
                    }
                    return { id: "<none>" };

                },
                customer: (customer) => {
                    if (customer) {
                        return { token: customer.token, name: customer.name || "<none>" };
                    }
                    return { token: "<none>", name: "<none>" };

                }
            }
        };
    }

    /**
     * Build logger stream configuration by type, for 'file' and 'rotate'
     * additionally save a log for error levels.
     * @private
     * @param {string} type - Supported types are 'file', 'rotate' and 'stream'
     * if it's not specified or is false the stream will disabled
     * @param {object} options - the parameters for define a stream
     * @param {buffer} [options.ringBuffer] - stream Buffer for email stream notifications
     * @param {string} [options.logName] - name of logger instance, default `server`
     * @param {string} [options.name] - compa instance name of alert `emailStream`
     * @param {(boolean|object|string[])} [options.alerts] - if `alerts` is `true` and `alertsEmails` is defined
     * send message with logs to that email, if a object need `alerts.to` property with email string or array,
     * the log level will be send is define with `alerts.level`  or default "warn"
     * @param {object} options.config - server configuration with logger options, see {@link Logger#setup}
     * @returns {object} logger streams configuration
     */
    [getLoggerStreams](type, options = {}) {
        const errorLevel = {
            debug: "warn",
            info: "warn",
            warn: "error",
            error: "fatal",
            fatal: "fatal"
        };
        const { ringBuffer, config = {}, logName = "server" } = options;
        let { loggerLevel = "info" } = options;
        let fileName = `compa-${logName}`;
        let logStream = [];
        let alertsEmails = null;

        if (_.isString(config.loggerDir)) {
            fileName = path.resolve(config.loggerDir, fileName);
        }

        // Convert to level name from number
        if (_.isFinite(loggerLevel)) {
            loggerLevel = bunyan.nameFromLevel[loggerLevel];
        }

        // Check stream type
        if (!type) {
            logStream = [ { path: "/dev/null" } ];
        } else if (type === "file") {
            logStream =  [ {
                path: `${fileName}.log`
            }, {
                level: errorLevel[loggerLevel] || "warn",
                path: `${fileName}.error.log`
            } ];
        } else if (type === "rotate") {
            const rotateConf = {
                frequency: "custom",
                date_format: "YYYY-ww",
                verbose: false
            };

            logStream = [ {
                stream: fileStreamRotator.getStream(_.extend({
                    filename: `${fileName}.%DATE%.log`
                }, rotateConf))
            }, {
                level: errorLevel[loggerLevel] || "warn",
                stream: fileStreamRotator.getStream(_.extend({
                    filename: `${fileName}.%DATE%.error.log`
                }, rotateConf))
            } ];
        } else if (type === "stream") {
            logStream = [ { stream: process.stderr } ];
        }

        // Log level for primary stream
        logStream[0].level = loggerLevel;

        // RingBuffer for email stream
        if (ringBuffer) {
            logStream.push({
                level: loggerLevel,
                type: "raw",
                stream: ringBuffer
            });
        }
        // Logs alerts to email
        if (config.alerts === true && config.contactEmail) {
            alertsEmails = config.contactEmail;
        } else if (_.has(config, "alerts.to")) {
            alertsEmails = config.alerts.to;
        }

        if (alertsEmails) {
            logStream.push({
                type: "raw", // You should use with 'raw' type!
                stream: emailStream({
                    to: alertsEmails,
                    instanceName: config.name,
                    ringBuffer: ringBuffer,
                    address: config.address || config.hostname
                }),
                level: _.get(config, "alerts.level") || "warn"
            });
        }

        return logStream;
    }

    /**
     * Setup bunyan logger instance according configuration,
     * create primary log for all server and logs for components: `access` for express middleware
     * and `socket` for socket.io module.
     * @param {object} config - compa configuration
     * @param {object} config.server - configuration for server with logger options
     * @param {object} [config.server.logger=true] - false is want logger disabled
     * @param {object} [config.server.loggerLevel='info'] - logger level for primary stream
     * @param {object} [config.server.loggerType='stream'] - type of logger stream,
     * available: `file|rotate|stream`, 'rotate' type will rotates logs files every week.
     * @param {object} [config.server.loggerDir] - directory for save logs, required for 'file'|'rotate'
     * @returns {Promise} primary server logger on success
     * @throws {Error} when is `rotate/file` and 'loggerDir' is not string
     */
    setup(config) {
        let streamType = [ "stream", "file", "rotate" ];
        const logConfig = _.clone(this.logConfig, true);
        const logType = {
            access: _.clone(logConfig, true), // Access log for express middleware
            server: _.clone(logConfig, true), // General server log
            socket: _.clone(logConfig, true) // Socket.io log middleware
        };

        return new Promise((resolve, reject) => {

            const servConfig = _.get(config, "server");

            if (_.isEmpty(servConfig)) {
                return reject(new Error("Configuration is required for init Logger"));
            }

            resolve(servConfig);

        }).then((servConfig) => {
            // Set log type
            streamType = servConfig.logger !== false ? streamType[config.loggerType] || "stream" : false;

            if (streamType === "file" || streamType === "rotate") {
                if (!_.isString(servConfig.loggerDir)) {
                    throw new Error(
                        "Logger with type 'file' or 'rotate' required 'loggerDir' option with a string path"
                    );
                }

                // Ensure log path exists
                const access = Promise.promisify(fs.access);

                return access(servConfig.loggerDir, fs.W_OK || fs.constants.W_OK).then(() => {
                    return servConfig;
                });
            }

            return servConfig;

        }).then((servConfig) => {
            // Ring buffer for email stream notifications
            if (servConfig.logger !== false) {
                this.ringBuffer = new bunyan.RingBuffer({ limit: 10 });
            }

            // Set config by logType
            _.each(logType, (conf, type) => {
                logType[type].name = `${logConfig.name}-${type}`;

                logType[type].streams = this[getLoggerStreams](streamType, {
                    config: _.extend({}, servConfig, _.get(config, "instance")),
                    logName: type,
                    ringBuffer: this.ringBuffer
                });
            });

            // Create new logger bunyan by type
            this.log = bunyan.createLogger(logType.server);
            this.weblog = bunyan.createLogger(logType.access);
            this.socketlog = bunyan.createLogger(logType.socket);

            // Return general log
            return this.log;
        });
    }

    /**
     * Get Intence of Logger.
     * @param {string} [type] - The logger type that needs to be returned,
     * available types: 'server' (default), 'access' and 'socket'
     * @returns {object} buyan logger instance
     */
    get(type) {
        const logType = {
            server: this.log,
            access: this.weblog,
            socket: this.socketlog
        };

        return type && logType[type] ? logType[type] : this.log;
    }

    /**
     * Logger middleware for Express server requests.
     * @returns {function} logger request middleware
     */
    accessLogger() {
        return (req, res, next) => {
            const { end } = res;
            const weblog = this.weblog.child({ "req_id": uuid.v4(), component: "web" });
            const startTime = Date.now();

            req.log = weblog;
            res.end = (chunk, encoding) => {
                let info = {};

                res.end = end;
                res.end(chunk, encoding);
                info = { req: req, res: res, serverTime: Date.now() - startTime };

                if (_.has(req, "user")) {
                    info.user = req.user;
                }
                if (_.has(req, "customer")) {
                    info.customer = req.customer;
                }
                weblog.info(info);
            };
            next();
        };
    }

    /**
     * Logger middleware for socket.io requests.
     * @returns {function} logger request middleware
     */
    socketLogger() {
        return (io, next) => {
            const startTime = Date.now();
            const socketlog = this.socketlog.child({ "req_id": uuid.v4(), component: "socket" });
            const req = io.request;
            const { res } = req;
            let info = {};

            io.log = this.log;
            req.log = socketlog;
            info = { req: req, res: res, serverTime: Date.now() - startTime };
            socketlog.info(info);
            next();
        };
    }

    /**
     * Get last bunyan records if 'logger' option is true.
     * @returns {object} record data
     */
    records() {
        return this.ringBuffer.records;
    }
}

// Exports
module.exports = new Logger();
