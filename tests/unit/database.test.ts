import { knex, Knex } from 'knex';
import { mocked } from 'ts-jest/utils';
import { StaffSchedule } from '../../src/wms/Interfaces/StaffSchedule';
import { Database } from '../../src/wms/Database';

jest.mock('aws-sdk/clients/rds', () => {
  const mSignerInstance = {
    getAuthToken: jest.fn().mockReturnValue('I am a token!'),
  };
  const mSigner = jest.fn(() => mSignerInstance);

  return { Signer: mSigner };
});

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

describe('Database calls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getstaffSchedules', () => {
    it('GIVEN a call to getstaffSchedules WHEN everything works THEN staffSchedules are returned.', async () => {
      const database = new Database();
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
      const database = new Database();
      await database.closeConnection();
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(mKnex.destroy).toBeCalledTimes(1);
    });

    it('GIVEN an IAM authenticated mysql setup WHEN the configuration is created THEN the config has the mysql_clear_password plugin.', async () => {
      const database = new Database();
      expect(mknex).toHaveBeenCalledWith({
        client: 'mysql2',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        connection: expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          authPlugins: expect.anything(),
        }),
      });
      await database.closeConnection();
    });

    it('GIVEN a password authenticated mysql setup WHEN the configuration is created THEN the config has the password variable.', async () => {
      process.env.WMS_PASSWORD = 'I am a password!';
      const database = new Database();
      expect(mknex).toHaveBeenCalledWith({
        client: 'mysql2',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        connection: expect.objectContaining({
          password: 'I am a password!',
        }),
      });
      await database.closeConnection();
    });
  });
});
