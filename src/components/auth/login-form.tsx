
"use client";

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Users, User, Briefcase, Loader2 } from 'lucide-react';
import * as DataService from '@/lib/data-service';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import Link from 'next/link';

export default function LoginForm({ isHR }: { isHR: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    
    try {
        await signInWithEmailAndPassword(auth, email, password);

        if (isHR) {
            router.push(`/hr/dashboard`);
        } else {
            const employee = await DataService.getEmployeeByEmail(email);
            if (employee && employee.role === 'Employee') {
                DataService.setLoggedInEmployee(employee.id);
                router.push(`/employee/dashboard`);
            } else {
                 throw new Error("No employee account found for this email.");
            }
        }
    } catch (error: any) {
        toast({
            title: "Login Failed",
            description: error.message || "Incorrect credentials. Please try again.",
            variant: "destructive",
        });
        setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
            <div className="bg-primary/20 text-primary p-3 rounded-full">
                {isHR ? <Users className="h-8 w-8" /> : <User className="h-8 w-8" />}
            </div>
        </div>
        <CardTitle className="text-2xl font-bold">
          {isHR ? 'HR Login' : 'Employee Login'}
        </CardTitle>
        <CardDescription>
          {isHR ? 'Sign in with your HR credentials.' : 'Welcome back! Please sign in to continue.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
               {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Briefcase className="mr-2"/>}
               Login
            </Button>
          </div>
        </form>
      </CardContent>
      {!isHR && (
        <CardFooter className="flex flex-col gap-4">
          <div className="relative w-full">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              OR
            </span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            New Employee?{' '}
            <Link href="/employee/register" className="text-primary hover:underline">
              Register here
            </Link>
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
