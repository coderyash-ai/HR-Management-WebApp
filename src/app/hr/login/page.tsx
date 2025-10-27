import LoginForm from '@/components/auth/login-form';

export default function HRLoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <LoginForm isHR={true} />
    </main>
  );
}
