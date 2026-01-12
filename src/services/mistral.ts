import axios from 'axios';
import type { MistralRequest, MistralResponse, Customer } from '../types';

const MISTRAL_BASE_URL = 'https://api.mistral.ai/v1';

export class MistralService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await axios.post(
        `${MISTRAL_BASE_URL}/chat/completions`,
        {
          model: 'mistral-small-latest',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 5,
        },
        {
          headers: this.getHeaders(),
        }
      );
      return response.status === 200;
    } catch (error) {
      console.error('Mistral API validation failed:', error);
      return false;
    }
  }

  async generateCampaign(
    customer: Customer,
    model: string = 'mistral-small-latest',
    tone: string = 'Friendly'
  ): Promise<{
    subject: string;
    preheader: string;
    body: string;
    cta: string;
  }> {
    const prompt = this.buildCampaignPrompt(customer, tone);

    const request: MistralRequest = {
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert e-commerce email marketing copywriter. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    };

    try {
      const response = await axios.post<MistralResponse>(
        `${MISTRAL_BASE_URL}/chat/completions`,
        request,
        {
          headers: this.getHeaders(),
        }
      );

      const content = response.data.choices[0].message.content;

      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        subject: parsed.subject || 'We Miss You!',
        preheader: parsed.preheader || 'Come back and save 20%',
        body: parsed.body || this.getDefaultBody(customer),
        cta: parsed.cta || 'Shop Now & Save 20%',
      };
    } catch (error) {
      console.error('Failed to generate campaign:', error);

      if (axios.isAxiosError(error) && error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Free tier allows 1 request per second.');
      }

      throw new Error('Failed to generate campaign with Mistral AI');
    }
  }

  private buildCampaignPrompt(customer: Customer, tone: string): string {
    const toneInstructions = {
      Friendly: 'warm, personal, and conversational',
      Professional: 'polished, respectful, and business-appropriate',
      Casual: 'relaxed, fun, and approachable',
      Luxury: 'sophisticated, exclusive, and premium',
    };

    const toneDescription = toneInstructions[tone as keyof typeof toneInstructions] || toneInstructions.Friendly;

    return `You are an expert e-commerce email marketing copywriter. Create a win-back email campaign for a customer with these details:
- Name: ${customer.name}
- Last Product Viewed: ${customer.daysSinceLastProductView} days ago
- engagement trend: $${customer.engagementTrend ? (customer.engagementTrend > 0 ? 'increasing' : 'declining') : 'stable'}

Create a personalized campaign that:
1. Acknowledges their past loyalty
2. Creates urgency with a 20% discount expiring in 48 hours
3. Recommends 3 products based on their history
4. Uses a ${toneDescription} tone

Return ONLY valid JSON with this exact structure:
{
  "subject": "subject line under 60 characters",
  "preheader": "preview text under 100 characters",
  "body": "full email body with proper formatting",
  "cta": "call to action button text"
}`;
  }

  private getDefaultBody(customer: Customer): string {
    return `Hi ${customer.firstName || customer.name},

We noticed it's been ${customer.daysSinceLastProductView} days since your last visit, and we miss you!

As one of our valued customers, we wanted to reach out with a special offer just for you: 20% off your next purchase!

This exclusive discount is our way of saying thank you for being part of our community. But hurry - this offer expires in just 48 hours.

Click below to start shopping and automatically apply your discount.

We can't wait to see you again!`;
  }
}
