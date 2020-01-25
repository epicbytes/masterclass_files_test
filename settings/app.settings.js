module.exports = {
  port: process.env.APP_PORT || 5010,
  etag: true,
  cors: true,
  routes: [
    {
      path: "/api/v1/files",
      bodyParsers: {
        json: false,
        urlencoded: false
      },
      aliases: {
        "GET /stream/:id": "files.stream",
        "GET /:id": "files.get"
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
