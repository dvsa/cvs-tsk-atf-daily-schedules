import { mocked } from 'ts-jest/utils';
import { Database } from '../../src/wms/Database';
import { getEvents } from '../../src/wms/ExportEvents';
import { StaffSchedule } from '../../src/wms/Interfaces/StaffSchedule';
import logger from '../../src/observability/logger';

jest.mock('../../src/wms/Database');
const mDatabase = mocked(Database, true);
const schedule1 = getSchedule('site1', 1);
const schedule2 = getSchedule('site1', 2);
const schedule3 = getSchedule('site2', 3);

let mDatabaseImp = {
  getstaffSchedules: jest.fn().mockResolvedValue([schedule1, schedule2, schedule3]),
  closeConnection: jest.fn().mockImplementation(() => Promise.resolve()),
};

mDatabase.mockImplementation(() => mDatabaseImp);

const exportDate = '2021-10-10T10:10:10.000Z';

describe('Export events', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEvents', () => {
    it('GIVEN three schedules returned for two distinct sites WHEN processed THEN two orders are returned.', async () => {
      const schedules = await getEvents(exportDate);
      expect(schedules).toHaveLength(2);
    });

    it('GIVEN two schedules returned for one site WHEN processed THEN one order has two VSAs.', async () => {
      const schedules = await getEvents(exportDate);
      expect(schedules[0].vsa).toHaveLength(2);
      expect(schedules[0].vsa[0].testerid).toEqual(1);
      expect(schedules[0].vsa[1].testerid).toEqual(2);
    });

    it('GIVEN one schedule returned for one site WHEN processed THEN one order has one VSA.', async () => {
      const schedules = await getEvents(exportDate);
      expect(schedules[1].vsa).toHaveLength(1);
      expect(schedules[1].vsa[0].testerid).toEqual(3);
    });

    it('GIVEN a call to the function WHEN no date is passed in THEN the database is called with the current date.', async () => {
      jest.spyOn(global.Date, 'now').mockImplementation(() => new Date('2021-10-10T11:02:28.637Z').valueOf());

      await getEvents();
      expect(mDatabaseImp.getstaffSchedules).toHaveBeenCalledTimes(1);
      expect(mDatabaseImp.getstaffSchedules).toBeCalledWith(new Date(Date.now()));
    });

    it('GIVEN a call to the function WHEN a date is passed in THEN the database is called with that date.', async () => {
      await getEvents(exportDate);
      expect(mDatabaseImp.getstaffSchedules).toHaveBeenCalledTimes(1);
      expect(mDatabaseImp.getstaffSchedules).toBeCalledWith(new Date(exportDate));
    });

    it('GIVEN a call to the function WHEN an invalid date is passed in THEN an error is thrown.', async () => {
      const invalidDate = 'I am not a date!';
      const inValidDateError = new Error(`Failed to manually trigger function. Invalid input date ${invalidDate}`);

      await expect(getEvents(invalidDate))
        .rejects
        .toThrowError(inValidDateError);
    });

    it('GIVEN a call to the database WHEN an error from the database occurs THEN getEvents returns an error.', async () => {
      const error = new Error('Oh no!');
      mDatabaseImp = {
        getstaffSchedules: jest.fn().mockRejectedValue(error),
        closeConnection: jest.fn().mockImplementation(() => Promise.resolve()),
      };

      await getEvents(exportDate).catch((err) => {
        expect(err).toBe(error);
      });
    });

    it('GIVEN a call to the database WHEN an error from the database occurs and close connection errors THEN getEvents returns an error.', async () => {
      jest.spyOn(logger, 'error');
      const error1 = new Error('Oh no 1!');
      const error2 = new Error('Oh no 2!');
      mDatabaseImp = {
        getstaffSchedules: jest.fn().mockRejectedValue(error1),
        closeConnection: jest.fn().mockImplementation(() => Promise.reject(error2)),
      };

      await getEvents(exportDate).catch((error) => {
        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.error).toHaveBeenCalledWith(error2);
        expect(error).toBe(error1);
      });
    });
  });
});

function getSchedule(cId: string, staffId: number): StaffSchedule {
  return {
    c_id: cId,
    staff_id: staffId,
    status: 'New',
    event_date: '2021-10-20',
    event_start: '11:00',
    event_end: '13:00',
  };
}
