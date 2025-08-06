import { Metadata } from 'next';
import { MetaConversionsSettings } from '@/components/settings/meta-conversions-settings';

export const metadata: Metadata = {
  title: 'Integrations - Settings',
  description: 'Configure external integrations for your account',
};

export default function IntegrationsPage() {
  return (
    <MetaConversionsSettings />
  );
}