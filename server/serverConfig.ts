import { loadServerConfig } from "./config.js";

// Throws on a cold start if the environment is misconfigured, naming every
// bad variable, instead of failing later with a confusing error.
export const serverConfig = loadServerConfig(process.env);
