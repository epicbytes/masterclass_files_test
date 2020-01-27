"use strict";

const Service = require("moleculer").Service;

class ReplService extends Service {
  constructor(broker) {
    super(broker);
    this.parseServiceSchema({
      name: "repl",
      actions: {
        health(ctx) {
          return broker.getHealthStatus();
        },
        v8Stats() {
          const v8 = require("v8");
          return {
            heap_code: v8.getHeapCodeStatistics(),
            heap_space: v8.getHeapSpaceStatistics(),
            heap_stat: v8.getHeapStatistics()
          };
        },
        nodes() {
          return broker.registry.getNodeRawList();
        },
        services() {
          return broker.registry.getServiceList({
            skipInternal: true,
            withActions: true,
            withEvents: true
          });
        },
        actions(ctx) {
          return broker.registry.getActionList({
            onlyLocal: ctx.params.local || false,
            onlyAvailable: !ctx.params.all || false,
            skipInternal: ctx.params.skipinternal || false,
            withEndpoints: ctx.params.details || false
          });
        },
        events(ctx) {
          return broker.registry.getEventList({
            onlyLocal: ctx.params.local || false,
            onlyAvailable: !ctx.params.all || false,
            skipInternal: ctx.params.skipinternal || false,
            withEndpoints: ctx.params.details || false
          });
        },
        cache(ctx) {
          return broker.cacher.clean(ctx.params.pattern || "**.*");
        },
        evt() {
          return process.env;
        }
      }
    });
  }
}

module.exports = ReplService;
