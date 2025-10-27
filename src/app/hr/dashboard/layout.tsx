
"use client";

import { useState, useEffect, useCallback } from 'react';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarInset } from '@/components/ui/sidebar';
import { Bell, Briefcase, Building2, LayoutDashboard, Users, LogOut, CheckCircle, MailWarning, Trash2, IndianRupee, UserPlus, CalendarClock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ModeToggle } from '@/components/mode-toggle';
import Link from 'next/link';
import type { Notification, HRUser } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { usePathname, useRouter } from 'next/navigation';
import * as DataService from '@/lib/data-service';
import { useAuth, AuthProvider } from '@/contexts/auth-context';
import { Timestamp } from 'firebase/firestore';


function HRDashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [hrUser, setHrUser] = useState<HRUser | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [layoutLoading, setLayoutLoading] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading) return; // Wait for Firebase Auth to initialize
    if (!user) {
      router.push('/hr/login');
      return;
    }

    const loadInitialData = async () => {
      setLayoutLoading(true);

      // Use the new, robust method to get or create the HR user.
      // This function also handles migrating and cleaning up incorrect data.
      const hrData = await DataService.getOrCreateHrUser({
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName,
      });

      // Simple check to ensure we got an HR user back.
      if (!hrData || hrData.role !== 'HR') {
           console.error("Authorization failed. User is not an HR Manager.");
           logout();
           router.push('/hr/login');
           return;
      }
      
      setHrUser(hrData);
      DataService.setLoggedInEmployee(hrData.id); // For prototype compatibility
      
      const notifs = await DataService.getHRNotifications();
      setNotifications(notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
      
      setLayoutLoading(false);
    };

    loadInitialData();
  }, [user, authLoading, router, logout]);


  const handleScroll = (id: string) => {
    if (pathname !== '/hr/dashboard') {
        router.push('/hr/dashboard', { scroll: false });
        setTimeout(() => {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }, 300);
    } else {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }
  };
  
  const handleDeleteNotification = async (id: string) => {
    await DataService.deleteNotification(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };
  
  const handleMarkNotificationsRead = async () => {
    if (unreadNotifications === 0) return;
    await DataService.markNotificationsAsRead('hr');
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  const handleLogout = async () => {
    await logout();
    DataService.setLoggedInEmployee(null); // Clear prototype login state
    router.push('/');
  }

  const notificationIcons = {
    'task-completed': <CheckCircle className="h-4 w-4 text-green-500" />,
    'leave-request': <MailWarning className="h-4 w-4 text-yellow-500" />,
    'new-task': <Briefcase className="h-4 w-4" />,
    'leave-status': <CalendarClock className="h-4 w-4" />,
  };
  
  const unreadNotifications = notifications.filter(n => !n.read).length;

  if (authLoading || layoutLoading || !hrUser) {
    return <div>Loading layout...</div>;
  }

  const lastActivityDate = hrUser.lastActivity instanceof Timestamp 
    ? hrUser.lastActivity.toDate() 
    : hrUser.lastActivity;

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
              <SidebarMenuButton asChild isActive={pathname === '/hr/dashboard'}>
                <Link href="/hr/dashboard">
                  <LayoutDashboard />
                  Dashboard
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleScroll('live-status')}>
                <Users />
                Employees
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleScroll('payroll-stats')}>
                <IndianRupee />
                Payroll
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => handleScroll('work-management')}>
                <Building2 />
                CRM
              </SidebarMenuButton>
            </SidebarMenuItem>
             <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/hr/register'}>
                  <Link href="/hr/register">
                    <UserPlus />
                    Register Employee
                  </Link>
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
                                    <div className="mt-1">{notificationIcons[notification.type as keyof typeof notificationIcons]}</div>
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
                        <AvatarImage src="https://placehold.co/100x100.png" alt="HR User" data-ai-hint="person" />
                        <AvatarFallback>{hrUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="text-sm">
                        <p className="font-semibold">{hrUser.name}</p>
                        <p className="text-muted-foreground">{hrUser.role} Manager</p>
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


export default function HRDashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <HRDashboardLayoutContent>{children}</HRDashboardLayoutContent>
        </AuthProvider>
    )
}
