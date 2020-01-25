const Service = require("moleculer").Service;

class ClientsPhoneService extends Service {
  constructor(broker) {
    super(broker);
    this.parseServiceSchema({
      dependencies: ["clients"],
      name: "clients_phone",
      setting: {
        ku: "kukareku"
      },
      metadata: {
        metadatas: "all you want"
      }
    });
  }
}

module.exports = ClientsPhoneService;
