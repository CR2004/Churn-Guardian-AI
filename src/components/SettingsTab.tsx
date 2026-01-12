import { Key, Sliders, MessageSquare, Save } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import type { Settings } from '../types';

interface SettingsTabProps {
  settings: Settings;
  onUpdateSettings: (settings: Settings) => void;
  klaviyoApiKey: string;
  mistralApiKey: string;
  onUpdateApiKeys: (klaviyoKey: string, mistralKey: string) => void;
}

export function SettingsTab({
  settings,
  onUpdateSettings,
  klaviyoApiKey,
  mistralApiKey,
  onUpdateApiKeys,
}: SettingsTabProps) {
  const handleSave = () => {
    alert('Settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-lg">
            <Key className="w-5 h-5 text-purple-300" />
          </div>
          <h3 className="text-xl font-bold text-white">API Keys</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Klaviyo API Key
            </label>
            <input
              type="password"
              value={klaviyoApiKey}
              onChange={e => onUpdateApiKeys(e.target.value, mistralApiKey)}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
          </div>

          <div>
            <label className="block text-white/80 text-sm font-medium mb-2">
              Mistral AI API Key
            </label>
            <input
              type="password"
              value={mistralApiKey}
              onChange={e => onUpdateApiKeys(klaviyoApiKey, e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <p className="text-white/50 text-sm mt-1">
              Free API key available at{' '}
              <a
                href="https://console.mistral.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-400 hover:text-pink-300"
              >
                https://console.mistral.ai
              </a>
            </p>
          </div>
        </div>
      </Card>

      <Button onClick={handleSave} size="lg" className="w-full">
        <Save className="w-5 h-5 mr-2" />
        Save Settings
      </Button>
    </div>
  );
}
