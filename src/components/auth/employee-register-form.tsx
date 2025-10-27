
"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
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
import { UserPlus, Briefcase, Loader2 } from 'lucide-react';
import * as DataService from '@/lib/data-service';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import Link from 'next/link';

export default function EmployeeRegistrationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Pre-fill email from QR code scan
    const urlEmail = searchParams.get('email');
    if (urlEmail) {
      setEmail(urlEmail);
      toast({
        title: "Welcome!",
        description: "Your email is pre-filled. Please create a password to complete your registration.",
      });
    }
  }, [searchParams, toast]);


  const handleRegister = async () => {
    setLoading(true);
    if (password !== confirmPassword) {
        toast({
            title: "Registration Failed",
            description: "Passwords do not match.",
            variant: "destructive",
        });
        setLoading(false);
        return;
    }

    try {
        // 1. Check if employee was pre-registered by HR
        const employeeExists = await DataService.getEmployeeByEmail(email);
        if (!employeeExists) {
            throw new Error("This email has not been pre-registered by HR. Please contact your administrator.");
        }

        // 2. Create the user in Firebase Auth
        await createUserWithEmailAndPassword(auth, email, password);

        toast({
            title: "Registration Successful!",
            description: "Your account has been created. You can now log in.",
        });

        // 3. Redirect to login page
        router.push(`/employee/login`);

    } catch (error: any) {
        toast({
            title: "Registration Failed",
            description: error.message || "An unexpected error occurred. Please try again.",
            variant: "destructive",
        });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
            <div className="bg-primary/20 text-primary p-3 rounded-full">
                <UserPlus className="h-8 w-8" />
            </div>
        </div>
        <CardTitle className="text-2xl font-bold">
          Employee Registration
        </CardTitle>
        <CardDescription>
          Create your password to activate your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading || searchParams.has('email')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input id="confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required disabled={loading} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="w-full" disabled={loading}>
               {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Briefcase className="mr-2"/>}
               Register
            </Button>
          </div>
        </form>
      </CardContent>
       <CardFooter className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{' '}
            <Link href="/employee/login" className="text-primary hover:underline">
                Login here
            </Link>
          </p>
        </CardFooter>
    </Card>
  );
}
