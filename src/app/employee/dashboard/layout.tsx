
"use client";

import { useState, useEffect, useCallback } from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from '@/components/ui/sidebar';
import { Bell, Briefcase, LayoutDashboard, UserCheck, CalendarClock, BarChart3, LogOut, CheckCircle, CircleOff, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ModeToggle } from '@/components/mode-toggle';
import type { Notification, Employee } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import * as DataService from '@/lib/data-service';
import { useRouter } from 'next/navigation';
import { useAuth, AuthProvider } from '@/contexts/auth-context';
import { Timestamp } from 'firebase/firestore';

function EmployeeDashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [layoutLoading, setLayoutLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/employee/login');
      return;
    }

    const loadInitialData = async () => {
      setLayoutLoading(true);
      const employeeId = DataService.getLoggedInEmployeeId();
      if (!employeeId) {
        // This can happen if the user logs in but localStorage is cleared.
        // We can try to find them by email.
        const emp = await DataService.getEmployeeByEmail(user.email!);
        if (emp) {
          DataService.setLoggedInEmployee(emp.id);
          setEmployee(emp);
          const notifs = await DataService.getEmployeeNotifications(emp.id);
          setNotifications(notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
        } else {
           // If still not found, something is wrong, redirect to login.
           router.push('/employee/login');
           return;
        }
      } else {
        const [emp, notifs] = await Promise.all([
            DataService.getEmployeeById(employeeId),
            DataService.getEmployeeNotifications(employeeId),
        ]);

        if (emp) {
            setEmployee(emp);
            setNotifications(notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
        } else {
            // Employee ID in local storage is invalid
            router.push('/employee/login');
            return;
        }
      }
      setLayoutLoading(false);
    };

    loadInitialData();
  }, [user, authLoading, router]);

  const handleScroll = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  const handleDeleteNotification = async (id: string) => {
    await DataService.deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkNotificationsRead = async () => {
    if (!employee || unreadNotifications === 0) return;
    await DataService.markNotificationsAsRead(employee.id);
    setNotifications(prev => prev.map(n => ({...n, read: true})));
  }
  
  const handleLogout = async () => {
    await logout();
    DataService.setLoggedInEmployee(null);
    router.push('/');
  }

  const notificationIcons = {
    'new-task': <Briefcase className="h-4 w-4" />,
    'leave-status-approved': <CheckCircle className="h-4 w-4 text-green-500" />,
    'leave-status-rejected': <CircleOff className="h-4 w-4 text-red-500" />,
    'task-completed': <CheckCircle className="h-4 w-4 text-green-500" />,
    'leave-request': <CalendarClock className="h-4 w-4 text-yellow-500" />,
    'leave-status': <CalendarClock className="h-4 w-4" />,
  };
  
  const unreadNotifications = notifications.filter(n => !n.read).length;

  if (authLoading || layoutLoading || !employee) {
    return <div>Loading layout...</div>;
  }
  
  const lastActivityDate = employee.lastActivity instanceof Timestamp 
    ? employee.lastActivity.toDate() 
    : employee.lastActivity;

  return (
    <SidebarProvider>
      <Sidebar collapsible="none">
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <div className="bg-primary/20 text-primary p-2 rounded-lg">
              <Briefcase className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-semibold">StaffSync Pro</h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton href="/employee/dashboard" isActive>
                <LayoutDashboard />
                Dashboard
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleScroll('my-tasks')}>
                <UserCheck />
                My Tasks
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleScroll('my-leave')}>
                <CalendarClock />
                My Leave
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleScroll('my-stats')}>
                <BarChart3 />
                My Stats
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <div className="p-4 mt-auto">
            <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleLogout}>
                      <LogOut />
                      Logout
                  </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </div>
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-end p-4 border-b">
            <div className="flex items-center gap-4">
                <ModeToggle />
                 <Popover onOpenChange={(open) => !open && handleMarkNotificationsRead()}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {unreadNotifications > 0 && (
                                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-primary ring-2 ring-background"></span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent align="end" className="w-96">
                         <div className="flex items-center justify-between p-2">
                            <h4 className="font-medium text-sm">Notifications</h4>
                             {unreadNotifications > 0 && <Badge variant="secondary">{unreadNotifications} New</Badge>}
                        </div>
                        <div className="space-y-2 p-2 max-h-80 overflow-y-auto">
                            {notifications.map(notification => (
                                <div key={notification.id} className={cn("flex items-start gap-3 p-2 rounded-lg group", !notification.read && "bg-accent")}>
                                    <div className="mt-1">
                                      {notification.type === 'new-task' && notificationIcons['new-task']}
                                      {notification.type === 'leave-status' && notification.message.includes('approved') && notificationIcons['leave-status-approved']}
                                      {notification.type === 'leave-status' && notification.message.includes('rejected') && notificationIcons['leave-status-rejected']}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm">{notification.message}</p>
                                        <p className="text-xs text-muted-foreground">{formatDistanceToNow(notification.timestamp, { addSuffix: true })}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteNotification(notification.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            {notifications.length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">No notifications yet.</p>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>
                <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src="https://placehold.co/100x100.png" alt="Employee User" data-ai-hint="woman portrait" />
                        <AvatarFallback>{employee.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                        <p className="font-semibold">{employee.name}</p>
                        <p className="text-muted-foreground">{employee.role}</p>
                    </div>
                </div>
            </div>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}


export default function EmployeeDashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <EmployeeDashboardLayoutContent>{children}</EmployeeDashboardLayoutContent>
        </AuthProvider>
    )
}
