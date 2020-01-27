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
            const { settings, ...props } = payload;
            if (settings.pipelines) {
              for (let pipeline of settings.pipelines) {
                try {
                  const _pipeline = this.pipelines[pipeline.type];
                  _pipeline.add({
                    ...pipeline.options,
                    ...props
                  });
                } catch (error) {
                  broker.logger.error(error);
                }
              }
            } else {
              return this.Promise.resolve({});
            }
          }
        }
      },
      created() {
        this.videoQueue = new Queue("making hls files");
        this.mp3Queue = new Queue("making mp3 file");
        this.imageQueue = new Queue("process images");

        this.pipelines = {
          video: this.videoQueue,
          audio: this.mp3Queue,
          image: this.imageQueue
        };

        this.videoQueue.process(async job => {
          return broker.call("files.makeHls", { ...job.data }, { timeout: 0 });
        });

        this.mp3Queue.process(function(job) {
          return broker.call("files.makeMp3", { ...job.data }, { timeout: 0 });
        });

        this.imageQueue.process(function(job) {
          return broker.call(
            "files.processImage",
            { ...job.data },
            { timeout: 0 }
          );
        });

        this.videoQueue.on("error", error => {
          broker.logger.error(error);
        });

        this.videoQueue.on("completed", job => {
          broker.logger.info("completed", job.queue.name);
        });

        this.mp3Queue.on("error", error => {
          broker.logger.error(error);
        });

        this.mp3Queue.on("completed", job => {
          broker.logger.info("completed", job.queue.name);
        });

        this.imageQueue.on("error", error => {
          broker.logger.error(error);
        });

        this.imageQueue.on("completed", job => {
          broker.logger.info("completed", job.queue.name);
        });
      }
    });
  }
}

module.exports = QueuesService;
