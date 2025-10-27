
"use client";

import { db, auth } from './firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, Timestamp, writeBatch, documentId, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
import type { Employee, Task, LeaveRequest, Lead, Notification, ActivityData, HRUser } from './types';
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isWithinInterval } from 'date-fns';
import { EmailAuthProvider, reauthenticateWithCredential, deleteUser } from 'firebase/auth';


// Helper to convert Firestore docs to objects
function docToObject<T>(d: any): T {
    const data = d.data();
    const obj = { id: d.id, ...data };
    for (const key in obj) {
        if (obj[key] instanceof Timestamp) {
            obj[key] = obj[key].toDate();
        }
    }
    return obj as T;
}

// HR User Management (New)
export const getOrCreateHrUser = async (user: { uid: string, email: string, displayName?: string | null }): Promise<HRUser> => {
    const hrUserDocRef = doc(db, 'hr_users', user.uid);
    let hrUserDoc = await getDoc(hrUserDocRef);

    if (hrUserDoc.exists()) {
        await updateDoc(hrUserDocRef, { lastActivity: Timestamp.now() });
        // Re-fetch the document to get the latest data including the updated timestamp
        hrUserDoc = await getDoc(hrUserDocRef);
        return docToObject<HRUser>(hrUserDoc);
    }

    const employeeQuery = query(collection(db, 'employees'), where('email', '==', user.email), where('role', '==', 'HR'));
    const employeeSnapshot = await getDocs(employeeQuery);

    if (!employeeSnapshot.empty) {
        const incorrectEmployeeDoc = employeeSnapshot.docs[0];
        const incorrectEmployeeData = docToObject<Employee>(incorrectEmployeeDoc);

        const newHrUserData: Omit<HRUser, 'id'> = {
            name: incorrectEmployeeData.name,
            email: incorrectEmployeeData.email,
            role: 'HR',
            lastActivity: incorrectEmployeeData.lastActivity as Timestamp, // Keep as timestamp
        };

        await setDoc(hrUserDocRef, newHrUserData);
        await deleteDoc(incorrectEmployeeDoc.ref);

        return { id: user.uid, ...newHrUserData, lastActivity: (newHrUserData.lastActivity as Timestamp).toDate() };
    }

    const newHrUserData: Omit<HRUser, 'id'> = {
        name: user.displayName || 'HR Manager',
        email: user.email,
        role: 'HR',
        lastActivity: Timestamp.now(),
    };

    await setDoc(hrUserDocRef, newHrUserData);
    return { id: user.uid, ...newHrUserData, lastActivity: newHrUserData.lastActivity.toDate() };
};

// Employee Management
export const getEmployees = async (): Promise<Employee[]> => {
    const q = query(collection(db, 'employees'), where('role', '==', 'Employee'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToObject<Employee>);
};

export const getEmployeeByEmail = async (email: string): Promise<Employee | null> => {
    const q = query(collection(db, 'employees'), where('email', '==', email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    return docToObject<Employee>(snapshot.docs[0]);
};

export const getEmployeeById = async (id: string): Promise<Employee | null> => {
    const q = query(collection(db, 'employees'), where(documentId(), '==', id));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    return docToObject<Employee>(snapshot.docs[0]);
};

export const addEmployee = async (employee: Omit<Employee, 'id' | 'lastActivity' | 'status'>): Promise<Employee> => {
    const newEmployeeData = {
        ...employee,
        status: 'Checked Out' as const,
        lastActivity: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, 'employees'), newEmployeeData);
    return { id: docRef.id, ...newEmployeeData, lastActivity: newEmployeeData.lastActivity.toDate() };
};

export const updateEmployee = async (updatedEmployee: Partial<Employee> & { id: string }): Promise<void> => {
    const { id, ...dataToUpdate } = updatedEmployee;
    const employeeDoc = doc(db, 'employees', id);
    await updateDoc(employeeDoc, dataToUpdate);
};

export const updateEmployeesBatch = async (employees: Employee[]): Promise<void> => {
    const batch = writeBatch(db);
    employees.forEach(employee => {
        const { id, ...data } = employee;
        const docRef = doc(db, 'employees', id);
        batch.update(docRef, data);
    });
    await batch.commit();
};

// Task Management
export const getTasks = async (): Promise<Task[]> => {
    const q = collection(db, 'tasks');
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToObject<Task>);
};

export const getTasksForEmployee = async (employeeId: string): Promise<Task[]> => {
    const q = query(collection(db, 'tasks'), where('assignedTo', '==', employeeId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToObject<Task>);
};

export const addTask = async (task: Omit<Task, 'id'>): Promise<Task> => {
    const newDocData: Omit<Task, 'id'> = { ...task };
    
    // Ensure leadId and instructions are not undefined
    if (task.type !== 'CRM') {
        delete (newDocData as Partial<Task>).leadId;
        delete (newDocData as Partial<Task>).instructions;
    }

    const docRef = await addDoc(collection(db, 'tasks'), newDocData);
    return { id: docRef.id, ...newDocData } as Task;
};

export const updateTask = async (updatedTask: Partial<Task> & { id: string }): Promise<void> => {
    const { id, ...dataToUpdate } = updatedTask;
    const taskDoc = doc(db, 'tasks', id);
    await updateDoc(taskDoc, dataToUpdate);
};

export const deleteTasksBatch = async (taskIds: string[]): Promise<void> => {
    const batch = writeBatch(db);
    taskIds.forEach(id => {
        const docRef = doc(db, 'tasks', id);
        batch.delete(docRef);
    });
    await batch.commit();
};

// Leave Request Management
export const getLeaveRequests = async (): Promise<LeaveRequest[]> => {
    const q = collection(db, 'leaveRequests');
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToObject<LeaveRequest>);
};

export const getLeaveRequestsForEmployee = async (employeeId: string): Promise<LeaveRequest[]> => {
    const q = query(collection(db, 'leaveRequests'), where('employeeId', '==', employeeId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToObject<LeaveRequest>);
};

export const addLeaveRequest = async (request: Omit<LeaveRequest, 'id' | 'status'>): Promise<LeaveRequest> => {
    const newRequestData = {
        ...request,
        status: 'Pending' as const,
    };
    const docRef = await addDoc(collection(db, 'leaveRequests'), newRequestData);
    return { id: docRef.id, ...newRequestData };
};

export const updateLeaveRequest = async (updatedRequest: Partial<LeaveRequest> & { id: string }): Promise<void> => {
    const { id, ...dataToUpdate } = updatedRequest;
    const requestDoc = doc(db, 'leaveRequests', id);
    await updateDoc(requestDoc, dataToUpdate);
};

export const deleteLeaveRequestsForEmployee = async (employeeId: string): Promise<void> => {
    const q = query(collection(db, 'leaveRequests'), where('employeeId', '==', employeeId));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
        batch.delete(d.ref);
    });
    await batch.commit();
};

