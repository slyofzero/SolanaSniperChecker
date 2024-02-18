export function getNow() {
  return new Date().toISOString();
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getSecondsElapsed(timestamp: number) {
  return Math.floor(new Date().getTime() / 1e3) - timestamp;
}
