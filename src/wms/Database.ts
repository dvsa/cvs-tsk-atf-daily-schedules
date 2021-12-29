/* eslint-disable @typescript-eslint/no-unsafe-call */
import dateformat from 'dateformat';
import { Signer } from 'aws-sdk/clients/rds';
import { knex, Knex } from 'knex';
import { StaffSchedule } from './Interfaces/StaffSchedule';

export class Database {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private connection?: Knex<any, unknown[]>;

  constructor() {
    const config: Knex.MySql2ConnectionConfig = {
      host: process.env.WMS_HOST,
      port: parseInt(process.env.WMS_PORT, 10),
      user: process.env.WMS_USER,
      database: process.env.WMS_SCHEMA,
      dateStrings: true,
      ssl: process.env.WMS_SSL_CERT,
    };

    if (process.env.WMS_PASSWORD) {
      config.password = process.env.WMS_PASSWORD;
    } else {
      const signer = new Signer();
      const token = signer.getAuthToken({
        region: process.env.AWS_REGION,
        hostname: process.env.WMS_HOST,
        port: parseInt(process.env.WMS_PORT, 10),
        username: process.env.WMS_USER,
      });

      config.authPlugins = {
        mysql_clear_password: () => () => token,
      };
    }

    this.connection = knex({
      client: 'mysql2',
      connection: config,
    });
  }

  public async getstaffSchedules(exportDate: Date): Promise<StaffSchedule[]> {
    console.info('getstaffSchedules starting');

    const query = await this.connection
      .select('ngt_site.c_id', 'ngt_staff.staff_id', 'status', 'event_date', 'event_start', 'event_end')
      .from<StaffSchedule>('ngt_site_events')
      .innerJoin('ngt_staff', 'ngt_site_events.staff_id', 'ngt_staff.id')
      .innerJoin('ngt_site', 'ngt_site_events.site_id', 'ngt_site.id')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      .where('event_date', '=', dateformat(exportDate, 'yyyy-mm-dd'));
    // TODO: add filtrering for 5 vtfs
    // .havingIn('ngt_site.site_id', [])

    console.info('getstaffSchedules ending');

    return query as StaffSchedule[];
  }

  public closeConnection(): Promise<void> {
    return this.connection.destroy();
  }
}
