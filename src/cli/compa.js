// Main entry point for Compa application
//
// Compa -- worldwide social directory decentralized and federated
// Copyright (C) 2017 Distopico <distopico@riseup.net>
// compa is part of Compa.
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

const yargs = require("yargs");
const runCompa = require("./lib/run");


const compa = () => {
    this.argv = yargs.usage("Usage: $0 [command] <options>")
        .command(runCompa)
        .demandCommand(1, 1, "You need at least one command")
        .alias("h", "help")
        .help()
        .alias("v", "version")
        .version()
        .argv;
};

// Runs
compa();