// Lead Management
export const getLeads = async (): Promise<Lead[]> => {
    const q = collection(db, 'leads');
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToObject<Lead>);
};

export const addLead = async (lead: Omit<Lead, 'id'>): Promise<Lead> => {
    const docRef = await addDoc(collection(db, 'leads'), lead);
    return { id: docRef.id, ...lead };
};

export const updateLead = async (updatedLead: Partial<Lead> & { id: string }): Promise<void> => {
    const { id, ...dataToUpdate } = updatedLead;
    const leadDoc = doc(db, 'leads', id);
    await updateDoc(leadDoc, dataToUpdate);
};

export const deleteLead = async (leadId: string): Promise<void> => {
    const leadDoc = doc(db, 'leads', leadId);
    await deleteDoc(leadDoc);
};

// Notification Management
export const getHRNotifications = async (): Promise<Notification[]> => {
    const q = query(collection(db, 'notifications'), where('userId', '==', 'hr'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToObject<Notification>);
};

export const getEmployeeNotifications = async (userId: string): Promise<Notification[]> => {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToObject<Notification>);
};

export const addNotification = async (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>): Promise<Notification> => {
    const newNotificationData = {
        ...notification,
        read: false,
        timestamp: Timestamp.now(),
    };
    const docRef = await addDoc(collection(db, 'notifications'), newNotificationData);
    return { id: docRef.id, ...newNotificationData, timestamp: newNotificationData.timestamp.toDate() };
};

export const markNotificationsAsRead = async (userId: string): Promise<void> => {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId), where('read', '==', false));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.docs.forEach(d => {
        batch.update(d.ref, { read: true });
    });
    await batch.commit();
};

export const deleteNotification = async (notificationId: string): Promise<void> => {
    const notifDoc = doc(db, 'notifications', notificationId);
    await deleteDoc(notifDoc);
};

// Activity Data
export const getEmployeeActivity = async (employeeId: string): Promise<ActivityData[]> => {
    const today = new Date();
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });

    const q = query(
        collection(db, 'tasks'),
        where('assignedTo', '==', employeeId),
        where('status', '==', 'Completed')
    );

    const snapshot = await getDocs(q);
    const allCompletedTasks = snapshot.docs.map(docToObject<Task>);

    const thisWeeksTasks = allCompletedTasks.filter(task =>
        task.completedAt && isWithinInterval(task.completedAt, { start: startOfThisWeek, end: endOfThisWeek })
    );

    const weekDays = eachDayOfInterval({ start: startOfThisWeek, end: endOfThisWeek });

    const activityData = weekDays.map(day => {
        const dayKey = format(day, 'E'); // Mon, Tue, etc.
        const tasksOnDay = thisWeeksTasks.filter(task =>
            task.completedAt && format(task.completedAt, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
        ).length;

        const meetingsOnDay = Math.floor(Math.random() * (tasksOnDay > 0 ? 3 : 1));

        return {
            date: dayKey,
            tasks: tasksOnDay,
            meetings: meetingsOnDay,
        };
    });

    return activityData.slice(0, 6); // Mon-Sat
};

// Local storage management (for simulation)
export const getLoggedInEmployeeId = (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('loggedInEmployeeId');
};

export const setLoggedInEmployee = (employeeId: string | null): void => {
    if (typeof window === 'undefined') return;
    if (employeeId) {
        localStorage.setItem('loggedInEmployeeId', employeeId);
    } else {
        localStorage.removeItem('loggedInEmployeeId');
    }
};
