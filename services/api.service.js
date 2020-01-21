"use strict";

const ApiGateway = require("moleculer-web");
const settings = require("../settings/api.settings");

module.exports = {
  name: "api",
  mixins: [ApiGateway],
  settings
};
