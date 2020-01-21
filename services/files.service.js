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
          stream: ["getFileLength"]
        }
      },
      actions: {
        get: {
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
  }

  getFile(ctx) {
    const { id } = ctx.params;
    const bucket = new mongodb.GridFSBucket(this.adapter.db);
    return bucket.openDownloadStream(mongodb.ObjectID(id));
  }

  getFileStream(ctx) {
    const { id, length } = ctx.params;
    const { range } = ctx.meta;
    const bucket = new mongodb.GridFSBucket(this.adapter.db);

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
      "Content-Length": chunksize,
      "Content-Type": "video/mp4"
    };
    return file;
  }

  saveFile(ctx) {
    try {
      return new Promise((resolve, reject) => {
        const bucket = new mongodb.GridFSBucket(this.adapter.db);
        const uploadStream = bucket.openUploadStream(ctx.meta.filename);
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
