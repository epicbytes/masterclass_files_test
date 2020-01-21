"use strict";

const path = require("path");
const mkdir = require("mkdirp").sync;
const DbService = require("moleculer-db");

const MONGO_URI = process.env.MONGO_URI;
module.exports = function(collection) {
  if (MONGO_URI) {
    const MongoAdapter = require("moleculer-db-adapter-mongo");
    return {
      adapter: new MongoAdapter(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true
      }),
      methods: {
        addDates(ctx) {
          ctx.params.createdAt = new Date();
          ctx.params.updatedAt = new Date();
          return ctx;
        }
      },
      collection,
      mixins: [DbService]
    };
  }

  mkdir(path.resolve("./data"));

  return {
    adapter: new DbService.MemoryAdapter({
      filename: `./data/${collection}.db`
    }),
    mixins: [DbService]
  };
};
