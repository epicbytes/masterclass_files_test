const Service = require("moleculer").Service;

class ClientsFacebookService extends Service {
  constructor(broker) {
    super(broker);
    this.parseServiceSchema({
      dependencies: ["clients"],
      name: "clients_facebook"
    });
  }
}

module.exports = ClientsFacebookService;
