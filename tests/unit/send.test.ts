import { mockClient } from 'aws-sdk-client-mock';
import {
  EventBridgeClient, PutEventsCommand, PutEventsResultEntry,
} from '@aws-sdk/client-eventbridge';
import { SendResponse } from '../../src/eventbridge/SendResponse';
import { sendEvents } from '../../src/eventbridge/send';
import { FacillitySchedules } from '../../src/wms/Interfaces/DynamicsCE';

const eventBridgeMock = mockClient(EventBridgeClient);
const mockPut = (params: { Entries: [{ Detail }] }) => {
  const mPutEventsResponse = {
    FailedEntryCount: 0,
    Entries: Array<PutEventsResultEntry>(params.Entries.length),
  };
  if (params.Entries[0].Detail === '{ "schedule": "{\\"testfacilityid\\":\\"Error\\",\\"eventdate\\":\\"Now\\"}" }') {
    return Promise.reject(new Error('Oh no!'));
  }
  return Promise.resolve(mPutEventsResponse);
};

describe('Send events', () => {
  describe('Events sent', () => {
    beforeEach(() => {
      eventBridgeMock.reset();
    });
    it('GIVEN one event to send WHEN sent THEN one event is returned.', async () => {
      const mFacillitySchedules = Array<FacillitySchedules>(1);
      const mSendResponse: SendResponse = { SuccessCount: 1, FailCount: 0 };
      eventBridgeMock.on(PutEventsCommand).callsFake((params: { Entries: [{ Detail }] }) => mockPut(params));
      await expect(sendEvents(mFacillitySchedules)).resolves.toEqual(mSendResponse);
    });

    it('GIVEN two events to send WHEN sent THEN two events are returned.', async () => {
      const mFacillitySchedules = Array<FacillitySchedules>(2);
      const mSendResponse: SendResponse = { SuccessCount: 2, FailCount: 0 };
      eventBridgeMock.on(PutEventsCommand).callsFake((params: { Entries: [{ Detail }] }) => mockPut(params));
      await expect(sendEvents(mFacillitySchedules)).resolves.toEqual(mSendResponse);
    });

    it('GIVEN an issue with eventbridge WHEN 6 events are sent and 1 fails THEN the failure is in the response.', async () => {
      const mFacillitySchedules = Array<FacillitySchedules>(6);
      mFacillitySchedules[0] = { testfacilityid: 'Error', eventdate: 'Now' };
      eventBridgeMock.on(PutEventsCommand).callsFake((params: { Entries: [{ Detail }] }) => mockPut(params));
      const mSendResponse: SendResponse = { SuccessCount: 5, FailCount: 1 };
      await expect(sendEvents(mFacillitySchedules)).resolves.toEqual(mSendResponse);
    });
  });
});
