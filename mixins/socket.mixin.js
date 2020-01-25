const SocketIOService = require("moleculer-io");
const redisAdapter = require("socket.io-redis");
const Redis = require("ioredis");

module.exports = {
  actions: {
    join: {
      metrics: false,
      params: { name: "string" },
      async handler(ctx) {
        ctx.meta.$join = [ctx.params.name];
      }
    },
    leave: {
      metrics: false,
      params: { name: "string" },
      async handler(ctx) {
        ctx.meta.$leave = [ctx.params.name];
      }
    },
    call: { metrics: false },
    broadcast: { metrics: false },
    getClients: { metrics: false }
  },
  mixins: [SocketIOService],
  settings: {
    io: {
      options: {
        pingTimeout: 60000,
        adapter: redisAdapter({
          pubClient: new Redis(),
          subClient: new Redis()
        })
      },
      namespaces: {
        "/api/v1": {
          events: {
            call: {}
          }
        }
      }
    }
  }
};
