"use strict";

const Service = require("moleculer").Service;
const Account = require("../models/user.model");
const CoreMixins = require("../mixins");
const PassportJwt = require("passport-jwt");

class AccountsService extends Service {
  constructor(broker) {
    super(broker);
    this.parseServiceSchema({
      name: "accounts",
      mixins: [
        CoreMixins.DB,
        CoreMixins.CacheCleaner(["cache.clean.accounts"])
      ],
      settings: {
        //$secureSettings: ["jwtSecret"], - жованый крот, на эту тему ишью есть
        jwtSecret:
          process.env.JWT_SECRET ||
          "f^I8Zg}VIq)H,Tu9lxAOm|)=EjP6X))$}$j6#.:?Cn%*LotF>FUlSWJVC&x{yw",
        jwtAlgorithm: process.env.JWT_ALGORYTHM || "HS256",
        jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7 days"
      },
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
