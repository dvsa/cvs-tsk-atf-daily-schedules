/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Signer } from 'aws-sdk/clients/rds';
import dateformat from 'dateformat';
import { knex, Knex } from 'knex';
import { getSecret } from '../filterUtils';
import logger from '../observability/logger';
import { StaffSchedule } from './Interfaces/StaffSchedule';

interface SqlQueryResults {
  C_ID: string;
  STAFF_ID: string;
  STATUS: string;
  EVENT_DATE: string;
  EVENT_START: string;
  EVENT_END: string;
}

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
    const query: SqlQueryResults[] = await this.connection
      .select('NGT_SITE.C_ID', 'NGT_STAFF.STAFF_ID', 'STATUS', 'EVENT_DATE', 'EVENT_START', 'EVENT_END')
      .from<StaffSchedule>('NGT_SITE_EVENTS')
      .innerJoin('NGT_STAFF', 'NGT_SITE_EVENTS.STAFF_ID', 'NGT_STAFF.STAFF_ID')
      .innerJoin('NGT_SITE', 'NGT_SITE_EVENTS.SITE_ID', 'NGT_SITE.SITE_ID')
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      .where('EVENT_DATE', '=', dateformat(exportDate, 'yyyy-mm-dd'))
      .where('STATUS', 'ALLOCATED')
      .havingIn('NGT_SITE.C_ID', secret);

    logger.info('getstaffSchedules ending');

    if (query.length === 0) {
      throw new EvalError('No daily schedules found in WMS, check coneection or content');
    }

    return query.map<StaffSchedule>((q) => {
      this.validate(q.C_ID, 'C_ID');

      logger.info(`Processing C_ID: ${q.C_ID}`);

      this.validate(q.STAFF_ID, 'STAFF_ID');
      this.validate(q.STATUS, 'STATUS');
      this.validate(q.EVENT_DATE, 'EVENT_DATE');
      this.validate(q.EVENT_START, 'EVENT_START');
      this.validate(q.EVENT_END, 'EVENT_END');

      const schedule: StaffSchedule = {
        c_id: q.C_ID,
        staff_id: parseInt(q.STAFF_ID, 10),
        status: q.STATUS,
        event_date: q.EVENT_DATE.split(' ')[0], // We only want the date part from "YYYY-MM-DD 00:00:00"
        event_start: q.EVENT_START,
        event_end: q.EVENT_END,
      };

      return schedule;
    });
  }

  validate<T>(val: T, name: string) {
    if (!val) {
      throw new Error(`${name} has no value`);
    }
  }

  public closeConnection(): Promise<void> {
    return this.connection.destroy();
  }
}
