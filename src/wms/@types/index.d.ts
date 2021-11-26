import { StaffSchedule } from '../Interfaces/StaffSchedule';

declare module 'knex/types/tables' {
  interface Tables {
    EDH_WMS_STAGING: StaffSchedule;
  }
}
