import { knex, Knex } from 'knex';
import { mocked } from 'ts-jest/utils';
import { StaffSchedule } from '../../src/wms/Interfaces/StaffSchedule';
import { Database } from '../../src/wms/Database';

jest.mock('knex');
const mknex = mocked(knex, true);
const ent = {
  site_id: 'string',
  staff_id: 2,
  status: 'string',
  event_date: 'string',
  event_start: 'string',
  event_end: 'string',
};
const mKnex = ({
  select: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn(() => [ent]),
  destroy: jest.fn().mockResolvedValue('destroyed'),
} as unknown) as Knex;

mknex.mockImplementation(
// eslint-disable-next-line @typescript-eslint/no-unsafe-return
  () => mKnex,
);

// Needs to be created after all the knex mocking.
const database = new Database();

describe('Database calls', () => {
  describe('getstaffSchedules', () => {
    it('GIVEN a call to getstaffSchedules WHEN everything works THEN staffSchedules are returned.', async () => {
      jest
        .spyOn(global.Date, 'now')
        .mockImplementationOnce(
          () => new Date('2021-10-10T11:02:28.637Z').valueOf(),
        );
      const staffSchedules: StaffSchedule[] = await database.getstaffSchedules();
      expect(mKnex.select).toBeCalledWith('ngt_site.c_id', 'ngt_staff.staff_id', 'status', 'event_date', 'event_start', 'event_end');
      expect(mKnex.innerJoin).toBeCalledWith('ngt_staff', 'ngt_site_events.staff_id', 'ngt_staff.id');
      expect(mKnex.innerJoin).toBeCalledWith('ngt_site', 'ngt_site_events.site_id', 'ngt_site.id');
      expect(mKnex.from).toBeCalledWith('ngt_site_events');
      expect(mKnex.where).toBeCalledWith('event_date', '=', '2021-10-10');
      expect(staffSchedules).toHaveLength(1);
    });

    it('GIVEN a call to closeConnection WHEN everything works THEN we get no errors.', async () => {
      await database.closeConnection();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mKnex.destroy).toBeCalledTimes(1);
    });
  });
});
