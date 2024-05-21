/// Generates a PID by concatenating 2 Base36 random strings.
export function generatePID() {
  return generateRandomBase36String() + generateRandomBase36String();
}

function generateRandomBase36String() {
  return Math.random().toString(36).substring(2, 15);
}
