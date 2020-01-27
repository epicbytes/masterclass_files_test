const JaegerService = require("moleculer-jaeger");
const Service = require("moleculer").Service;

const host = process.env.JAEGER_HOST || "localhost";
const port = process.env.JAEGER_PORT || 6832;

class MetricsJaegerService extends Service {
  constructor(broker) {
    super(broker);
    this.parseServiceSchema({
      mixins: [JaegerService],
      settings: {
        host,
        port
      }
    });
  }
}

module.exports = MetricsJaegerService;
