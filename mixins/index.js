module.exports = {
  DB: require("./db.mixin"),
  Socket: require("./socket.mixin"),
  Converters: require("./converters.mixin"),
  Auth: require("./auth.mixin"),
  CacheCleaner: require("./cache_cleaner.mixin")
};
