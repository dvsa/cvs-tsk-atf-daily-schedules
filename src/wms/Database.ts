/* eslint-disable @typescript-eslint/no-unsafe-call */
import dateformat from 'dateformat';
import { Signer } from 'aws-sdk/clients/rds';
import { knex, Knex } from 'knex';
import { StaffSchedule } from './Interfaces/StaffSchedule';
import { getSecret } from '../filterUtils';
import logger from '../observability/logger';

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
    logger.info('getstaffSchedules starting');
    const secret: string[] = await getSecret(process.env.SECRET_NAME);
    const query = await this.connection
      .select('NGT_SITE.C_ID', 'NGT_STAFF.STAFF_ID', 'STATUS', 'EVENT_DATE', 'EVENT_START', 'EVENT_END')
      .from<StaffSchedule>('NGT_SITE_EVENTS')
      .innerJoin('NGT_STAFF', 'NGT_SITE_EVENTS.STAFF_ID', 'NGT_STAFF.ID')
      .innerJoin('NGT_SITE', 'NGT_SITE_EVENTS.SITE_ID', 'NGT_SITE.ID')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      .where('EVENT_DATE', '=', dateformat(exportDate, 'yyyy-mm-dd'))
      .havingIn('NGT_SITE.C_ID', secret);

    logger.info('getstaffSchedules ending');
    return query as StaffSchedule[];
  }

  public closeConnection(): Promise<void> {
    return this.connection.destroy();
  }
}
