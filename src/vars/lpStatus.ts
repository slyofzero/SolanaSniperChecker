export type LPStatus = [string, boolean, number];

export let lpStatuses: LPStatus[] = [];
export let prevLpStatuses: LPStatus[] = [];

export function addLpStatus(newLpStatus: LPStatus) {
  prevLpStatuses = lpStatuses;
  lpStatuses.push(newLpStatus);
}

export function setLpStatuses(newLpStatuses: LPStatus[]) {
  prevLpStatuses = lpStatuses;
  lpStatuses = newLpStatuses;
}
