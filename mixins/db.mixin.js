"use strict";

var mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;

module.exports = {
  created() {
    this.adapter = mongoose.connection;
    this.adapter.on("error", error => {
      this.broker.logger.error("Connection ERROR", error);
    });
    this.adapter.once("open", () => {
      this.broker.logger.info("Connection OK");
    });
    this.adapter.once("close", () => {
      this.broker.logger.info("Connection closed");
    });
  },
  started() {
    mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
  },
  stopped() {
    mongoose.disconnect();
  }
};
