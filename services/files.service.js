const Service = require("moleculer").Service;
const CoreMixins = require("../mixins");
const settings = require("../settings/files.settings");
const mongodb = require("mongodb");
const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");
const glob = require("glob");

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
        },
        saveToGridFs: {
          params: {
            file: "string"
          },
          handler: this.saveToGridFs
        }
      }
    });
  }

  async getFileInfo(ctx) {
    const { id } = ctx.params;
    let fileData;
    if (mongodb.ObjectID.isValid(id)) {
      fileData = await this.adapter.findById(id);
    } else {
      fileData = await this.adapter.find({ filename: id });
    }
    ctx.params.length = fileData.length;
    ctx.params.filename = fileData.filename;
    ctx.params.contentType = fileData.contentType;
  }

  getFile(ctx) {
    const { id, contentType } = ctx.params;
    const bucket = new mongodb.GridFSBucket(this.adapter.db);
    ctx.meta.$statusCode = 200;
    ctx.meta.$responseHeaders = {
      "Content-Type": contentType
    };
    if (mongodb.ObjectID.isValid(id)) {
      return bucket.openDownloadStream(mongodb.ObjectID(id));
    } else {
      return bucket.openDownloadStreamByName(id);
    }
  }

  makeHLSFile(ctx) {
    const { id, contentType } = ctx.params;
    const bucket = new mongodb.GridFSBucket(this.adapter.db);
    const file = bucket.openDownloadStream(mongodb.ObjectID(id));
    const savePath = path.join(__dirname, "..", "test", `${id}.m3u8`);
    //const saveAudioPath = path.join(__dirname, "..", "test", `${id}.mp3`);
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
          glob(path.join(__dirname, "..", "test", `${id}*.*`), {}, function(
            err,
            files
          ) {
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
      //TODO: нужно будет добавить очередь для выдергивания звуковой дорожки
      /*
        .format("mp3")
        .save(saveAudioPath); */
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

  /**
   * 
   * 
   * fileTypes:
      .M3U8	application/x-mpegurl or vnd.apple.mpegURL
      .ts	video/MP2T
   */
  saveToGridFs(ctx) {
    const types = {
      ".ts": "video/mp2t",
      ".m3u8": "application/x-mpegurl",
      ".mp3": ""
    };
    const stream = fs.createReadStream(ctx.params.file);
    const fileName = path.parse(ctx.params.file).name;
    const fileExt = path.parse(ctx.params.file).ext;

    return new Promise((resolve, reject) => {
      const bucket = new mongodb.GridFSBucket(this.adapter.db);
      const uploadStream = bucket.openUploadStream(`${fileName}${fileExt}`, {
        metadata: {
          //
        },
        contentType: types[fileExt]
      });
      stream
        .pipe(uploadStream)
        .on("error", function(error) {
          fs.unlink(ctx.params.file);
          reject(new Error(error));
        })
        .on("finish", function() {
          if (fileExt === ".m3u8") {
            console.log("id of your playlist: ", uploadStream.id);
          }
          fs.unlinkSync(ctx.params.file);
          resolve({ id: uploadStream.id });
        });
    });
  }

  saveFile(ctx) {
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
          ctx.emit("files.uploaded", {
            filename: ctx.meta.filename,
            id: uploadStream.id.toString()
          });
          resolve({ id: uploadStream.id });
        });
    });
  }
}

module.exports = FilesService;
