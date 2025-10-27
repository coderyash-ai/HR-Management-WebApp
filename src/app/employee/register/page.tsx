import EmployeeRegistrationForm from '@/components/auth/employee-register-form';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

function RegistrationForm() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="h-12 w-12 animate-spin" /></div>}>
      <EmployeeRegistrationForm />
    </Suspense>
  )
}

export default function EmployeeRegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <RegistrationForm />
    </main>
  );
}
