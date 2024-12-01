// src/types/index.ts
export interface User {
    id: string;
    name: string;
    email: string;
    image?: string;
  }
  
  export interface Period {
    id: string;
    subject: string;
    startTime: string;
    endTime: string;
    attended?: boolean;
    disabled?: boolean;
    topicsCovered?: string;
  }
  
  export interface DaySchedule {
    date: Date;
    periods: Period[];
    isHoliday?: boolean;
  }