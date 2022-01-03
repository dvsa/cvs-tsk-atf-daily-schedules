/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import 'source-map-support/register';
import { ScheduledEvent } from 'aws-lambda';
import { sendEvents } from './eventbridge/send';
import { getEvents } from './wms/ExportEvents';
import logger from './observability/logger';

const {
  NODE_ENV, SERVICE, AWS_REGION, AWS_STAGE,
} = process.env;

logger.debug(
  `\nRunning Service:\n '${SERVICE}'\n mode: ${NODE_ENV}\n stage: '${AWS_STAGE}'\n region: '${AWS_REGION}'\n\n`,
);

const handler = async (event: ScheduledEvent): Promise<{ statusCode: number; body: string }> => {
  try {
    logger.debug(`Function triggered with '${JSON.stringify(event)}'.`);

    let exportDate: Date;
    if (event?.detail?.exportDate) {
      exportDate = getDateFromManualTrigger(event.detail.exportDate as string);
    } else {
      exportDate = new Date(Date.now());
    }

    const facilitySchedules = await getEvents(exportDate);
    await sendEvents(facilitySchedules);

    logger.info('Data processed successfully.');
    return { statusCode: 200, body: 'Data processed successfully.' };
  } catch (error) {
    logger.info('Data processed unsuccessfully.');
    logger.error('', error);

    return { statusCode: 500, body: 'Data processed unsuccessfully.' };
  }
};

function getDateFromManualTrigger(inputDate: string): Date {
  const isValidDate = !Number.isNaN(Date.parse(inputDate));
  if (!isValidDate) {
    throw new Error(`Failed to manually trigger function. Invalid input date ${inputDate}`);
  }
  return new Date(inputDate);
}

export { handler };
