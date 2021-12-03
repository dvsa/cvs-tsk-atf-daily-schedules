/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import 'source-map-support/register';
import { ScheduledEvent } from 'aws-lambda';
import { sendEvents } from './eventbridge/send';
import { getEvents } from './wms/ExportEvents';

const {
  NODE_ENV, SERVICE, AWS_REGION, AWS_PROVIDER_STAGE,
} = process.env;

console.log(
  `\nRunning Service:\n '${SERVICE}'\n mode: ${NODE_ENV}\n stage: '${AWS_PROVIDER_STAGE}'\n region: '${AWS_REGION}'\n\n`,
);

const handler = async (event: ScheduledEvent): Promise<{ statusCode: number; body: string }> => {
  try {
    console.log(`Function triggered with '${JSON.stringify(event)}'.`);

    let exportDate: Date;
    if (event?.detail?.exportDate) {
      exportDate = getDateFromManualTrigger(event.detail.exportDate as string);
    } else {
      exportDate = new Date(Date.now());
    }

    const facilitySchedules = await getEvents(exportDate);
    await sendEvents(facilitySchedules);

    console.log('Data processed successfully.');
    return { statusCode: 200, body: 'Data processed successfully.' };
  } catch (error) {
    console.log('Data processed unsuccessfully.');
    console.error(error);

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
