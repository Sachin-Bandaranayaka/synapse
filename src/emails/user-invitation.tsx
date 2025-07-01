import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface UserInvitationProps {
  name: string;
  email: string;
  temporaryPassword: string;
  role: string;
}

export default function UserInvitation({
  name,
  email,
  temporaryPassword,
  role,
}: UserInvitationProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to J-nex Holdings Sales Management System</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to J-nex Holdings</Heading>
          <Text style={text}>Dear {name},</Text>
          <Text style={text}>
            You have been invited to join the J-nex Holdings Sales Management System
            as a {role.toLowerCase()} user.
          </Text>

          <Section style={section}>
            <Heading style={h2}>Your Login Credentials</Heading>
            <Text style={text}>Email: {email}</Text>
            <Text style={text}>Temporary Password: {temporaryPassword}</Text>
          </Section>

          <Text style={warningText}>
            For security reasons, please change your password when you first log
            in.
          </Text>

          <Section style={instructionSection}>
            <Heading style={h2}>Getting Started</Heading>
            <Text style={text}>1. Visit our sales management portal</Text>
            <Text style={text}>2. Log in with your email and temporary password</Text>
            <Text style={text}>3. Update your password</Text>
            <Text style={text}>4. Complete your profile information</Text>
          </Section>

          <Text style={text}>
            If you have any questions or need assistance, please contact your
            system administrator.
          </Text>

          <Text style={{ ...text, ...footer }}>
            J-nex Holdings IT Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '48px 0',
  textAlign: 'center' as const,
};

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: '600',
  lineHeight: '1.4',
  margin: '24px 0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
};

const warningText = {
  color: '#e53e3e',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '16px 0',
  fontWeight: '600',
};

const section = {
  padding: '24px',
  border: '1px solid #e6e6e6',
  borderRadius: '4px',
  margin: '24px 0',
  backgroundColor: '#f8fafc',
};

const instructionSection = {
  padding: '24px',
  border: '1px solid #c3dafe',
  borderRadius: '4px',
  margin: '24px 0',
  backgroundColor: '#ebf4ff',
};

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '48px 0 0',
  fontStyle: 'italic',
};
