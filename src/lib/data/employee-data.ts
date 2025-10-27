
import type { Employee, LeaveRequest, SalaryData, ActivityData } from '../types';

export const mockEmployees: Employee[] = [];

export const mockLeaveRequests: LeaveRequest[] = [];

export const mockSalaryData: SalaryData[] = [
    { month: "January", salary: 68000 },
    { month: "February", salary: 68000 },
    { month: "March", salary: 70000 },
    { month: "April", salary: 70000 },
    { month: "May", salary: 70000 },
    { month: "June", salary: 72000 },
];

export const mockActivityData: ActivityData[] = [
    { date: "Mon", tasks: 5, meetings: 2 },
    { date: "Tue", tasks: 3, meetings: 3 },
    { date: "Wed", tasks: 6, meetings: 1 },
    { date: "Thu", tasks: 4, meetings: 2 },
    { date: "Fri", tasks: 8, meetings: 0 },
    { date: "Sat", tasks: 2, meetings: 1 },
];
