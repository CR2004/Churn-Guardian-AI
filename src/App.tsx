import { useState, useEffect } from 'react';
import { Sparkles, LogOut } from 'lucide-react';
import { ApiConnectionScreen } from './components/ApiConnectionScreen';
import { Dashboard } from './components/Dashboard';
import { AtRiskCustomers } from './components/AtRiskCustomers';
import { CampaignGenerator } from './components/CampaignGenerator';
import { SettingsTab } from './components/SettingsTab';
import { Tabs } from './components/Tabs';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Button } from './components/Button';
import { KlaviyoService } from './services/klaviyo';
import { calculateChurnRisk } from './utils/churnCalculator';
import type { Customer, Settings, GeneratedCampaign, KlaviyoProfile, KlaviyoEvent, KlaviyoMetric } from './types';

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [klaviyoApiKey, setKlaviyoApiKey] = useState('');
  const [mistralApiKey, setMistralApiKey] = useState('');
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCampaignGenerator, setShowCampaignGenerator] = useState(false);
  const [settings, setSettings] = useState<Settings>({
    churnThresholds: {
      daysSinceLastPurchase: 90,
      minEngagementRate: 20,
      minPurchaseFrequency: 60,
    },
    mistralModel: 'mistral-small-latest',
    campaignTone: 'Friendly',
  });

  const handleConnect = async (klaviyoKey: string, mistralKey: string) => {
    setKlaviyoApiKey(klaviyoKey);
    setMistralApiKey(mistralKey);
    setIsConnected(true);
    setLoading(true);

    try {
      await fetchCustomerData(klaviyoKey);
    } catch (error) {
      console.error('Failed to fetch customer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerData = async (apiKey: string) => {
    const klaviyoService = new KlaviyoService(apiKey);

    const profiles: KlaviyoProfile[] = await klaviyoService.getProfiles(50);
    const metrics: KlaviyoMetric[] = await klaviyoService.getMetrics();

    const metricMap = new Map<string, string>();
    metrics.forEach(metric => {
      metricMap.set(metric.id, metric.attributes.name);
    });

    const customersWithRisk: Customer[] = [];

    for (const profile of profiles) {
      const events: KlaviyoEvent[] = await klaviyoService.getEventsForProfile(profile.id);
      const customer = calculateChurnRisk(profile, events, metricMap, settings);
      customersWithRisk.push(customer);
    }

    setCustomers(customersWithRisk);
  };

  const handleGenerateCampaign = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowCampaignGenerator(true);
  };

  const handleSendCampaign = async (campaign: GeneratedCampaign, customer: Customer) => {
    alert(`Campaign "${campaign.subject}" will be sent to ${customer.email} via Klaviyo!`);
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setKlaviyoApiKey('');
    setMistralApiKey('');
    setCustomers([]);
    setActiveTab('Dashboard');
  };

  if (!isConnected) {
    return <ApiConnectionScreen onConnect={handleConnect} />;
  }

  if (loading) {
    return <LoadingSpinner message="Analyzing customer data..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900">
      <header className="border-b border-white/10 backdrop-blur-lg bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-pink-400" />
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Churn Guardian AI
                </h1>
                <p className="text-white/60 text-sm">Powered by Mistral AI</p>
              </div>
            </div>
            <Button onClick={handleDisconnect} variant="secondary" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          tabs={['Dashboard', 'At-Risk Customers', 'Settings']}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'Dashboard' && <Dashboard customers={customers} />}

        {activeTab === 'At-Risk Customers' && (
          <AtRiskCustomers
            customers={customers}
            onGenerateCampaign={handleGenerateCampaign}
          />
        )}

        {activeTab === 'Settings' && (
          <SettingsTab
            settings={settings}
            onUpdateSettings={setSettings}
            klaviyoApiKey={klaviyoApiKey}
            mistralApiKey={mistralApiKey}
            onUpdateApiKeys={(klaviyoKey, mistralKey) => {
              setKlaviyoApiKey(klaviyoKey);
              setMistralApiKey(mistralKey);
            }}
          />
        )}
      </main>

      <CampaignGenerator
        isOpen={showCampaignGenerator}
        onClose={() => {
          setShowCampaignGenerator(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        mistralApiKey={mistralApiKey}
        settings={settings}
        onSendCampaign={handleSendCampaign}
      />
    </div>
  );
}

export default App;
