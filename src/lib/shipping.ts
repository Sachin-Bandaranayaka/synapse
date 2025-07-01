export type CourierType = 'FARDA_EXPRESS' | 'TRANS_EXPRESS' | 'ROYAL_EXPRESS';

interface ShippingRate {
  cost: number;
  estimatedDays: number;
}

interface ShippingLabel {
  trackingNumber: string;
  labelUrl: string;
}

export class ShippingService {
  private static instance: ShippingService;
  private constructor() { }

  static getInstance(): ShippingService {
    if (!ShippingService.instance) {
      ShippingService.instance = new ShippingService();
    }
    return ShippingService.instance;
  }

  async getShippingRates(
    courier: CourierType,
    destinationAddress: string
  ): Promise<ShippingRate> {
    // TODO: Implement actual API integration
    // This is a mock implementation
    switch (courier) {
      case 'FARDA_EXPRESS':
        return {
          cost: 350,
          estimatedDays: 2,
        };
      case 'TRANS_EXPRESS':
        return {
          cost: 400,
          estimatedDays: 1,
        };
      case 'ROYAL_EXPRESS':
        return {
          cost: 380,
          estimatedDays: 2,
        };
      default:
        throw new Error('Invalid courier');
    }
  }

  async createShipment(
    courier: CourierType,
    order: any
  ): Promise<ShippingLabel> {
    // TODO: Implement actual API integration
    // This is a mock implementation
    const trackingNumber = Math.random().toString(36).substring(2, 15);

    return {
      trackingNumber,
      labelUrl: `https://example.com/labels/${trackingNumber}.pdf`,
    };
  }

  async getShipmentStatus(
    courier: CourierType,
    trackingNumber: string
  ): Promise<string> {
    // TODO: Implement actual API integration
    // This is a mock implementation
    return 'In Transit';
  }
}

// Helper function to format addresses for shipping labels
export function formatShippingAddress(addressData: any): string {
  const parts = [
    addressData.address,
    addressData.city,
    addressData.postalCode,
    'Sri Lanka',
  ].filter(Boolean);

  return parts.join(', ');
}
