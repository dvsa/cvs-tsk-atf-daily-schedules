import {
  createLogger, format, transports, LogEntry,
} from 'winston';
import WinstonCloudwatch from 'winston-cloudwatch';

const {
  combine, timestamp, printf, colorize,
} = format;

const logFormat = printf((info) => {
  // Checks if log is an error - has stack info
  if (info.stack) {
    return `${info.level}: ${info.timestamp as string}: ${info.stack as string}`;
  }
  return `${info.level}: ${info.timestamp as string}: ${info.message}`;
});

const localDevConfig = {
  level: 'debug',
  format: combine(
    timestamp({
      format: 'MMM-DD-YYYY HH:mm:ss',
    }),
    colorize(),
    logFormat,
  ),
};

const cloudwatchConfig = {
  name: 'CloudWatch Logger',
  logGroupName: process.env.CLOUDWATCH_GROUP_NAME || '',
  logStreamName: `${process.env.CLOUDWATCH_GROUP_NAME}: ${process.env.NODE_ENV}` || '',
  awsAccessKeyId: process.env.CLOUDWATCH_ACCESS_KEY || '',
  awsSecretKey: process.env.CLOUDWATCH_SECRET_ACCESS_KEY || '',
  awsRegion: process.env.CLOUDWATCH_REGION || '',
  level: 'error',
  messageFormatter: ({ level, message, meta }: LogEntry) => `[${level}]: ${message} \nAdditional Info: ${JSON.stringify(meta)}`,
};

const logger = createLogger();

if (process.env.NODE_ENV === 'production') {
  // When running in prod, transport logs to CloudWatch
  logger.add(new WinstonCloudwatch(cloudwatchConfig));
} else {
  logger.add(new transports.Console(localDevConfig));
}

export default logger;
