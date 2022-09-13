import { knex, Knex } from 'knex';
import { mocked } from 'ts-jest/utils';
import { StaffSchedule } from '../../src/wms/Interfaces/StaffSchedule';
import { Database } from '../../src/wms/Database';
import { getSecret } from '../../src/filterUtils';

jest.mock('aws-sdk/clients/rds', () => {
  const mSignerInstance = {
    getAuthToken: jest.fn().mockReturnValue('I am a token!'),
  };
  const mSigner = jest.fn(() => mSignerInstance);

  return { Signer: mSigner };
});

jest.mock('../../src/filterUtils');

jest.mock('knex');
const mknex = mocked(knex, true);
const ent = {
  C_ID: 'string',
  STAFF_ID: 2,
  STATUS: 'string',
  EVENT_DATE: 'YYYY-MM-DD 00:00:00',
  EVENT_START: 'string',
  EVENT_END: 'string',
};
let mKnex = ({
  select: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  havingIn: jest.fn(() => [ent]),
  destroy: jest.fn().mockResolvedValue('destroyed'),
} as unknown) as Knex;

mknex.mockImplementation(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  () => mKnex,
);

const exportDate = new Date('2021-10-10T10:10:10.000Z');

describe('Database calls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getstaffSchedules', () => {
    it('GIVEN a call to getstaffSchedules WHEN everything works THEN staffSchedules are returned.', async () => {
      const database = new Database();

      const filters: string[] = new Array<string>('100', '101');
      mocked(getSecret).mockResolvedValue(filters);

      jest.spyOn(global.Date, 'now').mockImplementationOnce(() => new Date('2021-10-10T11:02:28.637Z').valueOf());

      const staffSchedules: StaffSchedule[] = await database.getstaffSchedules(exportDate);
      expect(mKnex.select).toBeCalledWith(
        'C_ID',
        'STAFF_ID',
        'STATUS',
        'EVENT_DATE',
        'EVENT_START',
        'EVENT_END',
      );
      expect(mKnex.from).toBeCalledWith('Daily_Booking_Alterations');
      expect(mKnex.where).toBeCalledWith('EVENT_DATE', '=', '2021-10-10');
      expect(mKnex.havingIn).toBeCalledWith('C_ID', ['100', '101']);
      expect(staffSchedules).toHaveLength(1);
    });

    it('GIVEN a call to getstaffSchedules WHEN empty list returned THEN error thrown.', async () => {
      mKnex = ({
        select: jest.fn().mockReturnThis(),
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        havingIn: jest.fn(() => []),
        destroy: jest.fn().mockResolvedValue('destroyed'),
      } as unknown) as Knex;

      const database = new Database();
      const filters: string[] = new Array<string>('100', '101');
      const nullError = new EvalError('No daily schedules found in WMS, check connection or content');
      mocked(getSecret).mockResolvedValue(filters);

      jest.spyOn(global.Date, 'now').mockImplementationOnce(() => new Date('2021-10-10T11:02:28.637Z').valueOf());

      await database.getstaffSchedules(exportDate).catch((error) => {
        expect(error).toEqual(nullError);
      });
      expect(mKnex.select).toBeCalledWith(
        'C_ID',
        'STAFF_ID',
        'STATUS',
        'EVENT_DATE',
        'EVENT_START',
        'EVENT_END',
      );
      expect(mKnex.from).toBeCalledWith('Daily_Booking_Alterations');
      expect(mKnex.where).toBeCalledWith('EVENT_DATE', '=', '2021-10-10');
      expect(mKnex.havingIn).toBeCalledWith('C_ID', ['100', '101']);
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
