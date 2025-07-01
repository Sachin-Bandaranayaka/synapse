import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderConfirmationProps {
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  total: number;
  salesPerson: string;
}

export default function OrderConfirmation({
  orderNumber,
  customerName,
  items,
  total,
  salesPerson,
}: OrderConfirmationProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order has been confirmed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Order Confirmation</Heading>
          <Text style={text}>Dear {customerName},</Text>
          <Text style={text}>
            Thank you for your order. This email confirms that your order has been
            received and is being processed.
          </Text>

          <Section style={section}>
            <Heading style={h2}>Order Details</Heading>
            <Text style={text}>Order Number: {orderNumber}</Text>
            <Hr style={hr} />
            {items.map((item, index) => (
              <Text key={index} style={text}>
                {item.name} x {item.quantity} - LKR {item.price.toFixed(2)}
              </Text>
            ))}
            <Hr style={hr} />
            <Text style={text}>Total: LKR {total.toFixed(2)}</Text>
          </Section>

          <Text style={text}>
            Your sales representative, {salesPerson}, will be in touch with you
            regarding the delivery details.
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
};

const hr = {
  borderColor: '#e6e6e6',
  margin: '16px 0',
};

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '48px 0 0',
  fontStyle: 'italic',
};
