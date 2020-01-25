"use strict";

const ApiGateway = require("moleculer-web");
const settings = require("../settings/app.settings");
const Service = require("moleculer").Service;

class AppService extends Service {
  constructor(broker) {
    super(broker);
    this.parseServiceSchema({
      name: "app",
      mixins: [ApiGateway],
      settings
    });
  }
}

module.exports = AppService;
