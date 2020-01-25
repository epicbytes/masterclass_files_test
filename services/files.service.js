const Service = require("moleculer").Service;
const CoreMixins = require("../mixins");
const settings = require("../settings/files.settings");
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const { createModel } = require("mongoose-gridfs");

class FilesService extends Service {
  constructor(broker) {
    super(broker);
    this.parseServiceSchema({
      name: "files",
      settings,
      mixins: [CoreMixins.DB, CoreMixins.Converters],
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
    const Attachment = createModel();
    let fileData;
    if (mongoose.Types.ObjectId.isValid(id)) {
      fileData = await Attachment.findOne({ _id: id });
    } else {
      fileData = await Attachment.findOne({ filename: id });
    }
    ctx.params.length = fileData.length;
    ctx.params.filename = fileData.filename;
    ctx.params.contentType = fileData.contentType;
  }

  getFile(ctx) {
    const { id, contentType } = ctx.params;
    const Attachment = createModel();
    ctx.meta.$responseHeaders = {
      "Content-Type": contentType
    };
    if (mongoose.Types.ObjectId.isValid(id)) {
      return Attachment.read({ _id: mongoose.Types.ObjectId(id) });
    } else {
      return Attachment.read({ filename: id });
    }
  }

  getFileStream(ctx) {
    const { length, contentType, filename } = ctx.params;
    const { range } = ctx.meta;
    if (!range) {
      return this.getFile(ctx);
    }
    const Attachment = createModel();
    var start = parseInt(range.start, 10);
    var end = range.end > 0 ? parseInt(range.end, 10) : length - 1;
    var chunksize = end - start + 1;
    ctx.meta.$statusCode = 206;
    ctx.meta.$responseHeaders = {
      "Content-Range": `bytes ${start}-${end}/${length}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": contentType
    };
    return Attachment.read(
      { filename },
      {
        start,
        end: end == 1 ? 2 : end
      }
    );
  }

  saveToGridFs(ctx) {
    const types = {
      ".ts": "video/mp2t",
      ".m3u8": "application/x-mpegurl",
      ".mp3": "audio/mpeg"
    };
    const stream = fs.createReadStream(ctx.params.file);
    const fileName = path.parse(ctx.params.file).name;
    const fileExt = path.parse(ctx.params.file).ext;

    return new Promise((resolve, reject) => {
      const Attachment = createModel();
      Attachment.write(
        {
          filename: `${fileName}${fileExt}`,
          metadata: {
            //
          },
          contentType: types[fileExt]
        },
        stream,
        (error, file) => {
          if (error) {
            fs.unlink(ctx.params.file);
            reject(new Error(error));
          }
          if (fileExt === ".m3u8") {
            this.broker.logger.info("id of your playlist: ", file._id);
          }
          fs.unlinkSync(ctx.params.file);
          resolve({ id: file._id });
        }
      );
    });
  }

  saveFile(ctx) {
    return new Promise((resolve, reject) => {
      const Attachment = createModel();
      Attachment.write(
        {
          filename: ctx.meta.filename,
          metadata: {
            encoding: ctx.meta.encoding
          },
          contentType: ctx.meta.mimetype
        },
        ctx.params,
        (error, file) => {
          if (error) {
            reject(new Error(error));
          }
          ctx.emit("files.uploaded", {
            filename: ctx.meta.filename,
            id: file._id.toString()
          });
          resolve({ id: file._id });
        }
      );
    });
  }
}

module.exports = FilesService;
