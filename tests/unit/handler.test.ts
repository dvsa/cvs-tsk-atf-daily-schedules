/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { mocked } from 'ts-jest/utils';
import { ScheduledEvent } from 'aws-lambda';
import { handler } from '../../src/handler';
import { sendEvents } from '../../src/eventbridge/send';
import { SendResponse } from '../../src/eventbridge/SendResponse';
import { getEvents } from '../../src/wms/ExportEvents';
import { FacillitySchedules } from '../../src/wms/Interfaces/DynamicsCE';
import logger from '../../src/observability/logger';

jest.mock('../../src/eventbridge/send');
jest.mock('../../src/wms/ExportEvents');
jest.mock('../../src/utils');

describe('Application entry', () => {
  let event: ScheduledEvent;
  mocked(getEvents).mockResolvedValue(Array<FacillitySchedules>());

  beforeEach(() => {
    event = {
      version: '0',
      id: '0',
      'detail-type': 'Scheduled Event',
      source: '',
      account: '',
      time: '',
      region: '',
      resources: [],
      detail: {},
    };
  });

  afterEach(() => {
    jest.resetAllMocks().restoreAllMocks();
  });

  describe('Handler', () => {
    it('GIVEN a call to the function WHEN events are processed succesfully THEN a callback result is returned.', async () => {
      const mSendResponse: SendResponse = { SuccessCount: 1, FailCount: 0 };
      mocked(sendEvents).mockResolvedValue(mSendResponse);
      await handler(event, null, (error: string | Error, result: string) => {
        expect(result).toEqual('Data processed successfully.');
        expect(error).toBeNull();
      });
    });

    it('GIVEN a call to the function WHEN events are processed unsuccesfully THEN a callback error is returned.', async () => {
      mocked(sendEvents).mockRejectedValue(new Error('Oh no!'));
      await handler(event, null, (error: string | Error, result: string) => {
        expect(error).toEqual(new Error('Data processed unsuccessfully.'));
        expect(result).toBeUndefined();
      });
    });

    it('GIVEN a call to the function WHEN no date is passed in THEN the database is called with the current date.', async () => {
      jest.spyOn(global.Date, 'now').mockImplementation(() => new Date('2021-10-10T11:02:28.637Z').valueOf());
      await handler(event, null, () => {});
      expect(getEvents).toBeCalledWith(new Date(Date.now()));
    });

    it('GIVEN a call to the function WHEN a date is passed in THEN the database is called with that date.', async () => {
      event.detail = { exportDate: '2021-11-11' };
      await handler(event, null, () => {});
      expect(getEvents).toBeCalledWith(new Date('2021-11-11'));
    });

    it('GIVEN a call to the function WHEN an invalid date is passed in THEN an error is thrown.', async () => {
      event.detail = { exportDate: 'I am not a date!' };
      const error = new Error(`Failed to manually trigger function. Invalid input date ${event.detail.exportDate}`);
      await handler(event, null, () => {}).catch((err) => {
        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(error);
        expect(err).toBe(error);
      });
    });
  });
});
