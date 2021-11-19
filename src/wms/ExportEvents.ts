/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import dateformat from 'dateformat';
import { Database } from './Database';
import { FacillitySchedules, Vsa } from './Interfaces/DynamicsCE';

export function getEvents(): FacillitySchedules[] {
  const database = new Database();

  const map = new Map<string, Vsa[]>();
  const facilitySchedules: FacillitySchedules[] = [];

  const schedules = database.getstaffSchedules();
  schedules.then((result) => {
    result.forEach((schedule) => {
      const vsa: Vsa = {
        status: schedule.status, testerid: schedule.staff_id, enddate: dateformat(new Date(`${schedule.event_date}T${schedule.event_end}`), 'yyyy-mm-dd\'T\'HH:MM:ss.l\'Z\''), startdate: dateformat(new Date(`${schedule.event_date}T${schedule.event_start}`), 'yyyy-mm-dd\'T\'HH:MM:ss.l\'Z\''),
      };
      if (!map.has(schedule.site_id)) {
        map.set(schedule.site_id, []);
        facilitySchedules.push({ testfacilityid: schedule.site_id, eventdate: dateformat(new Date(schedule.event_date), 'yyyy-mm-dd\'T\'HH:MM:ss.l\'Z\'') });
      }
      map.get(schedule.site_id).push(vsa);
    });

    map.forEach((vsa, facilityId) => {
      facilitySchedules.find((f) => f.testfacilityid === facilityId).vsa = vsa;
    });
  }).catch((err) => {
    console.log(err);
    database.closeConnection().catch((e) => { throw e; });
  });

  return facilitySchedules;
}
