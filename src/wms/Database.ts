/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Knex, knex } from 'knex';
import dateformat from 'dateformat';
import StaffSchedule from './Interfaces/StaffSchedule';

export class Database {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private connection: Knex<any, unknown[]>;

  constructor() {
    this.connection = knex({
      client: 'mysql',
      connection: {
        host: process.env.WMS_HOST,
        port: parseInt(process.env.WMS_PORT, 10),
        user: process.env.WMS_USER,
        password: process.env.WMS_PASSWORD,
        database: process.env.WMS_SCHEMA,
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public async getstaffSchedules() {
    const query = await this.connection.select('ngt_site.site_id', 'ngt_staff.staff_id', 'status', 'event_date', 'event_start', 'event_end')
      .from<StaffSchedule>('ngt_site_events')
      .innerJoin('ngt_staff', 'ngt_site_events.staff_id', 'ngt_staff.id')
      .innerJoin('ngt_site', 'ngt_site_events.site_id', 'ngt_site.id')
      .where('event_date', '=', dateformat(new Date(), 'yyyy-mm-dd'));
      // TODO: add filtrering for 5 vtfs
      // .havingIn('ngt_site.site_id', [])
    return (query as StaffSchedule[]);
  }

  public closeConnection(): Promise<void> {
    return this.connection.destroy();
  }
}
