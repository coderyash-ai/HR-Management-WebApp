
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, UserPlus } from 'lucide-react';
import Image from 'next/image';
import { useEffect } from 'react';
import { setLoggedInEmployee } from '@/lib/data-service';


export default function Home() {

  useEffect(() => {
    // Clear any logged in user when returning to the home page
    setLoggedInEmployee(null);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between p-4 px-6 border-b">
        <div className="flex items-center gap-2">
            <div className="bg-primary/20 text-primary p-2 rounded-lg">
                <Briefcase className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-bold text-foreground">StaffSync Pro</h1>
        </div>
      </header>
      <main className="flex-1">
        <section className="relative w-full h-[60vh] flex items-center justify-center text-center">
            <Image 
                src="https://placehold.co/1200x800.png" 
                alt="Office Background"
                fill
                style={{objectFit:"cover"}}
                className="absolute inset-0 w-full h-full opacity-20"
                data-ai-hint="office background"
            />
            <div className="relative z-10 p-4">
                <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-foreground">
                    Your All-in-One HR Platform
                </h2>
                <p className="max-w-xl mx-auto mt-4 text-lg text-muted-foreground">
                    Streamline your HR processes, from employee management to payroll, all in one place.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                    <Button size="lg" asChild>
                        <Link href="/hr/login">
                            <Users className="mr-2" /> HR Login
                        </Link>
                    </Button>
                    <Button size="lg" variant="secondary" asChild>
                        <Link href="/employee/login">
                            <Briefcase className="mr-2" /> Employee Login
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                        <Link href="/employee/register">
                            <UserPlus className="mr-2" /> New Employee Registration
                        </Link>
                    </Button>
                </div>
            </div>
        </section>

        <section className="py-16 bg-muted/40">
            <div className="container mx-auto px-4 grid md:grid-cols-3 gap-12 text-center">
                <div className="flex flex-col items-center">
                    <h3 className="text-2xl font-bold text-primary">Easy Onboarding</h3>
                    <p className="mt-2 text-muted-foreground">
                        Get new hires up and running in minutes with our streamlined QR code registration.
                    </p>
                </div>
                <div className="flex flex-col items-center">
                    <h3 className="text-2xl font-bold text-primary">Task Management</h3>
                    <p className="mt-2 text-muted-foreground">
                        Assign, track, and manage tasks across your entire organization effortlessly.
                    </p>
                </div>
                <div className="flex flex-col items-center">
                    <h3 className="text-2xl font-bold text-primary">Time & Attendance</h3>
                    <p className="mt-2 text-muted-foreground">
                        Monitor employee check-ins, check-outs, and leave requests with a single click.
                    </p>
                </div>
            </div>
        </section>
      </main>
      <footer className="py-6 px-6 border-t text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} StaffSync Pro. All rights reserved.
      </footer>
    </div>
  );
}
