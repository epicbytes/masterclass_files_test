"use strict";

const ApiGateway = require("moleculer-web");
const settings = require("../settings/api.settings");
const Service = require("moleculer").Service;
const CoreMixins = require("../mixins");

class ApiService extends Service {
  constructor(broker) {
    super(broker);
    this.parseServiceSchema({
      name: "api",
      mixins: [ApiGateway, CoreMixins.Socket],
      settings
    });
  }
}

module.exports = ApiService;
