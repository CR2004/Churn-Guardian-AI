import axios from 'axios';
import type { KlaviyoProfile, KlaviyoEvent, KlaviyoMetric } from '../types';

const KLAVIYO_BASE_URL = 'https://a.klaviyo.com/api';
const KLAVIYO_REVISION = '2024-10-15';

export class KlaviyoService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      'Authorization': `Klaviyo-API-Key ${this.apiKey}`,
      'revision': KLAVIYO_REVISION,
      'Content-Type': 'application/json',
    };
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await axios.get(`${KLAVIYO_BASE_URL}/profiles`, {
        headers: this.getHeaders(),
        params: {
          'page[size]': 1,
        },
      });
      return response.status === 200;
    } catch (error) {
      console.error('Klaviyo API validation failed:', error);
      return false;
    }
  }

  async getProfiles(pageSize = 100): Promise<KlaviyoProfile[]> {
    try {
      const response = await axios.get(`${KLAVIYO_BASE_URL}/profiles`, {
        headers: this.getHeaders(),
        params: {
          'page[size]': pageSize,
        },
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch profiles:', error);
      throw new Error('Failed to fetch customer profiles from Klaviyo');
    }
  }

  async getEventsForProfile(profileId: string): Promise<KlaviyoEvent[]> {
    try {
      const response = await axios.get(`${KLAVIYO_BASE_URL}/events`, {
        headers: this.getHeaders(),
        params: {
          'filter': `equals(profile_id,"${profileId}")`,
          'page[size]': 100,
        },
      });
      return response.data.data || [];
    } catch (error) {
      console.error(`Failed to fetch events for profile ${profileId}:`, error);
      return [];
    }
  }

  async getMetrics(): Promise<KlaviyoMetric[]> {
    try {
      const response = await axios.get(`${KLAVIYO_BASE_URL}/metrics`, {
        headers: this.getHeaders(),
      });
      return response.data.data || [];
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      return [];
    }
  }

  async getMetricById(metricId: string): Promise<KlaviyoMetric | null> {
    try {
      const response = await axios.get(`${KLAVIYO_BASE_URL}/metrics/${metricId}`, {
        headers: this.getHeaders(),
      });
      return response.data.data || null;
    } catch (error) {
      console.error(`Failed to fetch metric ${metricId}:`, error);
      return null;
    }
  }

  async createCampaign(campaignData: {
    name: string;
    subject: string;
    preheader?: string;
    fromEmail: string;
    fromName: string;
    content: string;
    listIds: string[];
  }): Promise<{ success: boolean; campaignId?: string; error?: string }> {
    try {
      const response = await axios.post(
        `${KLAVIYO_BASE_URL}/campaigns`,
        {
          data: {
            type: 'campaign',
            attributes: {
              name: campaignData.name,
              audiences: {
                included: campaignData.listIds.map(id => ({ type: 'list', id })),
              },
              'send-strategy': {
                method: 'static',
              },
            },
          },
        },
        {
          headers: this.getHeaders(),
        }
      );

      return {
        success: true,
        campaignId: response.data.data.id,
      };
    } catch (error) {
      console.error('Failed to create campaign:', error);
      return {
        success: false,
        error: 'Failed to create campaign in Klaviyo',
      };
    }
  }
}
