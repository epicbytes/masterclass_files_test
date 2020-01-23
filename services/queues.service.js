const Service = require("moleculer").Service;
var Queue = require("bull");

class QueuesService extends Service {
  constructor(broker) {
    super(broker);
    this.parseServiceSchema({
      name: "queues",
      actions: {
        make_hls: {
          cache: false,
          params: {
            id: { type: "string" }
          },
          handler: this.makeHls
        }
      },

      events: {
        "files.uploaded": {
          handler(payload) {
            return this.actions.make_hls(payload);
          }
        }
      },
      created() {
        this.videoQueue = new Queue("making hls files");
        this.videoQueue.process(function(job) {
          const { id } = job.data;
          return broker.call("files.make", { id }, { timeout: 0 });
        });
        this.videoQueue.on("error", error => {
          console.log(error);
        });

        this.videoQueue.on("completed", job => {
          console.log("completed", job.id);
        });
      }
    });
  }

  makeHls(ctx) {
    return this.videoQueue.add(ctx.params);
  }
}

module.exports = QueuesService;
