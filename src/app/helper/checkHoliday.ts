import { ClassInfo } from "@/models/ClassInfo";
import { allClasses } from "@/types";

export async function isHolidayOnDate(date: Date, userId: string): Promise<boolean> {
    // Convert the input date to UTC and set time to start of day
    const targetDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    
    try {
        const classInfo = await ClassInfo.findOne({ userId });
        
        if (!classInfo) return false;
        
        // Check across all subjects and their classes
        for (const subject of classInfo.subject) {
            const holidayClass = subject.allclasses.find((cls:allClasses) => {
                const classDate = new Date(cls.date);
                return classDate.getTime() === targetDate.getTime() && cls.isHoliday;
            });
            
            if (holidayClass) return true;
        }
        
        return false;
    } catch (error) {
        console.error('Error checking holiday:', error);
        return false;
    }
}
