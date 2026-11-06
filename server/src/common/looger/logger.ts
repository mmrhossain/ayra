import winston from "winston";

const isVercel = process.env.VERCEL === "1";

export const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
      stderrLevels: ["error"],
    }),
    ...(isVercel
      ? []
      : [
          new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
          }),
          new winston.transports.File({
            filename: "logs/combined.log",
          }),
        ]),
  ],
});
