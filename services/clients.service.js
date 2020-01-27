"use strict";

const Service = require("moleculer").Service;
const CoreMixins = require("../mixins");
const util = require("util");

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

  GetPlugins() {
    const [node] = this.broker.registry.getNodeList({
      onlyAvailable: false,
      withServices: true
    });

    console.log(this.broker.generateUid());

    return { ...node, services: node.services.length };

    return this.broker.registry
      .getServiceList({
        skipInternal: true,
        withActions: true,
        withEvents: true
      })
      .filter(service => service.name.startsWith("clients_"));
  }
}

module.exports = ClientsService;
