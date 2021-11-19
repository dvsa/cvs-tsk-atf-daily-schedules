import AWS from 'aws-sdk';
import { mocked } from 'ts-jest/utils';
import {
  PutEventsResponse, PutEventsRequest, PutEventsResultEntry,
} from 'aws-sdk/clients/eventbridge';
import { sendEvents } from '../../src/eventbridge/send';

jest.mock('aws-sdk', () => {
  const mEventBridgeInstance = {
    putEvents: jest.fn(),
  };
  const mRequestInstance = {
    promise: jest.fn(),
  };
  const mEventBridge = jest.fn(() => mEventBridgeInstance);
  const mRequest = jest.fn(() => mRequestInstance);

  return { EventBridge: mEventBridge, Request: mRequest };
});

type PutEventsWithParams = (
  params: PutEventsRequest
) => AWS.Request<PutEventsResponse, AWS.AWSError>;

const mEventBridgeInstance = new AWS.EventBridge();
const mResultInstance = new AWS.Request<PutEventsResponse, AWS.AWSError>(null, null);
// eslint-disable-next-line @typescript-eslint/unbound-method
mocked(mEventBridgeInstance.putEvents as PutEventsWithParams).mockImplementation(
  (params: PutEventsRequest): AWS.Request<PutEventsResponse, AWS.AWSError> => {
    const mPutEventsResponse: PutEventsResponse = {
      FailedEntryCount: 0,
      Entries: Array<PutEventsResultEntry>(params.Entries.length),
    };
    if (params.Entries.length === 6) {
      mResultInstance.promise = jest.fn().mockReturnValue(Promise.reject(new Error('Oh no!')));
    } else {
      mResultInstance.promise = jest.fn().mockReturnValue(Promise.resolve(mPutEventsResponse));
    }
    return mResultInstance;
  },
);

describe('Send events', () => {
  describe('Events sent', () => {
    it('GIVEN one event to send WHEN sent THEN one event is returned.', async () => {
      await expect(sendEvents(1)).resolves.toEqual(1);
    });

    it('GIVEN two events to send WHEN sent THEN two events are returned.', async () => {
      await expect(sendEvents(2)).resolves.toEqual(2);
    });

    it('GIVEN an issue with eventbridge WHEN events are sent THEN an exception is thrown.', async () => {
      await expect(sendEvents(6)).rejects.toEqual(new Error('Oh no!'));
    });
  });
});
