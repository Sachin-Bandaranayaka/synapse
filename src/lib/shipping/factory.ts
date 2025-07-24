import { ShippingProvider } from './types';
import { FardaExpressService } from './farda-express';
import { TransExpressProvider } from './trans-express';
import { RoyalExpressProvider } from './royal-express';

interface TenantApiKeys {
  fardaExpressClientId?: string;
  fardaExpressApiKey?: string;
  transExpressApiKey?: string;
  royalExpressApiKey?: string;
}

export class ShippingProviderFactory {
  private providers: Map<string, ShippingProvider> = new Map();

  constructor(tenantApiKeys: TenantApiKeys) {
    // Initialize Farda Express
    if (tenantApiKeys.fardaExpressApiKey && tenantApiKeys.fardaExpressClientId) {
      this.providers.set(
        'farda_express',
        new FardaExpressService(tenantApiKeys.fardaExpressClientId, tenantApiKeys.fardaExpressApiKey)
      );
    }

    // Initialize Trans Express
    if (tenantApiKeys.transExpressApiKey) {
      this.providers.set(
        'trans_express',
        new TransExpressProvider(tenantApiKeys.transExpressApiKey)
      );
    }

    // Initialize Royal Express
    if (tenantApiKeys.royalExpressApiKey) {
      this.providers.set(
        'royal_express',
        new RoyalExpressProvider(tenantApiKeys.royalExpressApiKey)
      );
    }
  }

  getProvider(name: string): ShippingProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Shipping provider '${name}' not found`);
    }
    return provider;
  }

  getAllProviders(): ShippingProvider[] {
    return Array.from(this.providers.values());
  }
}
