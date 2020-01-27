const Service = require("moleculer").Service;

class ClientsPhoneService extends Service {
  constructor(broker) {
    super(broker);
    this.parseServiceSchema({
      dependencies: ["clients"],
      name: "clients_phone",
      setting: {
        //
      },
      metadata: {
        plugin: true
      }
    });
  }
}

module.exports = ClientsPhoneService;
