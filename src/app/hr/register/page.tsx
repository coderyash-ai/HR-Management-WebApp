
"use client";

import { useState } from "react";
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import * as DataService from "@/lib/data-service";
import { useToast } from "@/hooks/use-toast";

export default function RegisterEmployeePage() {
    const { toast } = useToast();
    const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
    const [employeeName, setEmployeeName] = useState<string>('');
    const [formKey, setFormKey] = useState(Date.now()); // Used to reset form
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const name = formData.get('name') as string;
        const email = formData.get('email') as string;
        const salary = formData.get('salary') as string;

        try {
            const newEmployee = await DataService.addEmployee({
                name,
                email,
                salary: parseFloat(salary),
                role: 'Employee',
            });
            
            // The QR code now points to the employee registration page
            const registrationUrl = `${window.location.origin}/employee/register?email=${encodeURIComponent(email)}`;
            
            const generatedQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(registrationUrl)}&bgcolor=1E293B&color=64B5F6&qzone=1`;

            setEmployeeName(name);
            setQrCodeUrl(generatedQrCodeUrl);
            setFormKey(Date.now()); // Reset form by changing key
            toast({
                title: "Employee Registered",
                description: `${name} has been successfully added. Please provide them the QR code.`,
            });
        } catch (error) {
            console.error("Failed to register employee:", error);
            toast({
                title: "Registration Failed",
                description: "Could not register the new employee. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDialogClose = () => {
        setQrCodeUrl(null);
        setEmployeeName('');
    }

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Register New Employee</h1>
                <p className="text-muted-foreground">Fill out the form below to add a new employee.</p>
            </div>
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="bg-primary/20 text-primary p-2 rounded-lg">
                           <UserPlus className="h-6 w-6" />
                        </div>
                        <CardTitle>Employee Registration Form</CardTitle>
                    </div>
                    <CardDescription>All fields are required to register a new employee.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form key={formKey} onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" placeholder="e.g., John Doe" required disabled={loading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" name="email" type="email" placeholder="e.g., john.doe@example.com" required disabled={loading} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="salary">Monthly Salary (INR)</Label>
                            <Input id="salary" name="salary" type="number" placeholder="e.g., 50000" required disabled={loading} />
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Generating...' : 'Generate Registration QR'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            <Dialog open={!!qrCodeUrl} onOpenChange={(open) => !open && handleDialogClose()}>
                <DialogContent>
                    <DialogHeader>
                        <div className="flex justify-center mb-4">
                            <div className="bg-primary/20 text-primary p-3 rounded-full">
                                <QrCode className="h-8 w-8" />
                            </div>
                        </div>
                        <DialogTitle className="text-center text-2xl">Registration Code for {employeeName}</DialogTitle>
                        <DialogDescription className="text-center">
                            Ask the new employee to scan this QR code with their device to complete their registration by setting a password.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center p-4 bg-card-foreground/5 rounded-lg my-4">
                        {qrCodeUrl && (
                            <Image
                              src={qrCodeUrl}
                              alt="Registration QR Code"
                              width={250}
                              height={250}
                              priority
                            />
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">Done</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
