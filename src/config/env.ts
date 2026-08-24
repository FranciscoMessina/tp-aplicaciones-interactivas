const DEFAULT_PORT = 8080;

const getRequiredEnvironmentVariable = (name: string): string => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not defined`);
  }

  return value;
};

const parsePort = (value: string | undefined): number => {
  if (!value) {
    return DEFAULT_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  return port;
};

export const env = Object.freeze({
  mongoUri: getRequiredEnvironmentVariable("MONGODB_URI"),
  port: parsePort(process.env.PORT),
});
