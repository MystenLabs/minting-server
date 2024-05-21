export function generatePID() {
  const unixTimestamp = Date.now();
  return unixTimestamp + "-" + generateRandomBase36String();
}

function generateRandomBase36String() {
  return Math.random().toString(36).substring(2, 15);
}
