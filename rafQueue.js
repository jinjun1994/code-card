/**
 * Using:
 * const queue = new RafAnimationQueue(defaultContext)
 * queue.add(firstAnimationFrameCallback) // firstAnimationFrameCallback will executed with defaultContext
 * queue.add(secondAnimationFrameCallback, customContext)
 * queue.delay() // skip just one frame
 * queue.clear() // clear animation queue
**/

export default class RafAnimationQueue {
  constructor(context) {
    this.context = context || undefined;
    this.clear();
  }
  add(callback, context) {
    if (callback instanceof Function) {
      this.queue.push(callback.bind(context || this.context));
      this.runQueue();
    }
    return this;
  }

  delay() {
    this.queue.push(undefined);
    this.runQueue();
    return this;
  }

  runQueue() {
    if (this.queueInProgress) {
      return;
    }
    this.queueInProgress = true;
    requestAnimationFrame(this.queueLoop.bind(this));
  }

  queueLoop() {
    const callback = this.queue.shift();
    callback instanceof Function && callback();

    if (!this.queue.length) {
      this.queueInProgress = false;
    } else {
      requestAnimationFrame(this.queueLoop.bind(this));
    }
  }

  clear() {
    this.queue = [];
  }
}