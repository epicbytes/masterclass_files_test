"use strict";

const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const glob = require("glob");
const mongoose = require("mongoose");
const { createModel } = require("mongoose-gridfs");

module.exports = {
  actions: {
    info: {
      cache: ["id"],
      params: {
        id: { type: "string" }
      },
      async handler(ctx) {
        const file = await this.getFile(ctx);

        return new Promise((resolve, reject) => {
          ffmpeg.ffprobe(file, (err, information) => {
            if (err) {
              reject(err);
            }
            resolve(information);
          });
        });
      }
    },
    makeHls: {
      handler(ctx) {
        const { id } = ctx.params;
        const savePath = path.join(__dirname, "..", "test", `${id}.m3u8`);
        const searchPath = path.join(
          __dirname,
          "..",
          "test",
          `${id}*+(.ts|.m3u8)`
        );
        return new Promise((resolve, reject) => {
          const Attachment = createModel();
          ffmpeg({ timeout: 432000 })
            .input(Attachment.read({ _id: mongoose.Types.ObjectId(id) }))
            .videoCodec("libx264")
            .noAudio()
            .addOption("-hls_time", 10)
            .addOption("-hls_list_size", 0)
            .on("end", function() {
              glob(searchPath, {}, function(err, files) {
                if (err === null) {
                  for (let file of files) {
                    ctx.call("files.saveToGridFs", { file });
                  }
                  resolve("file has been converted succesfully");
                } else {
                  reject("an error happened: " + err);
                }
              });
            })
            .on("error", function(err) {
              reject("an error happened: " + err.message);
            })
            .save(savePath);
        });
      }
    },
    makeMp3: {
      handler(ctx) {
        const { id } = ctx.params;
        const savePath = path.join(__dirname, "..", "test", `${id}.mp3`);
        const searchPath = path.join(__dirname, "..", "test", `${id}*.mp3`);
        return new Promise((resolve, reject) => {
          const Attachment = createModel();
          ffmpeg({ timeout: 432000 })
            .input(Attachment.read({ _id: mongoose.Types.ObjectId(id) }))
            .noVideo()
            .format("mp3")
            .on("end", function() {
              glob(searchPath, {}, function(err, files) {
                if (err === null) {
                  for (let file of files) {
                    ctx.call("files.saveToGridFs", { file });
                  }
                  resolve("file has been converted succesfully");
                } else {
                  reject("an error happened: " + err);
                }
              });
            })
            .on("error", function(err) {
              reject("an error happened: " + err.message);
            })
            .save(savePath);
        });
      }
    }
  }
};
