const Service = require("moleculer").Service;

class ClientsAppleService extends Service {
  constructor(broker) {
    super(broker);
    this.parseServiceSchema({
      dependencies: ["clients"],
      name: "clients_apple",
      settings: {
        $secureSettings: []
      },
      actions: {
        callback: this.Callback
      }
    });
  }

  Callback(ctx) {}
}

module.exports = ClientsAppleService;
