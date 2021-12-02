import { EventBridge } from 'aws-sdk';
import { EventEntry } from './EventEntry';
import { Entries } from './Entries';
import { SendResponse } from './SendResponse';
import { FacillitySchedules } from '../wms/Interfaces/DynamicsCE';
import logger from '../observability/logger';

const eventbridge = new EventBridge();
const sendEvents = async (schedules: FacillitySchedules[]): Promise<SendResponse> => {
  console.info('sendEvents starting');
  console.info(`${schedules.length} ${schedules.length === 1 ? 'event' : 'events'} ready to send to eventbridge.`);

  const sendResponse: SendResponse = {
    SuccessCount: 0,
    FailCount: 0,
  };

  for (let i = 0; i < schedules.length; i++) {
    const entry: EventEntry = {
      Source: process.env.AWS_EVENT_BUS_SOURCE,
      // eslint-disable-next-line security/detect-object-injection
      Detail: `{ "schedule": "${JSON.stringify(schedules[i])?.replace(/"/g, '\\"')}" }`,
      DetailType: 'CVS ATF Daily Schedule',
      EventBusName: process.env.AWS_EVENT_BUS_NAME,
      Time: new Date(),
    };

    const params: Entries = {
      Entries: [],
    };
    params.Entries.push(entry);

    try {
      console.debug(`event about to be sent: ${JSON.stringify(params)}`);
      // TODO Make the putEvents run in parallel?
      // eslint-disable-next-line no-await-in-loop
      const result = await eventbridge.putEvents(params).promise();
      logger.info(`${result.Entries.length} ${result.Entries.length === 1 ? 'event' : 'events'} sent to eventbridge.`);
      sendResponse.SuccessCount++;
    } catch (error) {
      logger.error('', error);
      sendResponse.FailCount++;
    }
  }

  console.info('sendEvents ending');

  return sendResponse;
};

export { sendEvents };
