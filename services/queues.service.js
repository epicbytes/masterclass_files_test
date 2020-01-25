const Service = require("moleculer").Service;
var Queue = require("bull");

class QueuesService extends Service {
  constructor(broker) {
    super(broker);
    this.parseServiceSchema({
      name: "queues",
      events: {
        "files.uploaded": {
          handler(payload) {
            return Promise.all([
              this.videoQueue.add(payload),
              this.mp3Queue.add(payload)
            ]).then(([video, mp3]) => {
              return { video, mp3 };
            });
          }
        }
      },
      created() {
        this.videoQueue = new Queue("making hls files");
        this.mp3Queue = new Queue("making mp3 file");

        this.videoQueue.process(function(job) {
          const { id } = job.data;
          return broker.call("files.makeHls", { id }, { timeout: 0 });
        });

        this.mp3Queue.process(function(job) {
          const { id } = job.data;
          return broker.call("files.makeMp3", { id }, { timeout: 0 });
        });

        this.mp3Queue.on("error", error => {
          broker.logger.error(error);
        });

        this.mp3Queue.on("completed", job => {
          broker.logger.info("completed", job.queue.name);
        });

        this.videoQueue.on("error", error => {
          broker.logger.error(error);
        });

        this.videoQueue.on("completed", job => {
          broker.logger.info("completed", job.queue.name);
        });
      }
    });
  }
}

module.exports = QueuesService;
