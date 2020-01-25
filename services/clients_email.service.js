const Service = require("moleculer").Service;

class ClientsEmailService extends Service {
  constructor(broker) {
    super(broker);
    this.parseServiceSchema({
      dependencies: ["clients"],
      name: "clients_email",
      setting: {},
      metadata: {
        metadatas: "all you want"
      }
    });
  }
}

module.exports = ClientsEmailService;
