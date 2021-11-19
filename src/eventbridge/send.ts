import AWS from 'aws-sdk';
import EventEntry from './EventEntry';
import Entries from './Entries';

const eventbridge = new AWS.EventBridge();

const sendEvents = async (event: number): Promise<number> => {
  const params: Entries = {
    Entries: [],
  };

  for (let i = 0; i < event; i++) {
    const entry: EventEntry = {
      Source: process.env.AWS_EVENT_BUS_SOURCE,
      Detail: JSON.stringify({ message: 'I\'m a message.' }),
      DetailType: event.toString(),
      EventBusName: process.env.AWS_EVENT_BUS_NAME,
      Time: new Date(),
    };

    params.Entries.push(entry);
  }

  try {
    const result = await eventbridge.putEvents(params).promise();
    console.log(`${result.Entries.length} ${result.Entries.length === 1 ? 'event' : 'events'} sent to eventbridge.`);
    return result.Entries.length;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export { sendEvents };
