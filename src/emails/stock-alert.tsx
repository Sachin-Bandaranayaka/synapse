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

interface StockAlertProps {
  productName: string;
  productCode: string;
  currentStock: number;
  lowStockThreshold: number;
}

export default function StockAlert({
  productName,
  productCode,
  currentStock,
  lowStockThreshold,
}: StockAlertProps) {
  return (
    <Html>
      <Head />
      <Preview>Low stock alert: {productName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Low Stock Alert</Heading>
          <Text style={text}>
            This is an automated notification to inform you that the following
            product has reached its low stock threshold:
          </Text>

          <Section style={section}>
            <Heading style={h2}>Product Details</Heading>
            <Text style={text}>Product Name: {productName}</Text>
            <Text style={text}>Product Code: {productCode}</Text>
            <Text style={text}>Current Stock: {currentStock}</Text>
            <Text style={text}>Low Stock Threshold: {lowStockThreshold}</Text>
          </Section>

          <Text style={warningText}>
            Please review the inventory levels and consider restocking this product
            to maintain optimal inventory levels.
          </Text>

          <Text style={text}>
            You can manage inventory levels and create purchase orders through the
            inventory management system.
          </Text>

          <Text style={footer}>
            Best regards,
            <br />
            J-nex Holdings Inventory Management System
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
  border: '1px solid #feb2b2',
  borderRadius: '4px',
  margin: '24px 0',
  backgroundColor: '#fff5f5',
};

const footer = {
  color: '#666',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '48px 0 0',
  fontStyle: 'italic',
};
