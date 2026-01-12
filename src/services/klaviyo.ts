import axios from 'axios';
import type { KlaviyoProfile, KlaviyoEvent, KlaviyoMetric } from '../types';

const KLAVIYO_BASE_URL = import.meta.env.VITE_KLAVIYO_BASE_URL;
const KLAVIYO_REVISION = import.meta.env.VITE_KLAVIYO_API_REVISION;
const DEFAULT_API_KEY = import.meta.env.VITE_KLAVIYO_API_KEY || '';

export class KlaviyoService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey || DEFAULT_API_KEY;
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
    } catch (error: any) {
      console.error('Klaviyo API validation failed:', error?.message || error, error?.response?.status, error?.response?.data);
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

  async getCampaignCount(channel: 'email' | 'sms' | 'mobile_push' = 'email'): Promise<number> {
    try {
      const filterParam = `equals(messages.channel,'${channel}')`;
      const params = new URLSearchParams({
        'filter': filterParam,
      });
      
      const url = `${KLAVIYO_BASE_URL}/campaigns?${params.toString()}`;
      
      const response = await axios.get(url, {
        headers: this.getHeaders(),
      });

      let totalCount = response.data.data?.length || 0;
      let nextPageUrl = response.data.links?.next;

      while (nextPageUrl) {
        const proxiedUrl = nextPageUrl.replace('https://a.klaviyo.com/api', KLAVIYO_BASE_URL);
        const nextResponse = await axios.get(proxiedUrl, { headers: this.getHeaders() });
        totalCount += nextResponse.data.data?.length || 0;
        nextPageUrl = nextResponse.data.links?.next;
      }
      return totalCount;
    } catch (error: any) {
      console.error(`[KlaviyoService] Failed to fetch campaign count for channel ${channel}:`, {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
        errors: error?.response?.data?.errors,
      });
      return 0;
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

async createFullCampaign(
  name: string,
  message: {
    subject: string;
    preheader?: string;
    fromEmail: string;
    fromName: string;
    replyToEmail?: string;
    content: { html?: string; text?: string };
  },
  listIds: string[] = [],
  sendStrategy: 'static' | 'immediate' 
): Promise<{ success: boolean; campaignId?: string; messageId?: string; templateId?: string; error?: any }> {
  try {
    console.log('🆕 Creating campaign...');
    
    // Build send strategy
    const sendStrategyConfig: any = { method: sendStrategy };
    if (sendStrategy === 'static') {
      const sendTime = new Date();
      sendTime.setMinutes(sendTime.getMinutes() + 5);
      sendStrategyConfig.options_static = { datetime: sendTime.toISOString() };
    }
    
    // Build campaign payload
    const campaignAttributes: any = {
      name: name,
      send_strategy: sendStrategyConfig,
      'campaign-messages': {
        data: [
          {
            type: 'campaign-message',
            attributes: {
              channel: 'email',
              content: {},
            },
          },
        ],
      },
    };

    if (listIds && listIds.length > 0) {
      campaignAttributes.audiences = { included: listIds, excluded: [] };
    }
    
    const campaignPayload = {
      data: {
        type: 'campaign',
        attributes: campaignAttributes,
      },
    };

    console.log('📤 Creating campaign...');
    const campaignResponse = await axios.post(
      `${KLAVIYO_BASE_URL}/campaigns`,
      campaignPayload,
      { headers: this.getHeaders() }
    );

    const campaignId = campaignResponse.data.data.id;
    console.log('✅ Campaign created:', campaignId);

    // Get campaign messages
    console.log('🔄 Fetching campaign messages...');
    const messagesResponse = await axios.get(
      `${KLAVIYO_BASE_URL}/campaigns/${campaignId}/campaign-messages`,
      { headers: this.getHeaders() }
    );

    const messageId = messagesResponse.data.data?.[0]?.id;
    if (!messageId) {
      return {
        success: true,
        campaignId,
        error: 'Campaign created but no message found.',
      };
    }

    console.log('✅ Message ID:', messageId);

    // Create template
    console.log('🔄 Creating template...');
    const htmlContent = message.content.html || this.generateDefaultHTML(message);
    
    const templateResponse = await axios.post(
      `${KLAVIYO_BASE_URL}/templates`,
      {
        data: {
          type: 'template',
          attributes: {
            name: `${name} - Template`,
            editor_type: 'CODE',
            html: htmlContent,
            text: this.stripHTML(htmlContent),
          },
        },
      },
      { headers: this.getHeaders() }
    );

    const templateId = templateResponse.data.data.id;
    console.log('✅ Template created:', templateId);

    // Update message - ONLY content, no relationships
    console.log('🔄 Updating campaign message with content...');
    const updatePayload = {
      data: {
        type: 'campaign-message',
        id: messageId,
        attributes: {
          content: {
            subject: message.subject,
            preview_text: message.preheader || '',
            from_email: message.fromEmail,
            from_label: message.fromName,
            reply_to_email: message.replyToEmail || message.fromEmail,
          },
        },
      },
    };

    await axios.patch(
      `${KLAVIYO_BASE_URL}/campaign-messages/${messageId}`,
      updatePayload,
      { headers: this.getHeaders() }
    );

    console.log('✅ Message content updated');
    
    // Now try to assign template using the correct endpoint
    console.log('🔄 Assigning template to message...');
    try {
      await axios.post(
        `${KLAVIYO_BASE_URL}/campaign-messages/${messageId}/relationships/template`,
        {
          data: {
            type: 'template',
            id: templateId,
          },
        },
        { headers: this.getHeaders() }
      );
      console.log('✅ Template assigned via relationships endpoint');
    } catch (templateError: any) {
      console.warn('⚠️ Could not assign template via relationships endpoint');
      console.warn('Error:', templateError.response?.data);
      
      // Template created but not assigned - user can do it manually
      console.log('💡 Template created but needs manual assignment in Klaviyo UI');
    }

    console.log('🎉 Campaign creation complete!');

    return {
      success: true,
      campaignId,
      messageId,
      templateId,
    };

  } catch (error: any) {
    console.error('❌ Error:', error?.response?.status);
    console.error('Details:', JSON.stringify(error?.response?.data, null, 2));
    return {
      success: false,
      error: error?.response?.data || error?.message,
    };
  }
}

// Keep helper methods the same
private generateDefaultHTML(message: {
  subject: string;
  fromName: string;
  content: { html?: string };
}): string {
  if (message.content.html) {
    return message.content.html;
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${message.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f7;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.07);">
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 40px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 32px;">We Miss You! 💜</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 50px 40px;">
              <p style="font-size: 18px; line-height: 1.7; color: #333; margin: 0 0 24px;">Hi there,</p>
              <p style="font-size: 16px; line-height: 1.7; color: #666; margin: 0 0 24px;">We noticed it's been a while since your last visit. As a valued customer, we're offering you an <strong>exclusive 20% discount</strong>!</p>
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 32px 0;">
                <tr>
                  <td align="center">
                    <a href="#" style="display: inline-block; padding: 18px 48px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">Claim Your 20% Off →</a>
                  </td>
                </tr>
              </table>
              <p style="font-size: 16px; color: #666; margin: 0;">Warmly,<br><strong>${message.fromName}</strong></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

private stripHTML(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
}
