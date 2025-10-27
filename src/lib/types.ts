

import type { Timestamp } from 'firebase/firestore';

export type HRUser = {
  id: string;
  name: string;
  email: string;
  role: 'HR';
  lastActivity: Date | Timestamp;
};

export type Employee = {
  id: string;
  name: string;
  email: string;
  role: 'HR' | 'Employee';
  status: 'Checked In' | 'Checked Out' | 'On Leave';
  lastActivity: Date | Timestamp;
  salary: number;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  assignedTo: string; // employee id
  assignedToName: string;
  status: 'To Do' | 'In Progress' | 'Completed';
  dueDate: Date;
  type: 'General' | 'CRM';
  leadId?: string;
  remarks?: string;
  completedAt?: Date;
  nextFollowUpDate?: Date;
  instructions?: string;
};

export type LeaveRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
};

export type Lead = {
  id: string;
  name: string;
  lastRemark: string;
  email: string;
  phone: string;
  status: 'Warm' | 'Cold' | 'Closed' | 'Not interested' | 'Converted';
};

export type SalaryData = {
    month: string;
    salary: number;
}

export type ActivityData = {
    date: string;
    tasks: number;
    meetings: number;
}

export type Notification = {
  id:string;
  userId: 'hr' | string; // 'hr' or employee id
  message: string;
  timestamp: Date;
  read: boolean;
  type: 'task-completed' | 'leave-request' | 'new-task' | 'leave-status';
};
