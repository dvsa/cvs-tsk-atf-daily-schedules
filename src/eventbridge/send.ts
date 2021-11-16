import AWS from 'aws-sdk';
import EventEntry from './EventEntry';
import EventParams from './EventParams';

const eventbridge = new AWS.EventBridge();

const sendEvents = async (event: { requestContext: { accountId: string } }): Promise<string> => {
  const params: EventParams = {
    Entries: [],
  };

  const entry: EventEntry = {
    Source: 'wms', // TODO: choose better source name.
    Detail: JSON.stringify(event.requestContext.accountId),
    DetailType: event.requestContext.accountId,
    EventBusName: '?',
    Time: new Date(),
  };

  params.Entries.push(entry);
  try {
    await eventbridge.putEvents(params).promise();
  } catch (error) {
    // Swallow error for the timebeing.
  }

  console.log('Data: %j', event.requestContext.accountId);

  return `Successfully processed ${event.requestContext.accountId} records.`;
};

export { sendEvents };
