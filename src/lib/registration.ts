export function isRegistrationEnabled() {
  return process.env.REGISTRATION_ENABLED?.toLowerCase() !== "false";
}
