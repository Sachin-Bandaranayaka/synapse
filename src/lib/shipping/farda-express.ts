import {
  ShippingProvider,
  ShippingAddress,
  PackageDetails,
  ShippingRate,
  ShippingLabel,
  ShipmentStatus,
} from './types';

interface FardaExpressConfig {
  clientId: string;
  apiKey: string;
}

interface FardaExpressResponse {
  status: string | number;
  waybill_no: string;
}

interface FardaTrackingResponse {
  status: string | number;
  tracking_data: {
    waybill_no: string;
    status: string;
    current_location?: string;
    timestamp: string;
    description?: string;
  }[];
}

export class FardaExpressService implements ShippingProvider {
  private config: FardaExpressConfig;
  private readonly NEW_WAYBILL_ENDPOINT = 'https://www.fdedomestic.com/api/parcel/new_api_v1.php';
  private readonly EXISTING_WAYBILL_ENDPOINT = 'https://www.fdedomestic.com/api/parcel/existing_waybill_api_v1.php';
  private readonly TRACKING_ENDPOINT = 'https://www.fdedomestic.com/api/parcel/tracking_api_v1.php';

  constructor(clientId: string, apiKey: string) {
    if (!clientId || !apiKey) {
      console.error('Farda Express credentials not provided');
    }

    this.config = {
      clientId: clientId,
      apiKey: apiKey,
    };

    console.log('Farda Express service initialized with:', {
      clientId: this.config.clientId.slice(0, 4) + '...',
      endpoint: this.NEW_WAYBILL_ENDPOINT
    });
  }

  async createShipment(
    origin: ShippingAddress,
    destination: ShippingAddress,
    packageDetails: PackageDetails,
    service: string,
    codAmount: number = 0
  ): Promise<ShippingLabel> {
    const formData = new FormData();
    formData.append('client_id', this.config.clientId);
    formData.append('api_key', this.config.apiKey);
    formData.append('order_id', service); // Using service as order ID
    formData.append('parcel_weight', packageDetails.weight.toString());
    formData.append('parcel_description', packageDetails.description || 'Package delivery');
    formData.append('recipient_name', destination.name);
    formData.append('recipient_contact_1', destination.phone);
    if (destination.alternatePhone) {
      formData.append('recipient_contact_2', destination.alternatePhone);
    }
    formData.append('recipient_address', destination.street);
    formData.append('recipient_city', destination.city);
    formData.append('amount', codAmount.toString()); // Use the provided COD amount
    formData.append('exchange', '0'); // Normal parcel, not an exchange

    try {
      console.log('Sending request to Farda Express:', {
        endpoint: this.NEW_WAYBILL_ENDPOINT,
        orderId: service,
        clientId: this.config.clientId,
        apiKey: this.config.apiKey ? '******' : 'missing',
        weight: packageDetails.weight,
        description: packageDetails.description,
        recipient: {
          name: destination.name,
          phone: destination.phone,
          address: destination.street,
          city: destination.city,
        },
        amount: codAmount,
      });

      const response = await fetch(this.NEW_WAYBILL_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();
      console.log('Farda Express raw response:', responseText);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }

      let data: FardaExpressResponse;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse Farda Express response:', e);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      console.log('Parsed Farda Express response:', data);

      // Convert status to number for comparison
      const statusCode = parseInt(data.status.toString(), 10);
      if (statusCode === 200) {
        if (!data.waybill_no) {
          throw new Error('No waybill number received from Farda Express');
        }
        return {
          trackingNumber: data.waybill_no,
          labelUrl: this.getTrackingUrl(data.waybill_no),
          provider: this.getName(),
        };
      } else {
        const errorMessage = this.getErrorMessage(statusCode);
        console.error('Farda Express error:', { status: statusCode, message: errorMessage });

        // Special handling for credential errors
        if (statusCode === 211 || statusCode === 212 || statusCode === 201) {
          throw new Error(`${errorMessage} - Please check your Farda Express credentials. Status code: ${statusCode}`);
        }

        throw new Error(`${errorMessage} - Status code: ${statusCode}`);
      }
    } catch (error) {
      console.error('Farda Express API Error:', error);
      throw error instanceof Error ? error : new Error('Failed to create shipment with Farda Express');
    }
  }

