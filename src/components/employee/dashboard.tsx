

"use client";

import { useState, useEffect, useCallback } from 'react';
import { Task, Lead, LeaveRequest, Employee, ActivityData } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, CheckCircle, Hourglass, Briefcase, Calendar, Check, Loader2, RotateCw, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { format, differenceInDays } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { EmployeeStats } from '@/components/employee/stats-chart';
import * as DataService from '@/lib/data-service';
import { useRouter } from 'next/navigation';
import { Separator } from '../ui/separator';
import { Timestamp } from 'firebase/firestore';

export default function EmployeeDashboard() {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // State for the "Update Task" dialog
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [remarks, setRemarks] = useState('');
  const [lastRemarkInput, setLastRemarkInput] = useState(''); // New state for last remark
  const [selectedLeadStatus, setSelectedLeadStatus] = useState<Lead['status'] | undefined>(undefined);
  const [selectedTaskStatus, setSelectedTaskStatus] = useState<Task['status']>('In Progress');
  const [nextFollowUpDate, setNextFollowUpDate] = useState<Date | undefined>(undefined);

  const [leaveReason, setLeaveReason] = useState('');
  const { toast } = useToast();

  const fetchData = useCallback(async (employeeId: string) => {
    try {
        setLoading(true);
        const [employeeData, tasksData, leadsData, leaveRequestsData, activityData] = await Promise.all([
            DataService.getEmployeeById(employeeId),
            DataService.getTasksForEmployee(employeeId),
            DataService.getLeads(),
            DataService.getLeaveRequestsForEmployee(employeeId),
            DataService.getEmployeeActivity(employeeId),
        ]);
        
        if (!employeeData) {
            toast({ title: "Error", description: "Could not load employee data.", variant: "destructive" });
            router.push('/employee/login');
            return;
        }

        setEmployee(employeeData);
        setTasks(tasksData);
        setLeads(leadsData);
        setLeaveRequests(leaveRequestsData);
        setActivityData(activityData);
    } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        toast({ title: "Error", description: "Failed to load dashboard data.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  }, [router, toast]);

  useEffect(() => {
    const employeeId = DataService.getLoggedInEmployeeId();
    if (!employeeId) {
      router.push('/employee/login');
      return;
    }
    fetchData(employeeId);
  }, [router, fetchData]);


  if (loading || !employee) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  }
  
  const handleOpenUpdateTaskDialog = (task: Task) => {
    setSelectedTask(task);
    setRemarks(task.remarks || '');
    setSelectedTaskStatus(task.status);
    setNextFollowUpDate(task.nextFollowUpDate);
    if (task.type === 'CRM' && task.leadId) {
        const lead = leads.find(l => l.id === task.leadId);
        setSelectedLeadStatus(lead?.status);
        setLastRemarkInput(lead?.lastRemark || '');
    }
    setIsUpdateDialogOpen(true);
  };

  const handleCloseUpdateTaskDialog = () => {
      setIsUpdateDialogOpen(false);
      setSelectedTask(null);
      setRemarks('');
      setLastRemarkInput('');
      setSelectedLeadStatus(undefined);
      setSelectedTaskStatus('In Progress');
      setNextFollowUpDate(undefined);
  }

  const handleCheckInOut = async () => {
    const newStatus = employee.status === 'Checked In' ? 'Checked Out' : 'Checked In';
    const updatedEmployeeData: Partial<Employee> & { id: string } = { 
      id: employee.id, 
      status: newStatus, 
      lastActivity: new Date() 
    };
    await DataService.updateEmployee(updatedEmployeeData);
    setEmployee(prev => prev ? { 
      ...prev, 
      status: newStatus, 
      lastActivity: new Date() 
    } : null);
  
    toast({
      title: `Successfully ${newStatus}!`,
      description: `Your status has been updated.`,
      variant: 'default',
    });
  };
  
  const handleTaskUpdateSubmit = async () => {
    if (!selectedTask || !employee) return;
    
    // 1. Update Lead if applicable
    if (selectedTask.type === 'CRM' && selectedTask.leadId) {
        const leadUpdateData: Partial<Lead> & {id: string} = { id: selectedTask.leadId };
        if (selectedLeadStatus) {
            leadUpdateData.status = selectedLeadStatus;
        }
        if (lastRemarkInput) {
            leadUpdateData.lastRemark = lastRemarkInput;
        }

        await DataService.updateLead(leadUpdateData);
        
        const updatedLeads = leads.map(l => l.id === selectedTask.leadId ? {...l, ...leadUpdateData} : l);
        setLeads(updatedLeads);
    }
    
    // 2. Update Task
    const updatedTaskData: Partial<Task> & {id: string} = { 
      id: selectedTask.id, 
      status: selectedTaskStatus, 
      remarks,
    };
    
    if (nextFollowUpDate) {
      updatedTaskData.nextFollowUpDate = nextFollowUpDate;
    }

    if (selectedTaskStatus === 'Completed') {
      updatedTaskData.completedAt = new Date();
    }
    await DataService.updateTask(updatedTaskData);
    const updatedTasks = tasks.map(t => t.id === selectedTask.id ? { ...t, ...updatedTaskData } as Task : t);
    setTasks(updatedTasks);
    
    // 3. Send HR Notification if task is completed
    if (selectedTaskStatus === 'Completed' && selectedTask.status !== 'Completed') {
        await DataService.addNotification({
          userId: 'hr',
          message: `${employee.name} completed the task: "${selectedTask.title}"`,
          type: 'task-completed',
        });
    }
    
    // 4. Refresh activity data if completed
    if (selectedTaskStatus === 'Completed') {
        const newActivityData = await DataService.getEmployeeActivity(employee.id);
        setActivityData(newActivityData);
    }

    toast({
      title: `Task Updated!`,
      description: `Status has been updated to ${selectedTaskStatus}.`
    });

    handleCloseUpdateTaskDialog();
  };
  
  const handleLeaveSubmit = async () => {
    if (!date || !leaveReason) {
      toast({ title: "Missing Information", description: "Please select a date and provide a reason.", variant: "destructive" });
      return;
    }
    const newRequest = await DataService.addLeaveRequest({
        employeeId: employee.id,
        employeeName: employee.name,
        startDate: date,
        endDate: date, // For simplicity, we'll use single-day leave
        reason: leaveReason,
    });
    setLeaveRequests(prev => [...prev, newRequest]);

    await DataService.addNotification({
        userId: 'hr',
        message: `${employee.name} has requested leave.`,
        type: 'leave-request',
    });

    toast({ title: "Leave Request Submitted", description: "Your request has been sent for approval." });
    setLeaveReason('');
  };
  
  const handleResetTask = async (task: Task) => {
    if (!employee) return;
    
    const updatedTaskData = {
      id: task.id,
      status: 'In Progress' as const,
      completedAt: undefined,
    };
    
    await DataService.updateTask(updatedTaskData);
    setTasks(prev => prev.map(t => t.id === task.id ? {...t, status: 'In Progress', completedAt: undefined} : t));

    await DataService.addNotification({
      userId: 'hr',
      message: `${employee.name} has reset the task: "${task.title}"`,
      type: 'task-completed', // Reusing type for simplicity
    });

    toast({
      title: "Task Reset",
      description: `"${task.title}" has been moved back to 'In Progress'.`,
    });
  };

  const handleClearCompletedTasks = async () => {
    const completedTaskIds = tasks.filter(t => t.status === 'Completed').map(t => t.id);
    if (completedTaskIds.length === 0) return;

    await DataService.deleteTasksBatch(completedTaskIds);
    setTasks(prev => prev.filter(t => t.status !== 'Completed'));

    toast({
      title: "Completed Tasks Cleared",
      description: "All completed tasks have been permanently deleted.",
    });
  };

  const handleClearLeaveHistory = async () => {
    if (leaveRequests.length === 0) return;
    
    await DataService.deleteLeaveRequestsForEmployee(employee.id);
    setLeaveRequests([]);

    toast({
      title: "Leave History Cleared",
      description: "Your leave history has been permanently deleted.",
    });
  };

  const getLeaveStatusVariant = (status: LeaveRequest['status']) => {
    switch (status) {
        case 'Approved':
            return 'default';
        case 'Rejected':
            return 'destructive';
        case 'Pending':
        default:
            return 'secondary';
    }
  };

  const pendingTasksCount = tasks.filter(t => t.status !== 'Completed').length;
  const completedTasksCount = tasks.filter(t => t.status === 'Completed').length;
  const isCheckedIn = employee.status === 'Checked In';

  const currentLeadForDialog = selectedTask?.type === 'CRM' && selectedTask.leadId ? leads.find(l => l.id === selectedTask.leadId) : undefined;
  
  const lastActivityDate = employee.lastActivity instanceof Timestamp 
    ? employee.lastActivity.toDate() 
    : employee.lastActivity;


  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {employee.name}!</h1>
        <p className="text-muted-foreground">Here's your personal dashboard.</p>
      </div>

       <div className="flex flex-col gap-6" id="my-day">
        <Card>
          <CardHeader>
            <CardTitle>My Day</CardTitle>
            <CardDescription>Your current check-in status.</CardDescription>
          </CardHeader>
          <CardContent className="text-center flex flex-col items-center gap-4">
            <div className={`p-4 rounded-full ${isCheckedIn ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {isCheckedIn ? 
                <LogIn className="h-8 w-8 text-green-500" /> : 
                <LogOut className="h-8 w-8 text-red-500" />}
            </div>
            <p className={`font-semibold text-lg ${isCheckedIn ? 'text-green-500' : 'text-red-500'}`}>
              You are {isCheckedIn ? 'Checked In' : 'Checked Out'}
            </p>
            {lastActivityDate && (
              <p className="text-sm text-muted-foreground">
                Last activity: {format(lastActivityDate, 'p')}
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button onClick={handleCheckInOut} className="w-full">
              {isCheckedIn ? <LogOut className="mr-2 h-4 w-4"/> : <LogIn className="mr-2 h-4 w-4"/>}
              {isCheckedIn ? 'Check Out' : 'Check In'}
            </Button>
          </CardFooter>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Tasks Completed</CardTitle>
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{completedTasksCount}</div>
                    <p className="text-xs text-muted-foreground">this month</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
                    <Hourglass className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{pendingTasksCount}</div>
                    <p className="text-xs text-muted-foreground">in your queue</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Days On Leave</CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{leaveRequests.filter(lr => lr.status === 'Approved').reduce((acc, lr) => acc + differenceInDays(lr.endDate, lr.startDate) + 1, 0)}</div>
                    <p className="text-xs text-muted-foreground">this year</p>
                </CardContent>
            </Card>
        </div>
      </div>
      
      <div className="flex flex-col gap-8" id="my-tasks">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div>
              <CardTitle>My Tasks</CardTitle>
              <CardDescription>Your assigned tasks and their status.</CardDescription>
            </div>
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={completedTasksCount === 0}>
                        <Trash2 className="mr-2" />
                        Clear Completed Tasks
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete all {completedTasksCount} completed tasks. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearCompletedTasks}>Continue</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
          </CardHeader>
          <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Next Follow-up</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {tasks.length > 0 ? tasks.map((task) => (
                        <TableRow key={task.id} className={task.status === 'Completed' ? 'text-muted-foreground' : ''}>
                            <TableCell className="cursor-pointer" onClick={() => handleOpenUpdateTaskDialog(task)}>
                                <p className="font-medium">{task.title}</p>
                                <p className="text-xs text-muted-foreground">{task.description}</p>
                            </TableCell>
                                <TableCell>
                                <Badge variant={task.type === 'CRM' ? 'secondary' : 'outline'}>{task.type}</Badge>
                                </TableCell>
                            <TableCell>{format(task.dueDate, "MMM d, yyyy")}</TableCell>
                            <TableCell>{task.nextFollowUpDate ? format(task.nextFollowUpDate, "MMM d, yyyy") : '-'}</TableCell>
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    {task.status !== 'Completed' ? (
                                        <Button size="sm" onClick={() => handleOpenUpdateTaskDialog(task)}>
                                            <Check className="mr-2" /> Update Status
                                        </Button>
                                    ) : (
                                        <div className="flex items-center justify-end gap-2 text-green-500">
                                            <CheckCircle className="h-4 w-4"/>
                                            <span>Completed</span>
                                        </div>
                                    )}
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button size="icon" variant="outline" className="h-8 w-8">
                                                <RotateCw className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will reset the task "{task.title}" to "In Progress". This action can be undone by completing the task again.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleResetTask(task)}>Continue</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground">You have no assigned tasks.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
                <DialogContent onEscapeKeyDown={handleCloseUpdateTaskDialog} onPointerDownOutside={handleCloseUpdateTaskDialog} className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Task Details: {selectedTask?.title}</DialogTitle>
                        <DialogDescription>{selectedTask?.description}</DialogDescription>
                    </DialogHeader>
                    
                    <div className="max-h-[60vh] overflow-y-auto px-1">
                        {selectedTask?.type === 'CRM' && currentLeadForDialog && (
                        <div className="space-y-4 py-4">
                            <Separator />
                            <h3 className="font-semibold text-lg">Lead Information</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div><span className="font-medium text-muted-foreground">Lead Name:</span> {currentLeadForDialog.name}</div>
                                <div><span className="font-medium text-muted-foreground">Contact:</span> {currentLeadForDialog.phone}</div>
                                <div><span className="font-medium text-muted-foreground">Email:</span> {currentLeadForDialog.email}</div>
                                <div><span className="font-medium text-muted-foreground">Status:</span> <Badge variant="secondary">{currentLeadForDialog.status}</Badge></div>
                                <div className="col-span-2"><span className="font-medium text-muted-foreground">Last Remark:</span> {currentLeadForDialog.lastRemark}</div>
                                {selectedTask.instructions && <div className="col-span-2"><span className="font-medium text-muted-foreground">Instructions:</span> {selectedTask.instructions}</div>}
                            </div>
                            <Separator />
                        </div>
                        )}

                        <div className="space-y-4 py-4">
                            <h3 className="font-semibold text-lg">Update Progress</h3>
                            <div className="space-y-2">
                                <Label htmlFor="remarks">Task Remarks</Label>
                                <Textarea id="remarks" placeholder="Add your remarks on the task..." value={remarks} onChange={(e) => setRemarks(e.target.value)} />
                            </div>
                            {selectedTask?.type === 'CRM' && currentLeadForDialog && (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="last-remark">Update Last Remark</Label>
                                    <Textarea id="last-remark" placeholder="Update the last remark for the lead..." value={lastRemarkInput} onChange={(e) => setLastRemarkInput(e.target.value)} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Lead Status</Label>
                                    <Select onValueChange={(value: Lead['status']) => setSelectedLeadStatus(value)} value={selectedLeadStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select lead status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Warm">Warm</SelectItem>
                                        <SelectItem value="Cold">Cold</SelectItem>
                                        <SelectItem value="Closed">Closed</SelectItem>
                                        <SelectItem value="Not interested">Not interested</SelectItem>
                                        <SelectItem value="Converted">Converted</SelectItem>
                                    </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="next-follow-up">Next Follow-up Date</Label>
                                    <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                        id="next-follow-up"
                                        variant={"outline"}
                                        className="w-full justify-start text-left font-normal"
                                        >
                                        <Calendar className="mr-2 h-4 w-4" />
                                        {nextFollowUpDate ? format(nextFollowUpDate, "PPP") : <span>Pick a date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <CalendarPicker
                                        mode="single"
                                        selected={nextFollowUpDate}
                                        onSelect={setNextFollowUpDate}
                                        initialFocus
                                        disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                                        />
                                    </PopoverContent>
                                    </Popover>
                                </div>
                                </div>
                            </>
                            )}
                            <div className="space-y-2">
                                <Label>Task Status</Label>
                                <Select onValueChange={(value: Task['status']) => setSelectedTaskStatus(value)} value={selectedTaskStatus}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select task status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={handleCloseUpdateTaskDialog}>Cancel</Button>
                        <Button type="button" onClick={handleTaskUpdateSubmit}>Submit</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6" id="my-leave">
            <Card>
              <CardHeader>
                <CardTitle>Request Leave</CardTitle>
                <CardDescription>Submit a new leave request.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="leave-dates">Leave Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          id="leave-dates"
                          variant={"outline"}
                          className="w-full justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarPicker
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                          disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                        />
                      </PopoverContent>
                    </Popover>
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="reason">Reason</Label>
                    <Textarea id="reason" placeholder="Please provide a brief reason..." value={leaveReason} onChange={e => setLeaveReason(e.target.value)} />
                 </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handleLeaveSubmit}>Submit Request</Button>
              </CardFooter>
            </Card>
             <Card>
                <CardHeader className="flex items-center justify-between">
                    <CardTitle>Leave History</CardTitle>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={leaveRequests.length === 0}>
                                <Trash2 className="mr-2 h-4 w-4" /> Clear History
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will permanently delete your entire leave history. This cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleClearLeaveHistory}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-sm">
                        {leaveRequests.length > 0 ? leaveRequests.map(request => {
                            const duration = differenceInDays(request.endDate, request.startDate) + 1;
                            return (
                                <li key={request.id} className="flex items-center justify-between">
                                    <span>{request.reason} ({duration} {duration > 1 ? 'days' : 'day'})</span>
                                    <Badge variant={getLeaveStatusVariant(request.status)}>{request.status}</Badge>
                                </li>
                            )
                        }) : (
                            <p className="text-muted-foreground text-center">No leave history found.</p>
                        )}
                    </ul>
                </CardContent>
            </Card>
        </div>
      </div>
      
      <Card id="my-stats">
          <CardHeader>
            <CardTitle>My Stats</CardTitle>
            <CardDescription>Your monthly salary and activity overview.</CardDescription>
          </CardHeader>
          <CardContent>
            <EmployeeStats salary={employee?.salary} activityData={activityData} />
          </CardContent>
      </Card>
    </div>
  );
}
