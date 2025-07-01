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

interface ShipmentUpdateProps {
  trackingNumber: string;
  status: string;
  provider: string;
  estimatedDelivery: Date;
  orderNumber: string;
  customerName: string;
}

export default function ShipmentUpdate({
  trackingNumber,
  status,
  provider,
  estimatedDelivery,
  orderNumber,
  customerName,
}: ShipmentUpdateProps) {
  return (
    <Html>
      <Head />
      <Preview>Shipment Update: {trackingNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Shipment Status Update</Heading>
          <Text style={text}>Dear {customerName},</Text>
          <Text style={text}>
            There has been an update to your shipment with tracking number{' '}
            {trackingNumber}.
          </Text>

          <Section style={section}>
            <Heading style={h2}>Shipment Details</Heading>
            <Text style={text}>Order Number: {orderNumber}</Text>
            <Text style={text}>Tracking Number: {trackingNumber}</Text>
            <Text style={text}>Status: {status}</Text>
            <Text style={text}>Shipping Provider: {provider}</Text>
            <Text style={text}>
              Estimated Delivery:{' '}
              {estimatedDelivery.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
          </Section>

          <Section style={trackingSection}>
            <Heading style={h2}>Track Your Shipment</Heading>
            <Text style={text}>
              You can track your shipment directly on the {provider} website using
              your tracking number.
            </Text>
          </Section>

          <Text style={text}>
            If you have any questions about your shipment, please don't hesitate
            to contact our customer service team.
          </Text>

          <Text style={footer}>
            Best regards,
            <br />
            J-nex Holdings Shipping Team
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

const trackingSection = {
  padding: '24px',
  border: '1px solid #9ae6b4',
  borderRadius: '4px',
  margin: '24px 0',
  backgroundColor: '#f0fff4',
};

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '48px 0 0',
  fontStyle: 'italic',
};
