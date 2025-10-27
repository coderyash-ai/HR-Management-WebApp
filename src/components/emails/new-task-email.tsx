
import * as React from 'react';
import { Html } from '@react-email/components';
import { Head } from '@react-email/components';
import { Preview } from '@react-email/components';
import { Body } from '@react-email/components';
import { Container } from '@react-email/components';
import { Section } from '@react-email/components';
import { Img } from '@react-email/components';
import { Text } from '@react-email/components';
import { Hr } from '@react-email/components';
import { Button } from '@react-email/components';
import { Link } from '@react-email/components';

interface NewTaskEmailProps {
  name: string;
  taskTitle: string;
  taskDescription: string;
}

const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '';

export default function NewTaskEmail({
  name,
  taskTitle,
  taskDescription,
}: NewTaskEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>A new task has been assigned to you on StaffSync Pro.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoContainer}>
             <Text style={logoText}>StaffSync Pro</Text>
          </Section>
          <Text style={h1}>New Task Assigned</Text>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            A new task has been assigned to you by your HR manager. Please review the details below.
          </Text>
          
          <Section style={taskBox}>
            <Text style={taskTitleStyle}>{taskTitle}</Text>
            <Text style={taskDescriptionStyle}>{taskDescription}</Text>
          </Section>

          <Text style={text}>
            Please log in to your dashboard to view and update the status of this task.
          </Text>
          <Section style={{ textAlign: 'center' }}>
            <Button
              style={button}
              href={`${baseUrl}/employee/login`}
            >
              Go to Dashboard
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            This is an automated notification from StaffSync Pro.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: 'Helvetica,Arial,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
};

const logoContainer = {
    padding: '0 20px',
    borderBottom: '1px solid #e0e0e0',
    textAlign: 'center' as const,
};

const logoText = {
    fontSize: '24px',
    fontWeight: 'bold' as const,
    color: '#1A202C',
    padding: '16px 0',
};


const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
  padding: '0',
};

const text = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  padding: '0 20px',
};

const taskBox = {
    background: '#f8f9fa',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    margin: '20px',
    padding: '16px',
};

const taskTitleStyle = {
    fontSize: '18px',
    fontWeight: 'bold' as const,
    color: '#333',
    margin: '0 0 8px 0',
};

const taskDescriptionStyle = {
    fontSize: '14px',
    color: '#555',
    margin: '0',
};


const button = {
  backgroundColor: '#64B5F6',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 20px',
  width: 'auto',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
  padding: '0 20px',
};
