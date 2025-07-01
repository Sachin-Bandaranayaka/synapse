import {
  ShippingProvider,
  ShippingAddress,
  PackageDetails,
  ShippingRate,
  ShippingLabel,
  ShipmentStatus,
} from './types';

export class TransExpressProvider implements ShippingProvider {
  private apiKey: string;
  private apiUrl: string;
  private readonly CREATE_SHIPMENT_ENDPOINT = '/orders/upload/single-auto';
  private readonly TRACK_SHIPMENT_ENDPOINT = '/tracking';
  private readonly DISTRICTS_ENDPOINT = '/districts';
  private readonly CITIES_ENDPOINT = '/cities';
  private readonly PROVINCES_ENDPOINT = '/provinces';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    // Use the correct API URL from the documentation
    this.apiUrl = process.env.NEXT_PUBLIC_TRANS_EXPRESS_API_URL || 'https://portal.transexpress.lk/api';
    console.log('Initialized Trans Express provider with API URL:', this.apiUrl);
    console.log('Cities endpoint:', `${this.apiUrl}${this.CITIES_ENDPOINT}`);
  }

  getName(): string {
    return 'Trans Express';
  }

  // Expose the makeRequest method for use by other classes
  public async makeApiRequest(endpoint: string, method: string, data?: any) {
    return this.makeRequest(endpoint, method, data);
  }

  private async makeRequest(endpoint: string, method: string, data?: any) {
    try {
      console.log(`Sending ${method} request to Trans Express:`, {
        endpoint: this.apiUrl + endpoint,
        data: data ? JSON.stringify(data) : undefined
      });

      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      console.log('Trans Express response status:', response.status);
      const responseText = await response.text();
      console.log('Trans Express raw response:', responseText);

      if (!response.ok) {
        console.error(`HTTP error! status: ${response.status}, body: ${responseText}`);
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse Trans Express response:', e);
        throw new Error(`Invalid JSON response: ${responseText}`);
      }

      console.log('Parsed Trans Express response:', responseData);
      return responseData;
    } catch (error) {
      console.error('Trans Express API Error:', error);
      throw error instanceof Error ? error : new Error('Failed to make request to Trans Express');
    }
  }

  async getRates(
    origin: ShippingAddress,
    destination: ShippingAddress,
    packageDetails: PackageDetails
  ): Promise<ShippingRate[]> {
    // Trans Express API doesn't seem to have a rates endpoint
    // Return static rates based on the documentation
    return [
      {
        provider: this.getName(),
        service: 'Standard',
        rate: 350,
        estimatedDays: 3,
      },
      {
        provider: this.getName(),
        service: 'Express',
        rate: 450,
        estimatedDays: 1,
      }
    ];
  }

  async createShipment(
    origin: ShippingAddress,
    destination: ShippingAddress,
    packageDetails: PackageDetails,
    service: string,
    cityId?: number,
    districtId?: number,
    orderTotal?: number
  ): Promise<ShippingLabel> {
    // Map our data to Trans Express API format
    const data: any = {
      order_no: Math.floor(Math.random() * 100000000), // Generate a random order number
      customer_name: destination.name,
      address: destination.street,
      description: `${packageDetails.weight}kg package - ${service}`,
      phone_no: destination.phone,
      phone_no2: "", // Optional
      cod: orderTotal || 0, // Use the order total amount for COD, or 0 if not provided
      note: `Shipped via JNEX - ${service} service`
    };

    // Add city and district IDs if provided
    if (cityId) {
      data.city_id = cityId;
    }

    if (districtId) {
      data.district_id = districtId;
    }

    // If neither city_id nor district_id is provided, use Colombo as default
    if (!cityId && !districtId) {
      data.city_id = 864; // Default to Colombo 01
    }

    const response = await this.makeRequest(this.CREATE_SHIPMENT_ENDPOINT, 'POST', data);

    // Check if the API call was successful
    if (!response.success && !response.order?.waybill_id) {
      throw new Error('Failed to create shipment with Trans Express');
    }

    const trackingNumber = response.order.waybill_id;
    return {
      trackingNumber: trackingNumber,
      labelUrl: `https://transexpress.lk/print-label/${trackingNumber}`, // Mock URL - actual URL may differ
      provider: this.getName(),
    };
  }

  async trackShipment(trackingNumber: string): Promise<ShipmentStatus> {
    try {
      const data = {
        waybill_id: trackingNumber
      };

      console.log(`Attempting to track Trans Express shipment: ${trackingNumber}`);

      const response = await this.makeRequest(this.TRACK_SHIPMENT_ENDPOINT, 'POST', data);

      console.log('Trans Express tracking response:', JSON.stringify(response, null, 2));

      // Handle empty response or different response format
      if (!response.data && response.error) {
        console.error('Error from Trans Express tracking:', response.error);
        return ShipmentStatus.PENDING; // Default to pending if we can't determine status
      }

      if (!response.data) {
        console.warn('No tracking data received from Trans Express, defaulting to PENDING');
        return ShipmentStatus.PENDING;
      }

      // Map the status from the API to our internal status enum
      const status = this.normalizeStatus(response.data.current_status || 'Processing');
      console.log(`Normalized status for ${trackingNumber}: ${status}`);
      return status;
    } catch (error) {
      console.error('Error in trackShipment:', error);
      // Don't throw the error, instead return a default status
      return ShipmentStatus.PENDING;
    }
  }

  private normalizeStatus(statusName: string): ShipmentStatus {
    const statusMap: { [key: string]: ShipmentStatus } = {
      'Processing': ShipmentStatus.PENDING,
      'Picked Up': ShipmentStatus.IN_TRANSIT,
      'In Transit': ShipmentStatus.IN_TRANSIT,
      'Out for Delivery': ShipmentStatus.OUT_FOR_DELIVERY,
      'Delivered': ShipmentStatus.DELIVERED,
      'Failed Delivery': ShipmentStatus.EXCEPTION,
      'Returned': ShipmentStatus.EXCEPTION,
      'Canceled': ShipmentStatus.EXCEPTION,
    };

    return statusMap[statusName] || ShipmentStatus.EXCEPTION;
  }

  getTrackingUrl(trackingNumber: string): string {
    return `https://transexpress.lk/tracking/${trackingNumber}`;
  }

  // Get districts by province
  public async getDistrictsByProvinceId(provinceId: number) {
    return this.makeRequest(`${this.DISTRICTS_ENDPOINT}?province_id=${provinceId}`, 'GET');
  }

  // Get cities by district
  public async getCitiesByDistrictId(districtId: number) {
    console.log(`Making API request to get cities for district ID: ${districtId}`);
    const result = await this.makeRequest(`${this.CITIES_ENDPOINT}?district_id=${districtId}`, 'GET');
    console.log(`Got ${result.length} cities for district ID ${districtId}`);
    return result;
  }
}
