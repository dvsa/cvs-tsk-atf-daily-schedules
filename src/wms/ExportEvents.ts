/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import dateformat from 'dateformat';
import { Database } from './Database';
import { FacillitySchedules, Vsa } from './Interfaces/DynamicsCE';

export async function getEvents(): Promise<FacillitySchedules[]> {
  const database = new Database();

  const map = new Map<string, Vsa[]>();
  const facilitySchedules: FacillitySchedules[] = [];

  try {
    const schedules = await database.getstaffSchedules();
    schedules.forEach((schedule) => {
      const vsa: Vsa = {
        status: schedule.status, testerid: schedule.staff_id, enddate: dateformat(new Date(`${schedule.event_date}T${schedule.event_end}`), 'yyyy-mm-dd\'T\'HH:MM:ss.l\'Z\''), startdate: dateformat(new Date(`${schedule.event_date}T${schedule.event_start}`), 'yyyy-mm-dd\'T\'HH:MM:ss.l\'Z\''),
      };
      if (!map.has(schedule.c_id)) {
        map.set(schedule.c_id, []);
        facilitySchedules.push({ testfacilityid: schedule.c_id, eventdate: dateformat(new Date(schedule.event_date), 'yyyy-mm-dd\'T\'HH:MM:ss.l\'Z\'') });
      }
      map.get(schedule.c_id).push(vsa);
    });

    map.forEach((vsa, facilityId) => {
      facilitySchedules.find((f) => f.testfacilityid === facilityId).vsa = vsa;
    });
  } catch (error) {
    console.log(error);
    database.closeConnection().catch((e) => { throw e; });
  }

  return facilitySchedules;
}
