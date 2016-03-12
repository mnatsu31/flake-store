'use strict';

module.exports = require('./lib/FlakeStore');
module.exports.waitFor = require('./lib/utils/waitFor').waitFor;
module.exports.mergeHandlers = require('./lib/utils/mergeHandlers').mergeHandlers;
