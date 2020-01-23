const Service = require("moleculer").Service;
const CoreMixins = require("../mixins");
const settings = require("../settings/files.settings");
const mongodb = require("mongodb");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");

class FilesService extends Service {
  constructor(broker) {
    super(broker);
    this.parseServiceSchema({
      name: "files",
      settings,
      mixins: [CoreMixins.DB("fs.files")],
      hooks: {
        before: {
          get: ["getFileInfo"],
          stream: ["getFileInfo"]
        }
      },
      actions: {
        get: {
          cache: false,
          params: {
            id: { type: "string" }
          },
          handler: this.getFile
        },
        stream: {
          cache: false,
          params: {
            id: { type: "string" }
          },
          handler: this.getFileStream
        },
        create: {
          handler: this.saveFile
        },
        make: {
          cache: false,
          params: {
            id: { type: "string" }
          },
          handler: this.makeHLSFile
        }
      }
    });
  }

  async getFileInfo(ctx) {
    const fileData = await this.adapter.findById(ctx.params.id);
    ctx.params.length = fileData.length;
    ctx.params.filename = fileData.filename;
    ctx.params.contentType = fileData.contentType;
  }

  getFile(ctx) {
    const { id, contentType } = ctx.params;
    const bucket = new mongodb.GridFSBucket(this.adapter.db);
    const file = bucket.openDownloadStream(mongodb.ObjectID(id));
    ctx.meta.$statusCode = 200;
    ctx.meta.$responseHeaders = {
      "Content-Type": contentType
    };
    return file;
  }

  makeHLSFile(ctx) {
    const { id, contentType } = ctx.params;
    const bucket = new mongodb.GridFSBucket(this.adapter.db);
    const file = bucket.openDownloadStream(mongodb.ObjectID(id));
    ctx.meta.$statusCode = 200;
    ctx.meta.$responseHeaders = {
      "Content-Type": contentType
    };
    return new Promise((resolve, reject) => {
      ffmpeg({ timeout: 432000 })
        .input(file)
        .videoCodec("libx264")
        .addOption("-hls_time", 10)
        .addOption("-hls_list_size", 0)
        .on("end", function() {
          resolve("file has been converted succesfully");
        })
        .on("error", function(err) {
          reject("an error happened: " + err.message);
        })
        .save(path.join(__dirname, "..", "test", "your_target.m3u8"));
    });
  }

  getFileStream(ctx) {
    const { length, contentType, filename } = ctx.params;
    const { range } = ctx.meta;
    const bucket = new mongodb.GridFSBucket(this.adapter.db);
    if (!range) {
      return this.getFile(ctx);
    }
    var start = parseInt(range.start, 10);
    var end = range.end > 0 ? parseInt(range.end, 10) : length - 1;
    var chunksize = end - start + 1;
    console.log(
      "RANGE: " + start + " - " + end + " = " + chunksize + "|" + length
    );
    ctx.meta.$statusCode = 206;
    ctx.meta.$responseHeaders = {
      "Content-Range": "bytes " + start + "-" + end + "/" + length,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": contentType
    };
    const file = bucket.openDownloadStreamByName(filename, {
      start,
      end: end == 1 ? 2 : end
    });

    return file;
  }

  saveFile(ctx) {
    try {
      return new Promise((resolve, reject) => {
        const bucket = new mongodb.GridFSBucket(this.adapter.db);
        const uploadStream = bucket.openUploadStream(ctx.meta.filename, {
          metadata: {
            encoding: ctx.meta.encoding
          },
          contentType: ctx.meta.mimetype
        });
        ctx.params
          .pipe(uploadStream)
          .on("error", function(error) {
            reject(new Error(error));
          })
          .on("finish", function() {
            resolve({ id: uploadStream.id });
          });
      });
    } catch (error) {
      throw new Error(error);
    }
  }
}

module.exports = FilesService;
