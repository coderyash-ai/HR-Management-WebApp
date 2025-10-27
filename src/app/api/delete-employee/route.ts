import { NextResponse } from 'next/server';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, writeBatch, collection, query, where, getDocs, deleteDoc } from 'firebase/firestore';

// This is a simplified example. For production, you'd want robust
// authorization checks (e.g., ensuring the requester is an HR manager).
export async function POST(req: Request) {
  try {
    const { employeeId } = await req.json();

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    const employeeDocRef = doc(db, 'employees', employeeId);
    const employeeDoc = await getDoc(employeeDocRef);

    if (!employeeDoc.exists()) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Note: Deleting the Firebase Auth user from the client-side is not secure
    // and generally not possible without admin privileges. This should be
    // handled by a backend service/cloud function with an Admin SDK.
    // We will proceed with deleting Firestore data only.

    const batch = writeBatch(db);

    // Delete the employee document
    batch.delete(employeeDocRef);

    // Find and delete related tasks
    const tasksQuery = query(collection(db, "tasks"), where("assignedTo", "==", employeeId));
    const tasksSnapshot = await getDocs(tasksQuery);
    tasksSnapshot.forEach(doc => batch.delete(doc.ref));

    // Find and delete related leave requests
    const leaveRequestsQuery = query(collection(db, "leaveRequests"), where("employeeId", "==", employeeId));
    const leaveRequestsSnapshot = await getDocs(leaveRequestsQuery);
    leaveRequestsSnapshot.forEach(doc => batch.delete(doc.ref));

    // Find and delete related notifications
    const notificationsQuery = query(collection(db, "notifications"), where("userId", "==", employeeId));
    const notificationsSnapshot = await getDocs(notificationsQuery);
    notificationsSnapshot.forEach(doc => batch.delete(doc.ref));

    await batch.commit();

    return NextResponse.json({ message: 'Employee data deleted successfully' });

  } catch (error) {
    console.error("Error deleting employee data:", error);
    return NextResponse.json({ error: 'Failed to delete employee data' }, { status: 500 });
  }
}
