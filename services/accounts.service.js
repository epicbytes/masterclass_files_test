"use strict";

const Service = require("moleculer").Service;
const PassportJwt = require("passport-jwt");
const Account = require("../models/user.model");
const settings = require("../settings/accounts.settings");
const CoreMixins = require("../mixins");

class AccountsService extends Service {
  constructor(broker) {
    super(broker);
    this.parseServiceSchema({
      name: "accounts",
      mixins: [
        CoreMixins.DB,
        CoreMixins.CacheCleaner(["cache.clean.accounts"])
      ],
      settings,
      actions: {
        /**
         * Register a new user
         *
         * @actions
         * @param {Object} user - User entity
         *
         * @returns {Object} Created entity & token
         */
        create: {
          handler(ctx) {
            const { email, password } = ctx.params;
            const user = new Account({
              email,
              password
            });
            return new this.Promise((resolve, reject) => {
              Account.register(user, password, (error, user) => {
                if (error) {
                  reject(error);
                }
                resolve(user);
              });
            });
          }
        }
      },
      methods: {
        //TODO: переписать из мидлвара
        signJWTForUser(req, res) {
          const user = req.user;
          const token = JWT.sign(
            {
              email: user.email
            },
            this.settings.jwtSecret,
            {
              algorithm: this.settings.jwtAlgorithm,
              expiresIn: this.settings.jwtExpiresIn,
              subject: user._id.toString()
            }
          );
          res.json({ token });
        }
      },
      events: {
        "cache.clean.accounts"() {
          if (this.broker.cacher) this.broker.cacher.clean(`${this.name}.*`);
        }
      },
      created() {
        this.passport = require("passport");
        this.passport.use(Account.createStrategy());
        this.passport.use(
          new PassportJwt.Strategy(
            {
              jwtFromRequest: PassportJwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
              secretOrKey: this.settings.jwtSecret,
              algorithms: [this.settings.jwtAlgorithm]
            },
            (payload, done) => {
              Account.findById(payload.sub)
                .then(user => {
                  if (user) {
                    done(null, user);
                  } else {
                    done(null, false);
                  }
                })
                .catch(error => {
                  done(error, false);
                });
            }
          )
        );
      }
    });
  }
}

module.exports = AccountsService;
