module.exports = {
  port: process.env.API_PORT || 3000,

  routes: [
    {
      path: "/api/v1/files",

      authorization: true,

      bodyParsers: {
        json: false,
        urlencoded: false
      },

      aliases: {
        "GET /stream/:id": "files.stream",
        "GET /make/:id": "files.make",
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
