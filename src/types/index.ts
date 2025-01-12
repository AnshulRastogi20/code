// src/types/index.ts
export interface User {
    _id: string;
    name: string;
    email: string;
    image?: string;
  }

  export interface Period {
    // ...existing code...
    isHoliday?: boolean;
    happened?: boolean;
    allAttended?: number;
    allHappened?: number;
    attended?: boolean;
    subject: string;
    teacher: string;
    startTime: string;
    endTime: string;
    topicsCovered?: string;
    disabled?: boolean;
    temporarySubject?: string | null;
    originalSubject?: string;
    temporaryExchange?: {
      originalSubject: string;
      exchangeEndDate: Date;
    } | null;
    date:Date;
  }
 
  export interface SubjectAttendance {
    name: string;
    total: number;
    attended: number;
    percentage: number;
    date: Date;
  }
  


  export interface allClasses {
    date: Date;
    startTime: string;
    endTime: string;
    isHoliday: boolean;
    happened: boolean;
    attended: boolean;
    topicsCovered: string[];
    temporarySubject: string | null;
    exchangeEndDate: Date | null;
  }
  
  export interface DaySchedule {
    date: Date;
    day: string;
    periods: Period[];
    isHoliday?: boolean;
  }

  export interface Preset {
    _id: string;
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

  export interface SubjectInfo {
    name: string;
    allclasses: allClasses[];
    allHappened: number;
    allAttended: number;
  }

  export interface ClassEntry {
    date: string | Date;
    attended: boolean;
    isHoliday: boolean;
    happened: boolean;
}

  export interface ClassInfoInterface {

    _id: string;
    name:string;
    userId: string;
    subject: SubjectInfo[];
    createdAt?: Date;
    updatedAt?: Date;
    date: Date;
    startTime: string;
    endTime: string;
    isHoliday: boolean;
    happened: boolean;
    attended: boolean;
    topicsCovered: string[];
    temporarySubject: string | null;
    exchangeEndDate: Date | null;
  }

  export interface Timetable {
    _id: string;
    userId: string;
    presetId: string;
    schedule: {
      day: string;
      periods: {
        subject: string;
        startTime: string;
        endTime: string;
        temporaryExchange?: {
          originalSubject: string;
          exchangeEndDate: Date;
        };
      }[];
    }[];
    createdAt?: Date;
    updatedAt?: Date;
  }



  export interface CalendarData {
      date: string
      isHoliday: boolean
      happened: boolean
      subject: string
      startTime: string
      endTime: string
      topicsCovered: string[]
      temporaryExchange?: {
          originalSubject: string;
          exchangeEndDate: Date;
      } | null;
      attended: boolean;
  }

