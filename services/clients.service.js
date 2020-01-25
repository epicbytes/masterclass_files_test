"use strict";

const Service = require("moleculer").Service;
const CoreMixins = require("../mixins");

class ClientsService extends Service {
  constructor(broker) {
    super(broker);
    this.parseServiceSchema({
      name: "clients",
      mixins: [CoreMixins.DB],
      actions: {
        get_plugins: {
          handler: this.GetPlugins
        }
      }
    });
  }

  async GetPlugins() {
    return await this.broker
      .call("$node.services", {
        skipInternal: true,
        withActions: true,
        withEvents: true
      })
      .filter(service => service.name.startsWith("clients_"));
  }
}

module.exports = ClientsService;
