// Mailer configuration, functions, render template etc
//
// Compa -- worldwide social directory decentralized and federated
// Copyright (C) 2017 Distopico <distopico@riseup.net>
// mailer/index.js is part of Compa.
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
const path = require("path");
const juice = require("juice");
const htmlToText = require("html-to-text");
const Promise = require("bluebird");
const nodemailer = require("nodemailer");
const Vue = require("vue");
const { createRenderer } = require("vue-server-renderer");
const { pick, omit, remove, isEmpty, isPlainObject } = require("../../commons/helpers");

/**
 * Send and render email with templates with theme support,
 * @module mailer
 */
class Mailer {

    /**
     * Define the basic parameters fro mailer instance
     * @constructor
     */
    constructor() {
        this.log = null;
        this.theme = null;
        this.from = null;
        this.subject = null;
        this.transport = null;
        this.templateOpts = null;
        this.templatesPath = null;
    }

    /**
     * Setup transport and renderer, for transports currently only support `SMTP`,
     * by default the template path is `views/email` but can be customized by `theme` configuration option.
     * when the directory structure template should be:
     * - my_theme
     * - - emails
     * - - - my_email_template
     * - - - - subject.vue
     * - - - - body.vue
     * - - - - body-text.vue
     * @param {object} config - the configuration for Compa project
     * @param {object} [config.templateOpts] - the options for templates
     * @param {object} [config.templateOpts.toText] - the options for parse text emails
     * @param {object} [config.templateOpts.toStyle] - the style options for HTML templates
     * @param {object} config.mailer - options for mailer instance
     * @param {object} [config.mailer.user] - the username for SMTP authentication
     * @param {object} [config.mailer.pass] - the user password for SMTP authentication
     * @param {string} [config.mailer.host=localhost] - the hostname or IP address to connect to SMTP transport
     * @param {number} [config.mailer.port=25] - the port to connect to SMTP transport
     * @param {boolean} [config.mailer.useSSL=false] - if `true` the connection will only use TLS
     * @param {boolean} [config.mailer.useTLS=true] - if `true` it forces to use STARTTLS even
     * if the server does not advertise support for it
     * @param {number} [config.mailer.timeout=30000] - how many milliseconds to wait for the connection to establish
     * @param {number} [config.mailer.hostname=config.hostname] - optional hostname of the client,
     * used for identifying to the server
     * @param {boolean} [config.mailer.verbose=false] - additional transaction events logs
     * @param {Logger} log - instance of `Logger/Bunyan` logger for create component "mail"
     * @returns {Promise} on success returns transport instance
     */
    setup(config, log) {
        const mailConfig = config.mailer || {};
        const hostname = mailConfig.hostname || config.hostname;
        const options = {
            auth: {
                user: mailConfig.user,
                pass: mailConfig.pass
            },
            host: mailConfig.host,
            port: mailConfig.port || 25,
            secure: mailConfig.useSSL,
            ignoreTLS: mailConfig.useSSL,
            requireTLS: mailConfig.useTLS,
            connectionTimeout: mailConfig.timeout || 30000,
            name: hostname
        };

        return new Promise((resolve) => {
            if (typeof config.themePath !== "string") {
                // Use default template
                const templatesDefault = path.resolve(__dirname, "../views/", "emails");

                return resolve(templatesDefault);
            }
            // Email template by theme
            const templatesTheme = path.resolve(config.themePath, "emails");
            const access = Promise.promisify(fs.access);

            return access(templatesTheme, fs.R_OK || fs.constants.R_OK).catch({
                code: "ENOENT"
            }, () => {
                return resolve(templatesTheme);
            }).then(() => {
                return templatesTheme;
            });
        }).then((templatesPath) => {
            this.templatesPath = templatesPath;

            // Mailer options and instance
            this.log = log.child({ component: "mail" });
            this.from = mailConfig.from || `no-reply@${hostname}`;
            this.subject = config.instance.name;
            this.templateOpts = config.templateOpts || {};
            this.renderer = createRenderer();

            this.log.debug(omit(options, "auth"), "Connecting to SMTP server");

            // Verbose logs
            if (mailConfig.verbose) {
                options.logger = this.log;
            }

            // Create transport
            this.transport = nodemailer.createTransport(options, {
                from: this.from,
                subject: this.subject
            });
            this.transport.sendMail = Promise.promisify(this.transport.sendMail.bind(this.transport));

            return this.transport;
        });
    }

