/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/await-thenable */
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
jest.mock('../../src/observability/logger');

describe('Application entry', () => {
  let event: ScheduledEvent;
  mocked(getEvents).mockResolvedValue(Array<FacillitySchedules>());

  beforeEach(() => {
    jest.clearAllMocks().restoreAllMocks();

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

  describe('Handler', () => {
    it('GIVEN a call to the function WHEN events are processed succesfully THEN a callback result is returned.', (done) => {
      const mSendResponse: SendResponse = { SuccessCount: 1, FailCount: 0 };
      mocked(sendEvents).mockResolvedValue(mSendResponse);
      handler(event, null, (error: string | Error, result: string) => {
        try {
          expect(result).toEqual('Data processed successfully.');
          expect(error).toBeNull();
          done();
        } catch (doneError) {
          done(doneError);
        }
      });
    });

    it('GIVEN a call to the function WHEN events are processed unsuccesfully THEN a callback error is returned.', (done) => {
      mocked(sendEvents).mockRejectedValue(new Error('Oh no!'));
      handler(event, null, (error: string | Error, result: string) => {
        try {
          expect(error).toEqual(new Error('Data processed unsuccessfully.'));
          expect(result).toBeUndefined();
          done();
        } catch (doneError) {
          done(doneError);
        }
      });
    });

    it('GIVEN a call to the function WHEN an invalid date is passed in THEN an error is thrown.', async () => {
      event.detail = { exportDate: 'I am not a date!' };
      const inValidDateError = new Error(
        `Failed to manually trigger function. Invalid input date ${event.detail.exportDate}`,
      );
      mocked(sendEvents).mockRejectedValueOnce(inValidDateError);

      await handler(event, null, (error: string | Error, result: string) => {
        expect(error).toEqual(new Error('Data processed unsuccessfully.'));
        expect(result).toBeUndefined();
        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith('', inValidDateError);
      });
    });

    it('GIVEN a call to the function WHEN an error is thrown in getEvents THEN the error is logged.', (done) => {
      const getEventsError = new Error('getEvents error!');
      mocked(getEvents).mockRejectedValueOnce(getEventsError);
      event.detail = { exportDate: '2021-11-11' };
      handler(event, null, (error: string | Error, result: string) => {
        try {
          expect(error).toEqual(new Error('Data processed unsuccessfully.'));
          expect(result).toBeUndefined();
          expect(logger.error).toHaveBeenCalledTimes(1);
          expect(logger.error).toHaveBeenCalledWith('', getEventsError);
          done();
        } catch (doneError) {
          done(doneError);
        }
      });
    });

    it('GIVEN a call to the function WHEN an error is thrown in sendEvents THEN the error is logged.', (done) => {
      const sendEventsError = new Error('sendEvents error!');
      mocked(sendEvents).mockRejectedValueOnce(sendEventsError);
      event.detail = { exportDate: '2021-11-11' };
      handler(event, null, (error: string | Error, result: string) => {
        try {
          expect(error).toEqual(new Error('Data processed unsuccessfully.'));
          expect(result).toBeUndefined();
          expect(logger.error).toHaveBeenCalledTimes(1);
          expect(logger.error).toHaveBeenCalledWith('', sendEventsError);
          done();
        } catch (doneError) {
          done(doneError);
        }
      });
    });
  });
});
