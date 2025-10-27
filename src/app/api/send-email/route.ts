
import { Resend } from 'resend';
import { NextResponse } from 'next/server';
import NewTaskEmail from '@/components/emails/new-task-email';

export async function POST(req: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.error("Resend API key is not set. Please set RESEND_API_KEY in your .env file.");
    return NextResponse.json({ error: 'Email service is not configured.' }, { status: 500 });
  }

  const resend = new Resend(resendApiKey);

  try {
    const { to, name, taskTitle, taskDescription } = await req.json();

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: [to],
      subject: 'New Task Assigned to You',
      react: NewTaskEmail({ name, taskTitle, taskDescription }),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: 'Error sending email' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
