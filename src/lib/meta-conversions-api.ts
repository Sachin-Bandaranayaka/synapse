import { Tenant } from '@prisma/client';

interface MetaConversionEvent {
  event_name: string;
  event_time: number;
  action_source: string;
  user_data: {
    ph?: string[]; // phone numbers (hashed)
    em?: string[]; // emails (hashed)
    fn?: string;   // first name (hashed)
    ln?: string;   // last name (hashed)
    ct?: string;   // city (hashed)
    country?: string; // country code
  };
  custom_data?: {
    currency?: string;
    value?: number;
    content_name?: string;
    content_category?: string;
    content_ids?: string[];
  };
  event_source_url?: string;
  opt_out?: boolean;
}

interface MetaConversionsPayload {
  data: MetaConversionEvent[];
  test_event_code?: string;
}

class MetaConversionsAPI {
  private baseUrl = 'https://graph.facebook.com/v18.0';

  private async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data.toLowerCase().trim());
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async sendEvent(
    pixelId: string,
    accessToken: string,
    events: MetaConversionEvent[],
    testEventCode?: string
  ): Promise<boolean> {
    try {
      const payload: MetaConversionsPayload = {
        data: events,
        ...(testEventCode && { test_event_code: testEventCode })
      };

      const response = await fetch(
        `${this.baseUrl}/${pixelId}/events?access_token=${accessToken}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Meta Conversions API Error:', errorData);
        return false;
      }

      const result = await response.json();
      console.log('Meta Conversions API Success:', result);
      return true;
    } catch (error) {
      console.error('Meta Conversions API Request Failed:', error);
      return false;
    }
  }

  async trackLead(
    tenant: Tenant,
    leadData: {
      customerName: string;
      phone?: string;
      email?: string;
      city?: string;
      productCode: string;
      productName?: string;
    },
    testEventCode?: string
  ): Promise<boolean> {
    if (!tenant.metaConversionsApiEnabled || !tenant.metaPixelId || !tenant.metaAccessToken) {
      return false;
    }

    try {
      const userData: any = {};
      
      // Hash phone number if provided
      if (leadData.phone) {
        const cleanPhone = leadData.phone.replace(/\D/g, '');
        userData.ph = [await this.hashData(cleanPhone)];
      }
      
      // Hash email if provided
      if (leadData.email) {
        userData.em = [await this.hashData(leadData.email)];
      }
      
      // Hash name parts
      const nameParts = leadData.customerName.split(' ');
      if (nameParts.length > 0) {
        userData.fn = await this.hashData(nameParts[0]);
      }
      if (nameParts.length > 1) {
        userData.ln = await this.hashData(nameParts.slice(1).join(' '));
      }
      
      // Hash city if provided
      if (leadData.city) {
        userData.ct = await this.hashData(leadData.city);
      }

      const event: MetaConversionEvent = {
        event_name: 'Lead',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: userData,
        custom_data: {
          content_name: leadData.productName || leadData.productCode,
          content_category: 'product',
          content_ids: [leadData.productCode],
        },
      };

      return await this.sendEvent(
        tenant.metaPixelId,
        tenant.metaAccessToken,
        [event],
        testEventCode
      );
    } catch (error) {
      console.error('Error tracking lead:', error);
      return false;
    }
  }

  async trackPurchase(
    tenant: Tenant,
    orderData: {
      customerName: string;
      phone?: string;
      email?: string;
      city?: string;
      total: number;
      currency: string;
      productCode: string;
      productName?: string;
      orderId: string;
    },
    testEventCode?: string
  ): Promise<boolean> {
    if (!tenant.metaConversionsApiEnabled || !tenant.metaPixelId || !tenant.metaAccessToken) {
      return false;
    }

    try {
      const userData: any = {};
      
      // Hash phone number if provided
      if (orderData.phone) {
        const cleanPhone = orderData.phone.replace(/\D/g, '');
        userData.ph = [await this.hashData(cleanPhone)];
      }
      
      // Hash email if provided
      if (orderData.email) {
        userData.em = [await this.hashData(orderData.email)];
      }
      
      // Hash name parts
      const nameParts = orderData.customerName.split(' ');
      if (nameParts.length > 0) {
        userData.fn = await this.hashData(nameParts[0]);
      }
      if (nameParts.length > 1) {
        userData.ln = await this.hashData(nameParts.slice(1).join(' '));
      }
      
      // Hash city if provided
      if (orderData.city) {
        userData.ct = await this.hashData(orderData.city);
      }

      const event: MetaConversionEvent = {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        user_data: userData,
        custom_data: {
          currency: orderData.currency,
          value: orderData.total,
          content_name: orderData.productName || orderData.productCode,
          content_category: 'product',
          content_ids: [orderData.productCode],
        },
      };

      return await this.sendEvent(
        tenant.metaPixelId,
        tenant.metaAccessToken,
        [event],
        testEventCode
      );
    } catch (error) {
      console.error('Error tracking purchase:', error);
      return false;
    }
  }

  async validateCredentials(pixelId: string, accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${pixelId}?access_token=${accessToken}&fields=id,name`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Error validating Meta credentials:', error);
      return false;
    }
  }
}

export const metaConversionsAPI = new MetaConversionsAPI();
export type { MetaConversionEvent, MetaConversionsPayload };