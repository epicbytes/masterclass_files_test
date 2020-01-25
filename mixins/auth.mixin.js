const ApiGateway = require("moleculer-web");
const {
  ERR_INVALID_TOKEN,
  ERR_NO_TOKEN,
  UnAuthorizedError
} = ApiGateway.Errors;
const _ = require("lodash");

module.exports = {
  methods: {
    async authenticate(ctx, route, req, res) {
      let token = null;
      let user;
      let type;
      if (req.headers.authorization) {
        type = req.headers.authorization.split(" ")[0];
        if (type === "Token" || type === "Bearer")
          token = req.headers.authorization.split(" ")[1];
      }
      if (!token) {
        token = req.query.token;
      }
      if (!token) {
        return;
      }

      user = await ctx.call("accounts.resolveToken", { token });
      user = _.pick(user, [
        "_id",
        "username",
        "avatar",
        "image",
        "email",
        "group"
      ]);
      return user;
    },
    async authorize(ctx, route, req) {
      let token;
      let type;
      let user;
      if (!_.get(req, "$endpoint.action.auth")) {
        return;
      }
      if (req.headers.authorization) {
        type = req.headers.authorization.split(" ")[0];
        if (type === "Token" || type === "Bearer")
          token = req.headers.authorization.split(" ")[1];
      }
      if (!token) {
        token = req.query.token;
      }
      try {
        if (!token) {
          throw new UnAuthorizedError(ERR_NO_TOKEN);
        }
        user = await ctx.call("accounts.resolveToken", { token });
        if (!user) {
          throw new UnAuthorizedError(ERR_INVALID_TOKEN);
        }

        ctx.meta.token = token;
        return Promise.resolve(ctx);
      } catch (e) {
        throw new UnAuthorizedError(ERR_INVALID_TOKEN);
      }
    }
  }
};
