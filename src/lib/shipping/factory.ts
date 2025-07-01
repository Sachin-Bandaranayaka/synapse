import { ShippingProvider } from './types';
import { FardaExpressService } from './farda-express';
import { TransExpressProvider } from './trans-express';
import { RoyalExpressProvider } from './royal-express';

export class ShippingProviderFactory {
  private static providers: Map<string, ShippingProvider> = new Map();

  static initialize() {
    if (this.providers.size > 0) {
      return;
    }

    // Initialize Farda Express
    const fardaApiKey = process.env.FARDA_EXPRESS_API_KEY;
    if (fardaApiKey) {
      this.providers.set(
        'farda_express',
        new FardaExpressService()
      );
    }

    // Initialize Trans Express
    const transApiKey = process.env.TRANS_EXPRESS_API_KEY;
    if (transApiKey) {
      this.providers.set(
        'trans_express',
        new TransExpressProvider(transApiKey)
      );
    }

    // Initialize Royal Express
    const royalApiKey = process.env.ROYAL_EXPRESS_API_KEY;
    if (royalApiKey) {
      this.providers.set(
        'royal_express',
        new RoyalExpressProvider(royalApiKey)
      );
    }
  }

  static getProvider(name: string): ShippingProvider {
    this.initialize();

    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Shipping provider '${name}' not found`);
    }

    return provider;
  }

  static getAllProviders(): ShippingProvider[] {
    this.initialize();
    return Array.from(this.providers.values());
  }
}
