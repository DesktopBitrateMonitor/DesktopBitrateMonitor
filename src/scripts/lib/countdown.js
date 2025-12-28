export class CountDown {
  constructor(seconds) {
    this.seconds = seconds;
    this.current = seconds;
    this.interval = null;
  }

  start(seconds) {
    this.interval = setInterval(() => {
      if (this.current > seconds) {
        this.current -= 1;
      } else {
        clearInterval(this.interval);
      }
    }, 1000);
  }

  stop() {
    clearInterval(this.interval);
    this.current = 0;
  }
}
