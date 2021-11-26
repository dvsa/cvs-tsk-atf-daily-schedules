import { mocked } from 'ts-jest/utils';
import { Database } from '../../src/wms/Database';
import { getEvents } from '../../src/wms/ExportEvents';

jest.mock('../../src/wms/Database');
const mDatabase = mocked(Database, true);
const ent = {
  site_id: '123',
  staff_id: 2,
  status: 'New',
  event_date: '2021-10-20',
  event_start: '09:00',
  event_end: '10:00',
};
let mDatabaseImp = ({
  getstaffSchedules: jest.fn().mockResolvedValue([ent]),
  closeConnection: jest.fn().mockImplementation(() => Promise.resolve()),
});

mDatabase.mockImplementation(
  () => mDatabaseImp,
);

jest.spyOn(global.console, 'error').mockImplementation(() => {});

describe('Database calls', () => {
  beforeEach(() => {
  });

  afterEach(() => {
  });

  describe('getEvents', () => {
    it('GIVEN one schedule returned from database WHEN processed THEN one order is returned.', async () => {
      const schedules = await getEvents();
      expect(schedules).toHaveLength(1);
    });

    it('GIVEN a call to the database WHEN an error from the database occurs THEN getEvents returns an error.', async () => {
      const error = new Error('Oh no!');
      mDatabaseImp = ({
        getstaffSchedules: jest.fn().mockRejectedValue(error),
        closeConnection: jest.fn().mockImplementation(() => Promise.resolve()),
      });

      await getEvents().catch((err) => {
        expect(err).toBe(error);
      });
    });

    it('GIVEN a call to the database WHEN an error from the database occurs and close connection errors THEN getEvents returns an error.', async () => {
      jest.spyOn(global.console, 'error').mockImplementation(() => {});
      const error1 = new Error('Oh no 1!');
      const error2 = new Error('Oh no 2!');
      mDatabaseImp = ({
        getstaffSchedules: jest.fn().mockRejectedValue(error1),
        closeConnection: jest.fn().mockImplementation(() => Promise.reject(error2)),
      });

      await getEvents().catch((error) => {
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith(error2);
        expect(error).toBe(error1);
      });
    });
  });
});
