import { mockClient } from 'aws-sdk-client-mock';
import {
  EventBridgeClient, PutEventsCommand, PutEventsResultEntry,
} from '@aws-sdk/client-eventbridge';
import { SendResponse } from '../../src/eventbridge/SendResponse';
import { sendEvents } from '../../src/eventbridge/send';
import { FacillitySchedules } from '../../src/wms/Interfaces/DynamicsCE';

const eventBridgeMock = mockClient(EventBridgeClient);

describe('Send events', () => {
  describe('Events sent', () => {
    beforeEach(() => {
      eventBridgeMock.reset();
    });
    it('GIVEN one event to send WHEN sent THEN one event is returned.', async () => {
      const mFacillitySchedules = Array<FacillitySchedules>(1);
      const mSendResponse: SendResponse = { SuccessCount: 1, FailCount: 0 };
      eventBridgeMock.on(PutEventsCommand).resolves({
        FailedEntryCount: 0,
        Entries: Array<PutEventsResultEntry>(1),
      });
      await expect(sendEvents(mFacillitySchedules)).resolves.toEqual(mSendResponse);
    });

    it('GIVEN two events to send WHEN sent THEN two events are returned.', async () => {
      const mFacillitySchedules = Array<FacillitySchedules>(2);
      const mSendResponse: SendResponse = { SuccessCount: 2, FailCount: 0 };
      eventBridgeMock.on(PutEventsCommand).resolves({
        FailedEntryCount: 0,
        Entries: Array<PutEventsResultEntry>(2),
      });
      await expect(sendEvents(mFacillitySchedules)).resolves.toEqual(mSendResponse);
    });

    it('GIVEN an issue with eventbridge WHEN 6 events are sent and 1 fails THEN the failure is in the response.', async () => {
      const mFacillitySchedules = Array<FacillitySchedules>(6);
      const errorFacillitySchedules: FacillitySchedules = { testfacilityid: 'Error', eventdate: 'Now' };
      mFacillitySchedules[0] = errorFacillitySchedules;
      eventBridgeMock.on(PutEventsCommand).callsFake((params: { Entries: [{ Detail }] }) => {
        if (params.Entries[0].Detail !== '{ "schedule": "undefined" }') {
          return new Error('oh no');
        }
        return { Entries: [{}] };
      });

      const mSendResponse: SendResponse = { SuccessCount: 5, FailCount: 1 };
      await expect(sendEvents(mFacillitySchedules)).resolves.toEqual(mSendResponse);
    });
  });
});
