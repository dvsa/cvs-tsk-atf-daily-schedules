/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { knex } from 'knex';
import dateformat from 'dateformat';
import StaffSchedule from './StaffSchedule';

export class Database {
  private connection;

  constructor() {
    this.connection = knex({
      client: 'mysql',
      connection: {
        host: 'localhost',
        port: 3306,
        user: 'root',
        password: 'password',
        database: 'wms',
      },
    });
  }

  public get staffSchedules(): Array<StaffSchedule> {
    return this.connection
      .select('site_id', 'staff_id', 'status', 'event_date', 'event_start', 'event_end')
      .where('event_date', '=', dateformat(new Date(), 'yyyy-mm-dd'))
      .from<StaffSchedule>('EDH_WMS_STAGING');
  }

  private set staffSchedules(schedules: Array<StaffSchedule>) {
    this.staffSchedules = schedules;
  }
}
