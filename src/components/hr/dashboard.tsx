

"use client";

import { useState, useEffect, useCallback } from 'react';
import { Employee, LeaveRequest, Task, Lead } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, PlusCircle, ChevronDown, ChevronUp, Trash2, Users, IndianRupee, Edit, Loader2, Contact, Download, Calendar as CalendarIcon, XCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, isSameDay } from "date-fns";
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
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
} from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import * as DataService from '@/lib/data-service';
import { useAuth } from '@/contexts/auth-context';
import { CSVLink } from 'react-csv';
import { Timestamp } from 'firebase/firestore';

type GroupedTask = {
    employeeId: string;
    employeeName: string;
    taskCount: number;
    tasks: Task[];
    statusSummary: { [key: string]: number };
};

export default function HRDashboard() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [openCollapsibles, setOpenCollapsibles] = useState<string[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [taskFormKey, setTaskFormKey] = useState(Date.now());
  const [leadFormKey, setLeadFormKey] = useState(Date.now());
  const { toast } = useToast();
  const [tempSalaries, setTempSalaries] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'tasks' | 'crm' | 'leads'>('tasks');
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isLeadDialogOpen, setIsLeadDialogOpen] = useState(false);

  // State for editing a lead
  const [isEditLeadDialogOpen, setIsEditLeadDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editLeadData, setEditLeadData] = useState<Partial<Lead>>({});

  const [leadStatusFilter, setLeadStatusFilter] = useState<Lead['status'] | 'all'>('all');
  const [followUpDateFilter, setFollowUpDateFilter] = useState<Date | undefined>();


  const fetchData = useCallback(async () => {
    try {
        setLoading(true);
        
        const [allEmployees, allLeaveRequests, allTasks, allLeads] = await Promise.all([
            DataService.getEmployees(),
            DataService.getLeaveRequests(),
            DataService.getTasks(),
            DataService.getLeads(),
        ]);
        
        const employeesOnly = allEmployees.filter(e => e.role === 'Employee');
        setEmployees(employeesOnly);
        
        const salaries = employeesOnly.reduce((acc, emp) => {
            acc[emp.id] = emp.salary.toString();
            return acc;
        }, {} as Record<string, string>);
        setTempSalaries(salaries);

        setLeaveRequests(allLeaveRequests);
        setTasks(allTasks);
        setLeads(allLeads);

    } catch (error) {
        console.error("Failed to fetch HR dashboard data:", error);
        toast({ title: "Error", description: "Could not load dashboard data.", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  }, [toast]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const totalPayroll = employees.reduce((acc, emp) => acc + emp.salary, 0);

  const getStatusVariant = (status: Employee["status"]) => {
    switch (status) {
      case 'Checked In':
        return 'bg-green-500/20 text-green-500 border-green-500/30';
      case 'Checked Out':
        return 'bg-red-500/20 text-red-500 border-red-500/30';
      case 'On Leave':
        return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30';
      default:
        return 'default';
    }
  };

  const handleLeaveRequest = async (requestId: string, newStatus: 'Approved' | 'Rejected') => {
    await DataService.updateLeaveRequest({ id: requestId, status: newStatus });
    setLeaveRequests(prev => prev.map(req => req.id === requestId ? {...req, status: newStatus} : req));
    
    const request = leaveRequests.find(req => req.id === requestId);
    if (request) {
        await DataService.addNotification({
            userId: request.employeeId,
            message: `Your leave request for ${format(request.startDate, "MMM d")} has been ${newStatus.toLowerCase()}.`,
            type: 'leave-status',
        });
    }

    toast({
      title: `Leave Request ${newStatus}`,
      description: `The request has been successfully ${newStatus.toLowerCase()}.`,
    });
  };

  const handleCreateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const assignedToId = formData.get('assignedTo') as string;
    const employee = employees.find(e => e.id === assignedToId);
    
    if (!employee) return;

    const taskType = activeTab === 'crm' ? 'CRM' : 'General';
    
    const newTaskData: Omit<Task, 'id'> = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      assignedTo: assignedToId,
      assignedToName: employee.name,
      status: 'To Do',
      dueDate: new Date(),
      type: taskType,
    };
    
    if (taskType === 'CRM') {
        newTaskData.leadId = formData.get('leadId') as string;
        newTaskData.instructions = formData.get('instructions') as string;
    }
    
    const newTask = await DataService.addTask(newTaskData);
    setTasks(prev => [...prev, newTask]);
    
    await DataService.addNotification({
        userId: assignedToId,
        message: `You have a new task: "${newTask.title}"`,
        type: 'new-task',
    });

    try {
      await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              to: employee.email,
              name: employee.name,
              taskTitle: newTask.title,
              taskDescription: newTask.description,
          }),
      });
    } catch (error) {
        console.error("Failed to send task notification email:", error);
        // We don't toast here because the main action (task creation) succeeded.
        // This is a non-critical failure.
    }

    toast({
      title: "Task Created!",
      description: `New task "${newTask.title}" has been assigned to ${employee.name}.`
    });
    setTaskFormKey(Date.now()); 
    setIsTaskDialogOpen(false);
  };

  const handleCreateLead = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newLeadData: Omit<Lead, 'id'> = {
        name: formData.get('name') as string,
        lastRemark: formData.get('lastRemark') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string,
        status: 'Cold', 
    };

    const newLead = await DataService.addLead(newLeadData);
    setLeads(prev => [...prev, newLead]);

    toast({
        title: "Lead Added!",
        description: `${newLead.name} has been added to the lead list.`
    });
    setLeadFormKey(Date.now());
    setIsLeadDialogOpen(false);
  }
  
  const handleOpenEditLeadDialog = (lead: Lead) => {
    setSelectedLead(lead);
    setEditLeadData(lead);
    setIsEditLeadDialogOpen(true);
  }

  const handleUpdateLead = async () => {
    if (!selectedLead || !editLeadData) return;
    const updatedData = { ...selectedLead, ...editLeadData };
    await DataService.updateLead(updatedData);
    setLeads(prev => prev.map(l => l.id === updatedData.id ? updatedData : l));
    toast({
      title: "Lead Updated",
      description: `${updatedData.name}'s details have been successfully updated.`,
    });
    setIsEditLeadDialogOpen(false);
    setSelectedLead(null);
  }

  const handleDeleteLead = async () => {
    if (!selectedLead) return;
    await DataService.deleteLead(selectedLead.id);
    setLeads(prev => prev.filter(l => l.id !== selectedLead.id));
    toast({
      title: "Lead Deleted",
      description: `${selectedLead.name} has been permanently removed.`,
      variant: "destructive"
    });
    setIsEditLeadDialogOpen(false);
    setSelectedLead(null);
  }

  const formatLastActivity = (date: Date | Timestamp) => {
    const jsDate = date instanceof Timestamp ? date.toDate() : date;
    return format(jsDate, "p, MMM d");
  };
  
  const toggleCollapsible = (id: string) => {
    setOpenCollapsibles(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };
  
  const handleEmployeeSelect = (employee: Employee) => {
    setSelectedEmployee(employee);
  };
  
  const handleEmployeeDelete = async () => {
    if (!selectedEmployee) return;

    try {
        const response = await fetch('/api/delete-employee', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                employeeId: selectedEmployee.id,
            }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete employee');
        }

        setEmployees(prev => prev.filter(emp => emp.id !== selectedEmployee.id));
        toast({
            title: "Employee Deleted",
            description: `${selectedEmployee.name} has been permanently removed.`,
        });

    } catch (error: any) {
        toast({
            title: "Deletion Failed",
            description: error.message,
            variant: "destructive",
        });
    }
  };

  const handleBulkSalaryUpdate = async () => {
    const updatedEmployees = employees.map(emp => {
      const newSal = tempSalaries[emp.id];
      if (newSal !== undefined && emp.salary.toString() !== newSal) {
        return { ...emp, salary: parseFloat(newSal) || 0 };
      }
      return emp;
    });
    await DataService.updateEmployeesBatch(updatedEmployees);
    setEmployees(updatedEmployees);
    toast({
      title: "Salaries Updated",
      description: "Employee salaries have been successfully updated.",
    });
  };

  const crmTasks = tasks.filter(task => task.type === 'CRM');

  const filteredCrmTasks = crmTasks.filter(task => {
    if (!followUpDateFilter) return true;
    return task.nextFollowUpDate && isSameDay(task.nextFollowUpDate, followUpDateFilter);
  });
  
  const groupedTasks = tasks
    .filter(task => task.type === 'General')
    .reduce((acc, task) => {
        let group = acc.find(g => g.employeeId === task.assignedTo);
        if (!group) {
        const employee = employees.find(e => e.id === task.assignedTo);
        group = { 
            employeeId: task.assignedTo, 
            employeeName: employee?.name || 'Unknown', 
            taskCount: 0, 
            tasks: [],
            statusSummary: { 'To Do': 0, 'In Progress': 0, 'Completed': 0 }
        };
        acc.push(group);
        }
        group.taskCount++;
        group.tasks.push(task);
        if (!group.statusSummary[task.status]) {
        group.statusSummary[task.status] = 0;
        }
        group.statusSummary[task.status]++;
        return acc;
    }, [] as GroupedTask[]);
    
  const filteredLeadsByStatus = leads.filter(lead => 
    leadStatusFilter === 'all' || lead.status === leadStatusFilter
  );

  const filteredLeads = filteredLeadsByStatus.filter(lead => {
    if (!followUpDateFilter) return true;
    // A lead is included if it has at least one CRM task with the selected follow-up date
    return filteredCrmTasks.some(task => task.leadId === lead.id);
  });


  const csvHeaders = [
    { label: "Contact", key: "name" },
    { label: "Last Remark", key: "lastRemark" },
    { label: "Email", key: "email" },
    { label: "Phone", key: "phone" },
    { label: "Status", key: "status" }
  ];


  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-200px)]"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">HR Dashboard</h1>
        <p className="text-muted-foreground">Comprehensive overview of your team's activities.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="payroll-stats">
          <Dialog>
            <DialogTrigger asChild>
              <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
                      <Edit className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                      <div className="text-2xl font-bold">₹{totalPayroll.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Total for this month</p>
                  </CardContent>
              </Card>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Update Employee Salaries</DialogTitle>
                <DialogDescription>
                  Adjust the monthly salary for each employee. Changes will be saved for the entire list.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 max-h-[60vh] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-right">Salary (INR)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-muted-foreground">{employee.role === 'HR' ? 'HR Manager' : employee.role}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            className="w-40 ml-auto"
                            value={tempSalaries[employee.id] || ''}
                            onChange={(e) => setTempSalaries({...tempSalaries, [employee.id]: e.target.value})}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button onClick={handleBulkSalaryUpdate}>Save All Changes</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{employees.length}</div>
                   <p className="text-xs text-muted-foreground">active team members</p>
              </CardContent>
          </Card>
      </div>

      <div className="flex flex-col gap-6" id="live-status">
        <Card>
          <CardHeader>
            <CardTitle>Live Employee Status</CardTitle>
            <CardDescription>Current status of all employees. Click on an employee to manage.</CardDescription>
          </CardHeader>
          <CardContent>
            <Dialog onOpenChange={(open) => !open && setSelectedEmployee(null)}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Last Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <DialogTrigger asChild key={employee.id}>
                        <TableRow className="cursor-pointer" onClick={() => handleEmployeeSelect(employee)}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={`https://placehold.co/40x40.png?text=${employee.name.charAt(0)}`} alt={employee.name} data-ai-hint="person" />
                                <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{employee.name}</p>
                                <p className="text-sm text-muted-foreground">{employee.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getStatusVariant(employee.status)}>{employee.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right">{formatLastActivity(employee.lastActivity)}</TableCell>
                        </TableRow>
                      </DialogTrigger>
                    ))}
                  </TableBody>
                </Table>
                {selectedEmployee && (
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Manage: {selectedEmployee.name}</DialogTitle>
                            <DialogDescription>
                                Edit salary details or remove the employee from the system.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="salary">Monthly Salary (INR)</Label>
                                <Input 
                                    id="salary" 
                                    type="number" 
                                    value={tempSalaries[selectedEmployee.id] || ''}
                                    onChange={(e) => setTempSalaries({...tempSalaries, [selectedEmployee.id]: e.target.value})}
                                    placeholder="e.g., 50000"
                                />
                            </div>
                        </div>
                        <DialogFooter className="justify-between sm:justify-between">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">
                                        <Trash2 className="mr-2" /> Delete Employee
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently remove {selectedEmployee.name} and their data from the servers.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <DialogClose asChild>
                                        <AlertDialogAction onClick={handleEmployeeDelete}>Continue</AlertDialogAction>
                                    </DialogClose>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <DialogClose asChild>
                                <Button onClick={handleBulkSalaryUpdate}>Save Changes</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
            <CardDescription>Pending requests that need your attention.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaveRequests.filter(lr => lr.status === 'Pending').map((request) => (
                <div key={request.id} className="flex items-start justify-between p-3 rounded-lg bg-card-foreground/5">
                  <div className="flex-1 pr-4">
                    <p className="font-semibold">{request.employeeName}</p>
                    <p className="text-sm text-muted-foreground">{request.reason}</p>
                    <p className="text-xs text-muted-foreground mt-1">{`${format(request.startDate, 'MMM d')} - ${format(request.endDate, 'MMM d')}`}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" variant="outline" className="h-8 w-8 text-green-500 hover:bg-green-500/10 hover:text-green-600" onClick={() => handleLeaveRequest(request.id, 'Approved')}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-600" onClick={() => handleLeaveRequest(request.id, 'Rejected')}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {leaveRequests.filter(lr => lr.status === 'Pending').length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No pending requests.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card id="work-management">
        <Tabs defaultValue="tasks" onValueChange={(value) => setActiveTab(value as 'tasks' | 'crm' | 'leads')}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Work Management</CardTitle>
                <CardDescription>Oversee general tasks, CRM tasks, and leads.</CardDescription>
            </div>
            <div className="flex items-center gap-4">
                <TabsList>
                  <TabsTrigger value="tasks">General Tasks</TabsTrigger>
                  <TabsTrigger value="crm">CRM Tasks</TabsTrigger>
                  <TabsTrigger value="leads">Leads</TabsTrigger>
                </TabsList>
                 <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        New Task
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New {activeTab === 'crm' ? 'CRM' : 'General'} Task</DialogTitle>
                      <DialogDescription>Fill in the details below to assign a new task.</DialogDescription>
                    </DialogHeader>
                    <form key={taskFormKey} onSubmit={handleCreateTask}>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Task Title</Label>
                          <Input id="title" name="title" placeholder="e.g., Follow up with client" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Textarea id="description" name="description" placeholder="Add a brief description..." required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="assignedTo">Assign To</Label>
                            <Select name="assignedTo" required>
                                <SelectTrigger>
                                <SelectValue placeholder="Select an employee" />
                                </SelectTrigger>
                                <SelectContent>
                                {employees.filter(e => e.role === 'Employee').map(employee => (
                                    <SelectItem key={employee.id} value={employee.id}>{employee.name}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                        </div>
                         {activeTab === 'crm' && (
                            <>
                              <div className="space-y-2">
                                  <Label htmlFor="leadId">Assign to Lead</Label>
                                  <Select name="leadId" required>
                                      <SelectTrigger>
                                          <SelectValue placeholder="Select a lead" />
                                      </SelectTrigger>
                                      <SelectContent>
                                          {leads.map(lead => (
                                              <SelectItem key={lead.id} value={lead.id}>{lead.name} ({lead.lastRemark})</SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="instructions">What to do with this lead (Instructions)</Label>
                                <Textarea id="instructions" name="instructions" placeholder="e.g., Follow up for a demo, send proposal..." />
                              </div>
                            </>
                         )}
                      </div>
                      <DialogFooter>
                          <Button type="button" variant="secondary" onClick={() => setIsTaskDialogOpen(false)}>Cancel</Button>
                          <Button type="submit">Create Task</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex justify-start items-center gap-4 mb-4">
                {(activeTab === 'crm' || activeTab === 'leads') && (
                     <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {followUpDateFilter ? format(followUpDateFilter, 'PPP') : <span>Filter by follow-up date...</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={followUpDateFilter}
                                onSelect={setFollowUpDateFilter}
                                initialFocus
                            />
                        </PopoverContent>
                    </Popover>
                )}
                 {followUpDateFilter && (
                    <Button variant="ghost" onClick={() => setFollowUpDateFilter(undefined)}>
                        <XCircle className="mr-2" />
                        Clear Filter
                    </Button>
                 )}
            </div>
             <TabsContent value="tasks">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Employee</TableHead>
                            <TableHead>Task Count</TableHead>
                            <TableHead>Task Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    
                        {groupedTasks.filter(g => employees.find(e => e.id === g.employeeId)?.role !== 'HR').map((group) => (
                            <Collapsible asChild key={group.employeeId} open={openCollapsibles.includes(group.employeeId)} onOpenChange={() => toggleCollapsible(group.employeeId)}>
                                <TableBody>
                                    <TableRow className="cursor-pointer" onClick={() => toggleCollapsible(group.employeeId)}>
                                        <TableCell className="font-medium">{group.employeeName}</TableCell>
                                        <TableCell>{group.taskCount}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-2 flex-wrap">
                                                {Object.entries(group.statusSummary).map(([status, count]) => 
                                                    count > 0 && <Badge key={status} variant="secondary">{count} {status}</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{format(new Date(), 'MMM d, yyyy')}</TableCell>
                                        <TableCell>
                                            <Button variant="ghost" size="sm">
                                                {openCollapsibles.includes(group.employeeId) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                <span className="sr-only">Toggle details</span>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                    <CollapsibleContent asChild>
                                        <tr className="bg-muted/50">
                                            <TableCell colSpan={5} className="p-0">
                                                <div className="p-4">
                                                    <h4 className="font-semibold mb-2">Tasks for {group.employeeName}</h4>
                                                    <Table>
                                                        <TableHeader>
                                                            <TableRow>
                                                                <TableHead>Task</TableHead>
                                                                <TableHead>Status</TableHead>
                                                                <TableHead>Remarks</TableHead>
                                                                <TableHead>Due Date</TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {group.tasks.map(task => (
                                                                <TableRow key={task.id}>
                                                                    <TableCell>{task.title}</TableCell>
                                                                    <TableCell>
                                                                        <Badge variant={task.status === 'Completed' ? 'default' : 'secondary'} className={task.status === 'Completed' ? 'bg-accent text-accent-foreground' : ''}>
                                                                            {task.status}
                                                                        </Badge>
                                                                    </TableCell>
                                                                    <TableCell>{task.remarks || '-'}</TableCell>
                                                                    <TableCell>{format(task.dueDate, 'MMM d, yyyy')}</TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </TableCell>
                                        </tr>
                                    </CollapsibleContent>
                                </TableBody>
                            </Collapsible>
                        ))}
                    
                </Table>
            </TabsContent>
            <TabsContent value="crm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Next Follow-up</TableHead>
                    <TableHead>Task Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCrmTasks.map((task) => {
                    const lead = leads.find(l => l.id === task.leadId);
                    return (
                        <TableRow key={task.id}>
                            <TableCell className="font-medium">{task.title}</TableCell>
                            <TableCell>{task.assignedToName}</TableCell>
                            <TableCell>{lead ? `${lead.name} (${lead.lastRemark})` : 'N/A'}</TableCell>
                            <TableCell>
                                {task.nextFollowUpDate ? format(task.nextFollowUpDate, "MMM d, yyyy") : '-'}
                            </TableCell>
                            <TableCell><Badge variant={task.status === 'Completed' ? 'default' : 'secondary'}>{task.status}</Badge></TableCell>
                        </TableRow>
                    );
                   })}
                </TableBody>
              </Table>
            </TabsContent>
             <TabsContent value="leads">
                <div className="flex justify-between items-center gap-2 mb-4">
                    <div className="flex items-center gap-2">
                        <Select value={leadStatusFilter} onValueChange={(value) => setLeadStatusFilter(value as Lead['status'] | 'all')}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Warm">Warm</SelectItem>
                                <SelectItem value="Cold">Cold</SelectItem>
                                <SelectItem value="Closed">Closed</SelectItem>
                                <SelectItem value="Not interested">Not interested</SelectItem>
                                <SelectItem value="Converted">Converted</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" disabled={filteredLeads.length === 0}>
                            <CSVLink 
                                data={filteredLeads} 
                                headers={csvHeaders}
                                filename={"leads.csv"}
                                className="flex items-center gap-2"
                                >
                                <Download />
                                Download Leads
                            </CSVLink>
                        </Button>
                    </div>
                     <Dialog open={isLeadDialogOpen} onOpenChange={setIsLeadDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><PlusCircle className="mr-2"/> New Lead</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Add New Lead</DialogTitle>
                                <DialogDescription>Enter the details for the new lead.</DialogDescription>
                            </DialogHeader>
                            <form key={leadFormKey} onSubmit={handleCreateLead}>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Contact Name</Label>
                                        <Input id="name" name="name" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastRemark">Last Remark</Label>
                                        <Input id="lastRemark" name="lastRemark" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" name="email" type="email" required />
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input id="phone" name="phone" required />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="secondary" onClick={() => setIsLeadDialogOpen(false)}>Cancel</Button>
                                    <Button type="submit">Add Lead</Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
                 <Dialog open={isEditLeadDialogOpen} onOpenChange={setIsEditLeadDialogOpen}>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Contact</TableHead>
                                <TableHead>Last Remark</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredLeads.map(lead => (
                                <TableRow key={lead.id} className="cursor-pointer" onClick={() => handleOpenEditLeadDialog(lead)}>
                                    <TableCell className="font-medium">{lead.name}</TableCell>
                                    <TableCell>{lead.lastRemark}</TableCell>
                                    <TableCell>{lead.email}</TableCell>
                                    <TableCell>{lead.phone}</TableCell>
                                    <TableCell><Badge variant="secondary">{lead.status}</Badge></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {selectedLead && (
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Manage Lead: {selectedLead.name}</DialogTitle>
                            <DialogDescription>Edit or delete lead information.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-name">Contact Name</Label>
                                <Input id="edit-name" value={editLeadData.name || ''} onChange={(e) => setEditLeadData({...editLeadData, name: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-lastRemark">Last Remark</Label>
                                <Input id="edit-lastRemark" value={editLeadData.lastRemark || ''} onChange={(e) => setEditLeadData({...editLeadData, lastRemark: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-email">Email</Label>
                                <Input id="edit-email" type="email" value={editLeadData.email || ''} onChange={(e) => setEditLeadData({...editLeadData, email: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-phone">Phone</Label>
                                <Input id="edit-phone" value={editLeadData.phone || ''} onChange={(e) => setEditLeadData({...editLeadData, phone: e.target.value})} />
                            </div>
                        </div>
                        <DialogFooter className="justify-between">
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive">
                                        <Trash2 className="mr-2" /> Delete Lead
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently remove {selectedLead.name}.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDeleteLead}>Continue</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <div className="flex gap-2">
                                <Button type="button" variant="secondary" onClick={() => setIsEditLeadDialogOpen(false)}>Cancel</Button>
                                <Button type="button" onClick={handleUpdateLead}>Save Changes</Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                    )}
                 </Dialog>
             </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
