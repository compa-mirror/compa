// Main input for compa server
//
// Compa -- worldwide social directory decentralized and federated
// Copyright (C) 2017 Distopico <distopico@riseup.net>
// core/api/apiRoutes.js is part of Compa.
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

const express = require("express");
const cors = require("cors");

const api = express.Router();

// Allow cors for api
api.use(cors((req, callback) => {
    const opts = {
        // origin: config.corsWhitelist || false,
        credentials: true,
        // preflightContinue: config.debug,
        maxAge: 86400,
        allowedHeaders: [
            "Authorization", "Content-Type", "If-Match", "Accept-Encoding",
            "If-Modified-Since", "If-None-Match", "If-Unmodified-Since", "X-Requested-With"
        ],
        exposedHeaders: [
            "ETag", " Link", " X-RateLimit-Limit", " X-RateLimit-Remaining",
            "X-RateLimit-Reset", " X-OAuth-Scopes", " X-Accepted-OAuth-Scopes", " X-Poll-Interval"
        ]
    };

    callback(null, opts);
}));

api.use((req, res, next) => {
    if (!req.get("user-agent")) {
        req.log.warn({ module: "main" }, "Invalid user agent");

        return next(new res.Make({
            detail: RESPONSE.badRequest,
            error_description: "please make sure your request has a 'User-Agent' header"
        }));
    }

    return next();
});
// Filter
// api.use(app.queryFilter());
// Pagination
// api.use(app.pagination());

module.exports = {
    api
};
