// Send email logs
//
// Compa -- worldwide social directory decentralized and federated
// Copyright (C) 2017 Distopico <distopico@riseup.net>
// emailStream.js is part of Compa.
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

const util = require("util");
const stream = require("stream");
const bunyan = require("bunyan");
const { get, truncate } = require("../helpers");
const mailer = require("./");

const Stream = stream.Writable || stream.Stream;
const transport = new WeakMap();

/**
 * Stream to send emails with logs
 * @module helpers/emailstream
 */
class EmailStream {

    /**
     * Create stream, define options and set mailer transport
     * @constructor
     * @param {object} config - an locals and configuration for send emails
     * @param {(string|string[])} config.to - the emails/emails to send message with logs
     * @param {string} [config.instanceName=log.hostname] - the Compa instance name for subject
     * @param {buffer} [config.ringBuffer] - ring buffer instance with last records
     * @param {string} [config.address] - an IP or domain to identify the logs, useful when run
     * multiples instances over same machine
     */
    constructor(config) {
        Stream.call(this);

        this.config = Object.assign({
            to: [],
            instanceName: null,
            ringBuffer: null,
            address: null
        }, config);

        if (typeof config.to === "string") {
            this.config.to = [ config.to ];
        }

        this.writable = true;
        transport.set(this, mailer.transport);
    }

    /**
     * Send a email when write a log according the level setup,
     * also send last records in `ringBuffer`
     * @param {object} log - an object data with information as level/hostname/msg etc
     */
    write(log) {
        const { config } = this;

        if (config.to && config.to.length && log.component !== "mail") {
            const levelName = bunyan.nameFromLevel[log.level] || `LEVEL_${log.level}`;

            // Send email
            mailer.send("emailog", {
                to: config.to,
                subject: util.format(
                    "[%s] Exception in Compa: %s From %s in %s(%s)",
                    levelName,
                    truncate((get(log, "err.message") || log.msg), 30),
                    (config.instanceName || log.hostname),
                    log.hostname,
                    config.address
                ),
                error: log.err || log,
                records: (config.ringBuffer && config.ringBuffer.records || {}),
                enviroment: (process.env.NODE_ENV || "NO_ENV").toUpperCase()
            });
        }
    }

    /**
     * Close transport when stream ends
     */
    end() {
        const _transport = transport.get(this);

        if (_transport) {
            _transport.close();
        }
    }

}

util.inherits(EmailStream, Stream);

module.exports = EmailStream;