  private getErrorMessage(statusCode: number): string {
    const errorMessages: { [key: number]: string } = {
      201: 'Inactive Client',
      202: 'Invalid order id',
      203: 'Invalid weight',
      204: 'Empty or invalid parcel description',
      205: 'Empty or invalid name',
      206: 'Contact number 1 is not valid',
      207: 'Contact number 2 is not valid',
      208: 'Empty or invalid address',
      209: 'Invalid City',
      210: 'Unsuccessful insert, try again',
      211: 'Invalid API key',
      212: 'Invalid or inactive client',
      213: 'Invalid exchange value',
      214: 'System maintain mode is activated',
    };

    return errorMessages[statusCode] || 'Unknown error occurred';
  }

  getTrackingUrl(trackingNumber: string): string {
    return `https://www.fdedomestic.com/track/${trackingNumber}`;
  }

  getName(): string {
    return 'Farda Express';
  }

  private async makeRequest(endpoint: string, method: string, data?: any) {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Farda Express API request failed');
    }

    return response.json();
  }

  async getRates(
    origin: ShippingAddress,
    destination: ShippingAddress,
    packageDetails: PackageDetails
  ): Promise<ShippingRate[]> {
    const data = {
      origin: {
        name: origin.name,
        address_line1: origin.street,
        city: origin.city,
        state: origin.state,
        postal_code: origin.postalCode,
        country: origin.country,
        phone: origin.phone,
      },
      destination: {
        name: destination.name,
        address_line1: destination.street,
        city: destination.city,
        state: destination.state,
        postal_code: destination.postalCode,
        country: destination.country,
        phone: destination.phone,
      },
      package: {
        weight_kg: packageDetails.weight,
        length_cm: packageDetails.length,
        width_cm: packageDetails.width,
        height_cm: packageDetails.height,
      },
    };

    const response = await this.makeRequest('/rates', 'POST', data);

    return response.rates.map((rate: any) => ({
      provider: this.getName(),
      service: rate.service_name,
      rate: rate.total_price,
      estimatedDays: rate.estimated_days,
    }));
  }

  async trackShipment(waybillNo: string): Promise<ShipmentStatus> {
    const formData = new FormData();
    formData.append('client_id', this.config.clientId);
    formData.append('api_key', this.config.apiKey);
    formData.append('waybill_no', waybillNo);

    try {
      console.log('Tracking shipment:', { waybillNo });

      const response = await fetch(this.TRACKING_ENDPOINT, {
        method: 'POST',
        body: formData,
      });

      const responseText = await response.text();
      console.log('Tracking response:', responseText);

      if (!response.ok) {
        // If the API returns 404, it means the tracking number is valid but no updates yet
        if (response.status === 404) {
          return ShipmentStatus.PENDING;
        }
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }

      let data: FardaTrackingResponse;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse tracking response:', e);
        // If we can't parse the response but it's a 200 status, assume pending
        if (response.ok) {
          return ShipmentStatus.PENDING;
        }
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      // If no tracking data is available yet, return pending status
      if (!data.tracking_data || data.tracking_data.length === 0) {
        return ShipmentStatus.PENDING;
      }

      // Get the latest tracking update
      const latestUpdate = data.tracking_data[0];
      return this.normalizeStatus(latestUpdate.status);
    } catch (error) {
      console.error('Tracking error:', error);
      // Instead of throwing the error, return a pending status
      return ShipmentStatus.PENDING;
    }
  }

  private normalizeStatus(status: string): ShipmentStatus {
    // Normalize Farda Express status to our standard statuses
    const statusMap: { [key: string]: ShipmentStatus } = {
      'PICKUP_PENDING': ShipmentStatus.PENDING,
      'PICKED_UP': ShipmentStatus.IN_TRANSIT,
      'IN_TRANSIT': ShipmentStatus.IN_TRANSIT,
      'OUT_FOR_DELIVERY': ShipmentStatus.OUT_FOR_DELIVERY,
      'DELIVERED': ShipmentStatus.DELIVERED,
      'FAILED_DELIVERY': ShipmentStatus.EXCEPTION,
      'RETURNED': ShipmentStatus.EXCEPTION
    };

    return statusMap[status.toUpperCase()] || ShipmentStatus.EXCEPTION;
  }
}
