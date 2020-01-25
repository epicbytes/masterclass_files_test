const PromService = require("moleculer-prometheus");
const Service = require("moleculer").Service;

const host = process.env.JAEGER_HOST || "localhost";
const port = process.env.JAEGER_PORT || 3030;

class MetricsPrometheusService extends Service {
  constructor(broker) {
    super(broker);
    this.parseServiceSchema({
      mixins: [PromService],
      settings: {
        host,
        port,
        collectDefaultMetrics: true,
        timeout: 5 * 1000
      }
    });
  }
}

module.exports = MetricsPrometheusService;
