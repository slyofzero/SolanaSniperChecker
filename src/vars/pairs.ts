interface PairsToTrack {
  [key: string]: {
    startTime: number;
    initialPrice: number;
    pastBenchmark: number;
  };
}

export let pairsToTrack: PairsToTrack = {};

export function setPairsToTrack(newPairsToTrack: PairsToTrack) {
  pairsToTrack = newPairsToTrack;
}
