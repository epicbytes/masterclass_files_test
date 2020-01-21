const Service = require("moleculer").Service;
const CoreMixins = require("../mixins");
const settings = require("../settings/files.settings");
const mongodb = require("mongodb");

class FilesService extends Service {
  constructor(broker) {
    super(broker);
    this.parseServiceSchema({
      name: "files",
      settings,
      mixins: [CoreMixins.DB("fs.files")],
      hooks: {
        before: {
          get: ["getFileLength"],
          stream: ["getFileLength"]
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
            id: { type: "string" },
            range: {
              type: "object",
              props: {
                start: { type: "number", convert: true },
                end: { type: "number", convert: true }
              },
              optional: true
            }
          },
          handler: this.getFileStream
        },
        create: {
          handler: this.saveFile
        }
      }
    });
  }

  async getFileLength(ctx) {
    const fileData = await this.adapter.findById(ctx.params.id);
    ctx.params.length = fileData.length;
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

  getFileStream(ctx) {
    const { id, length, contentType } = ctx.params;
    const { range } = ctx.meta;
    const bucket = new mongodb.GridFSBucket(this.adapter.db);
    if (!range) {
      return this.getFile(ctx);
    }
    var start = parseInt(range.start, 10);
    var end = range.end ? parseInt(range.end, 10) : length - 1;
    var chunksize = end - start + 1;
    console.log("RANGE: " + start + " - " + end + " = " + chunksize);
    const file = bucket.openDownloadStream(mongodb.ObjectID(id), {
      start,
      end
    });
    ctx.meta.$statusCode = 206;
    ctx.meta.$responseHeaders = {
      "Content-Range": "bytes " + start + "-" + end + "/" + length,
      "Accept-Ranges": "bytes",
      "Content-Type": contentType
    };
    return file;
  }

  saveFile(ctx) {
    try {
      return new Promise(async (resolve, reject) => {
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
