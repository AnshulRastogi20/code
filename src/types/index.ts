// src/types/index.ts
export interface User {
    _id: string;
    name: string;
    email: string;
    image?: string;
  }
  
  export interface Period {
    _id: string;
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

  export interface Preset {
    _id:string;
    name: string;
    description?: string;
    schedule: {
      day: string;
      periods: {
        subject: string;
        startTime: string;
        endTime: string;
        teacher: string;
      }[];
    }[];
    isDefault?: boolean;
    createdBy: string;
    createdAt?: Date;
    updatedAt?: Date;
  }