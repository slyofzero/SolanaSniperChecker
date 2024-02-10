export interface HypeNewPairs {
  [key: string]: {
    startTime: number;
    initialMC: number;
    pastBenchmark: number;
    lpStatus?: boolean;
    launchMessage: number;
  };
}
