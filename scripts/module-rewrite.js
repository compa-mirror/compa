"use strict";

/**
 * Rewrite some modules paths from src to destination
 * @param {string} originalPath - the original modules path
 * @param {string} callingFileName - the file calling to compiled
 * @returns {string}
 */
function moduleRewrite(originalPath, callingFileName) {
    if (callingFileName.indexOf("/cli/") !== -1 && originalPath.match(/^..\/server/)) {
        return originalPath.replace(/^..\/server/, "../../server");
    }
}

module.exports = moduleRewrite;
