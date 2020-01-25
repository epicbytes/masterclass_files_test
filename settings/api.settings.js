"use strict";
const passport = require("passport");

module.exports = {
  port: process.env.API_PORT || 5000,
  etag: true,
  cors: true,
  routes: [
    {
      path: "/api/v1/clients",
      use: [passport.initialize()],
      bodyParsers: {
        json: {
          limit: "5mb",
          strict: true
        },
        urlencoded: {
          extended: true,
          limit: "5mb"
        }
      },
      aliases: {
        "GET /plugins": [console.log, "clients.get_plugins"]
      },
      mappingPolicy: "restrict"
    },
    {
      path: "/api/v1/queues",
      bodyParsers: {
        json: {
          limit: "5mb",
          strict: true
        },
        urlencoded: {
          extended: true,
          limit: "5mb"
        }
      },
      aliases: {
        "POST /make_hls/:id": "queues.make_hls"
      },
      mappingPolicy: "restrict"
    },
    {
      path: "/api/v1/files",
      bodyParsers: {
        json: false,
        urlencoded: false
      },
      aliases: {
        "GET /stream/:id": "files.stream",
        "GET /:id": "files.get",
        "POST /": "multipart:files.create",
        "PUT /": "stream:files.create",
        "POST /multi": {
          type: "multipart",
          action: "file.create"
        }
      },

      callOptions: {
        timeout: 300000,
        retries: 3
      },

      busboyConfig: {
        limits: {
          files: 1
        }
      },

      onBeforeCall(ctx, route, req, res) {
        if (req.headers["range"]) {
          var parts = req.headers["range"].replace(/bytes=/, "").split("-");
          var start = Number(parts[0]);
          var end = Number(parts[1]);
          ctx.meta.range = {
            start,
            end
          };
        }
      },
      mappingPolicy: "restrict"
    }
  ]
};
