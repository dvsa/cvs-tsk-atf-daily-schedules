/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { mocked } from 'ts-jest/utils';
import { handler } from '../../src/handler';
import { sendEvents } from '../../src/eventbridge/send';
import { SendResponse } from '../../src/eventbridge/SendResponse';
import { getEvents } from '../../src/wms/ExportEvents';
import { FacillitySchedules } from '../../src/wms/Interfaces/DynamicsCE';

jest.mock('../../src/eventbridge/send');
jest.mock('../../src/wms/ExportEvents');
jest.mock('../../src/utils');

describe('Application entry', () => {
  let event;
  mocked(getEvents).mockResolvedValue(Array<FacillitySchedules>());

  beforeEach(() => {
    event = { };
  });

  afterEach(() => {
    jest.resetAllMocks().restoreAllMocks();
  });

  describe('Handler', () => {
    it('GIVEN a call to the function WHEN events are processed succesfully THEN a 200 is returned.', async () => {
      const mSendResponse: SendResponse = { SuccessCount: 1, FailCount: 0 };
      mocked(sendEvents).mockResolvedValue(mSendResponse);
      const response: { statusCode: number, body: string } = await handler(event);
      expect(response.statusCode).toEqual(200);
      expect(typeof response.body).toBe('string');
    });

    it('GIVEN a call to the function WHEN events are processed unsuccesfully THEN a 500 is returned.', async () => {
      mocked(sendEvents).mockRejectedValue(new Error('Oh no!'));
      const response: { statusCode: number, body: string } = await handler(event);
      expect(response.statusCode).toEqual(500);
      expect(typeof response.body).toBe('string');
    });

    it('GIVEN a call to the function WHEN no date is passed in THEN the database is called with the current date.', async () => {
      jest
        .spyOn(global.Date, 'now')
        .mockImplementation(
          () => new Date('2021-10-10T11:02:28.637Z').valueOf(),
        );
      await handler(event);
      expect(getEvents).toBeCalledWith(new Date(Date.now()));
    });

    it('GIVEN a call to the function WHEN a date is passed in THEN the database is called with that date.', async () => {
      event = { exportDate: '2021-11-11' };
      await handler(event);
      expect(getEvents).toBeCalledWith(new Date('2021-11-11'));
    });

    it('GIVEN a call to the function WHEN an invalid date is passed in THEN an error is thrown.', async () => {
      event = { exportDate: 'I am not a date!' };
      const error = new Error(`Failed to manually trigger function. Invalid input date ${event.exportDate}`);
      await handler(event).catch((err) => {
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith(error);
        expect(err).toBe(error);
      });
    });
  });
});
