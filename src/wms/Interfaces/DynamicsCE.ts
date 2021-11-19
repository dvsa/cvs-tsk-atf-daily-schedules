export interface FacillitySchedules {
  testfacilityid: string;
  eventdate: string;
  vsa?: Vsa[];
}

export interface Vsa {
  startdate: string;
  enddate: string;
  status: string;
  testerid: number;
}
