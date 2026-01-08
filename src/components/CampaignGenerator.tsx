import { useState, useEffect } from 'react';
import { Sparkles, Send, X, TrendingUp, MousePointerClick, DollarSign, Mail as MailIcon } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Card } from './Card';
import { MistralService } from '../services/mistral';
import type { Customer, GeneratedCampaign, Settings } from '../types';

interface CampaignGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  mistralApiKey: string;
  settings: Settings;
  onSendCampaign: (campaign: GeneratedCampaign, customer: Customer) => void;
}

export function CampaignGenerator({
  isOpen,
  onClose,
  customer,
  mistralApiKey,
  settings,
  onSendCampaign,
}: CampaignGeneratorProps) {
  const [generating, setGenerating] = useState(false);
  const [campaign, setCampaign] = useState<GeneratedCampaign | null>(null);
  const [error, setError] = useState('');
  const [editableSubject, setEditableSubject] = useState('');
  const [editablePreheader, setEditablePreheader] = useState('');
  const [editableBody, setEditableBody] = useState('');
  const [editableCta, setEditableCta] = useState('');

  useEffect(() => {
    if (isOpen && customer && !campaign) {
      generateCampaign();
    }
  }, [isOpen, customer]);

  useEffect(() => {
    if (!isOpen) {
      setCampaign(null);
      setError('');
      setEditableSubject('');
      setEditablePreheader('');
      setEditableBody('');
      setEditableCta('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (campaign) {
      setEditableSubject(campaign.subject);
      setEditablePreheader(campaign.preheader);
      setEditableBody(campaign.body);
      setEditableCta(campaign.cta);
    }
  }, [campaign]);

  const generateCampaign = async () => {
    if (!customer) return;

    setGenerating(true);
    setError('');

    try {
      const mistralService = new MistralService(mistralApiKey);
      const generated = await mistralService.generateCampaign(
        customer,
        settings.mistralModel,
        settings.campaignTone
      );

      const expectedMetrics = {
        openRate: 28 + Math.random() * 10,
        clickRate: 8 + Math.random() * 5,
        conversionRate: 3 + Math.random() * 3,
        projectedRevenue: customer.totalSpent * (0.15 + Math.random() * 0.1),
      };

      setCampaign({
        ...generated,
        expectedMetrics,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate campaign');
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = () => {
    if (!campaign || !customer) return;

    const updatedCampaign: GeneratedCampaign = {
      subject: editableSubject,
      preheader: editablePreheader,
      body: editableBody,
      cta: editableCta,
      expectedMetrics: campaign.expectedMetrics,
    };

    onSendCampaign(updatedCampaign, customer);
    onClose();
  };

  if (!customer) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Campaign Generator" size="xl">
      {generating ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative">
            <Sparkles className="w-16 h-16 text-pink-400 animate-pulse" />
            <div className="absolute inset-0 bg-pink-400/20 rounded-full blur-xl animate-pulse" />
          </div>
          <p className="text-white text-lg font-medium mt-6">Generating personalized campaign...</p>
          <p className="text-white/60 text-sm mt-2">Powered by Mistral AI</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200 mb-6">
            <p>{error}</p>
          </div>
          <div className="flex gap-4 justify-center">
            <Button onClick={generateCampaign} variant="primary">
              Try Again
            </Button>
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        </div>
      ) : campaign ? (
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Campaign for {customer.name}</h3>
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full border border-purple-500/30">
                <Sparkles className="w-4 h-4 text-pink-400" />
                <span className="text-sm text-white/80">Powered by Mistral AI</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={editableSubject}
                  onChange={e => setEditableSubject(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  maxLength={60}
                />
                <p className="text-white/50 text-xs mt-1">
                  {editableSubject.length}/60 characters
                </p>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Preview Text
                </label>
                <input
                  type="text"
                  value={editablePreheader}
                  onChange={e => setEditablePreheader(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  maxLength={100}
                />
                <p className="text-white/50 text-xs mt-1">
                  {editablePreheader.length}/100 characters
                </p>
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Email Body
                </label>
                <textarea
                  value={editableBody}
                  onChange={e => setEditableBody(e.target.value)}
                  rows={10}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-white/80 text-sm font-medium mb-2">
                  Call-to-Action
                </label>
                <input
                  type="text"
                  value={editableCta}
                  onChange={e => setEditableCta(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-bold text-white mb-4">Expected Performance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="p-3 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-lg mb-2 mx-auto w-fit">
                  <MailIcon className="w-6 h-6 text-blue-300" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {campaign.expectedMetrics.openRate.toFixed(1)}%
                </p>
                <p className="text-white/60 text-sm">Open Rate</p>
              </div>
              <div className="text-center">
                <div className="p-3 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-lg mb-2 mx-auto w-fit">
                  <MousePointerClick className="w-6 h-6 text-purple-300" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {campaign.expectedMetrics.clickRate.toFixed(1)}%
                </p>
                <p className="text-white/60 text-sm">Click Rate</p>
              </div>
              <div className="text-center">
                <div className="p-3 bg-gradient-to-br from-green-500/30 to-emerald-500/30 rounded-lg mb-2 mx-auto w-fit">
                  <TrendingUp className="w-6 h-6 text-green-300" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {campaign.expectedMetrics.conversionRate.toFixed(1)}%
                </p>
                <p className="text-white/60 text-sm">Conversion</p>
              </div>
              <div className="text-center">
                <div className="p-3 bg-gradient-to-br from-yellow-500/30 to-orange-500/30 rounded-lg mb-2 mx-auto w-fit">
                  <DollarSign className="w-6 h-6 text-yellow-300" />
                </div>
                <p className="text-2xl font-bold text-white">
                  ${campaign.expectedMetrics.projectedRevenue.toFixed(0)}
                </p>
                <p className="text-white/60 text-sm">Projected Revenue</p>
              </div>
            </div>
          </Card>

          <div className="flex gap-4">
            <Button onClick={handleSend} className="flex-1" size="lg">
              <Send className="w-5 h-5 mr-2" />
              Send via Klaviyo
            </Button>
            <Button onClick={onClose} variant="secondary" size="lg">
              <X className="w-5 h-5 mr-2" />
              Discard
            </Button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
