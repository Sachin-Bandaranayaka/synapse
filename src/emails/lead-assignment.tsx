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

interface LeadAssignmentProps {
  leadId: string;
  customerName: string;
  productName: string;
  assignedTo: string;
}

export default function LeadAssignment({
  leadId,
  customerName,
  productName,
  assignedTo,
}: LeadAssignmentProps) {
  return (
    <Html>
      <Head />
      <Preview>New lead assigned: {customerName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>New Lead Assignment</Heading>
          <Text style={text}>Dear {assignedTo},</Text>
          <Text style={text}>
            A new lead has been assigned to you in the sales management system.
          </Text>

          <Section style={section}>
            <Heading style={h2}>Lead Details</Heading>
            <Text style={text}>Lead ID: {leadId}</Text>
            <Text style={text}>Customer Name: {customerName}</Text>
            <Text style={text}>Product Interest: {productName}</Text>
          </Section>

          <Text style={text}>
            Please follow up with the customer as soon as possible to discuss their
            interest in our products.
          </Text>

          <Text style={text}>
            You can view the full lead details and update the status in the sales
            management system.
          </Text>

          <Text style={footer}>
            Best regards,
            <br />
            J-nex Holdings Sales Team
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

const section = {
  padding: '24px',
  border: '1px solid #e6e6e6',
  borderRadius: '4px',
  margin: '24px 0',
  backgroundColor: '#f8fafc',
};

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '48px 0 0',
  fontStyle: 'italic',
};