    /**
     * Render template views from theme or default directory and return
     * `subject`, `html` and `text` template parsed.
     * @param {string} view - view name (the directory name) that contain the templates for `body` and `subject`
     * when `body-text` template not exist will be getting from "html" template
     * @param {object} locals - an data whose properties define local variables for the Vue view
     * @param {object} [options] - an properties for customize the render
     * @param {object} [options.subject] - if `false` will be ignored the "subject" template
     * @param {object} [options.body] - if `false` will be ignored the "body|text" template
     * @returns {Promise} on success returns a object the template
     */
    render(view, locals, options = {}) {
        if (!this.templatesPath) {
            return Promise.reject(
                new Error("Template path not configured yet, please run `.setup()` before `.render()`")
            );
        }

        const { toText, toStyle } = this.templateOpts;
        const viewDir = path.join(this.templatesPath, view);
        const tplIgnore = [];
        const tplType = {
            "subject": "subject",
            "body-text": "text",
            "text": "text",
            "body": "html"
        };

        // Make promises
        const stat = Promise.promisify(fs.stat);
        const readdir = Promise.promisify(fs.readdir);
        const readFile = Promise.promisify(fs.readFile);
        const juiceResources = Promise.promisify(juice.juiceResources);
        const renderToString = Promise.promisify(this.renderer.renderToString);

        // Default render options
        options = Object.assign({
            subject: true,
            body: true
        }, options);

        // When disable some content template
        if (!options.subject) {
            tplIgnore.push("subject");
        }

        if (!options.body) {
            tplIgnore.push("html", "text");
        }

        // Get available templates and render
        return readdir(viewDir).filter((file) => {
            const filePath = path.join(viewDir, file);

            return stat(filePath).then((stats) => {
                return stats.isFile();
            });
        }).reduce((templates, file) => {
            const ext = path.extname(file);
            const filename = path.basename(file, ext);
            const type = tplType[filename];

            if (!type || tplIgnore.indexOf(type) !== -1) {
                return templates;
            }

            return readFile(file, "utf-8").then((raw) => {
                const tpl = new Vue({
                    data: locals,
                    template: raw
                });

                return renderToString(tpl);
            }).then((html)  => {
                templates[type] = html;

                return templates;
            });
        }, {}).then((templates) => {
            if (templates.html && isPlainObject(toStyle)) {
                return juiceResources(templates.html, toStyle).then((html) => {
                    templates.html = html;

                    return templates;
                });
            }

            return templates;
        }).then((templates) => {
            if (templates.html && !templates.text) {
                templates.text = htmlToText.fromString(templates.html, toText);
            }

            return templates;
        });
    }

    /**
     * Send and render a email in "html" and "text" format
     * @param {string} view - name of email view to send
     * @param {object} locals - an data properties to render in the view
     * @param {object} [options] - for overwrite defaults or customized message properties
     * @param {string} [options.from=mailer.from] - the email address of the sender
     * @param {(string|string[])} [options.to] - singles email or array with emails addresses of recipients
     * @param {string} [options.subject] - the subject of the email, `false` use the instance name
     * @param {(string|buffer|stream|object)} [options.html] - custom HTML message also support an
     * attachment-like object `({path: 'http://...'})` by default get/parse template from `view`,
     * false disable `html` version
     * @param {(string|buffer|stream|object)} [options.text] - custom plain-text version of the message also
     * attachment-like object `({path: '/var/data/...'})`, by default get the `text version from `html` template
     * @returns {Promise} on success returns a message information
     */
    send(view, locals, options = {}) {
        if (typeof view !== "string") {
            return Promise.reject(new Error("`view` string parameter is required"));
        }

        // Extend options/locals
        options = Object.assign({
            from: this.from
        }, options);

        locals = Object.assign({}, locals, pick(options, [ "from", "to" ]));

        // Allow multiples emails
        if (!Array.isArray(locals.to)) {
            locals.to = [ locals.to ];
        }

        // Fallback origin as destination (for alerts and debug)
        remove(locals.to, (value) => {
            return typeof value !== "undefined";
        });
        if (isEmpty(locals.to)) {
            locals.to = [ this.from ];
        }

        // Render template
        return this.render(view, locals, {
            subject: !options.subject,
            body: !options.html
        }).then((result) => {
            const subject = options.subject || result.subject || this.subject;
            const sendOptions = {
                from: locals.from,
                to: locals.to,
                subject: subject,
                html: options.html || result.html,
                text: options.text || result.text
            };

            this.log.debug({
                to: locals.to,
                subject: subject
            }, "Sending email");

            // Send email
            return this.transport.sendMail(sendOptions).then((info) => {
                this.log.info({
                    to: locals.to,
                    subject: subject,
                    response: info.response
                }, "Message sent success, id: %s", info.messageId);

                return info;
            }).catch((err) => {
                this.log.error(err, "Error sending email, to: %s, subject: %s", locals.to, subject);

                return err;
            });
        }).catch((err) => {
            if (this.log) {
                this.log.error(err, "Render email error");
            }

            return err;
        });
    }

}

// Exports
module.exports = new Mailer();
