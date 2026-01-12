import { useState } from 'react';
import { Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { KlaviyoService } from '../services/klaviyo';
import { MistralService } from '../services/mistral';

interface ApiConnectionScreenProps {
  onConnect: (klaviyoKey: string, mistralKey: string) => void;
}

export function ApiConnectionScreen({ onConnect }: ApiConnectionScreenProps) {
  const [klaviyoKey, setKlaviyoKey] = useState(import.meta.env.VITE_KLAVIYO_API_KEY || '');
  const [mistralKey, setMistralKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationStatus, setValidationStatus] = useState<{
    klaviyo?: 'success' | 'error';
    mistral?: 'success' | 'error';
  }>({});

  const handleConnect = async () => {
    setLoading(true);
    setError('');
    setValidationStatus({});

    try {
      const klaviyoService = new KlaviyoService(klaviyoKey);
      const mistralService = new MistralService(mistralKey);

      const [klaviyoValid, mistralValid] = await Promise.all([
        klaviyoService.validateApiKey(),
        mistralService.validateApiKey(),
      ]);

      setValidationStatus({
        klaviyo: klaviyoValid ? 'success' : 'error',
        mistral: mistralValid ? 'success' : 'error',
      });

      if (klaviyoValid && mistralValid) {
        onConnect(klaviyoKey, mistralKey);
      } else {
        const errors = [];
        if (!klaviyoValid) errors.push('Klaviyo API key is invalid');
        if (!mistralValid) errors.push('Mistral API key is invalid');
        setError(errors.join('. '));
      }
    } catch (err) {
      setError('Failed to validate API keys. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-purple-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-10 h-10 text-pink-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Churn Guardian AI
            </h1>
          </div>
          <p className="text-white/70 text-lg">
            Predict customer churn and create AI-powered win-back campaigns
          </p>
        </div>

        <Card>
          <h2 className="text-2xl font-bold text-white mb-6">Connect Your APIs</h2>

          <div className="space-y-6">
            {/* Klaviyo API key is loaded from .env (VITE_KLAVIYO_API_KEY) and not editable in the UI */}
            <div>
              <p className="text-white/70 text-sm">
                Klaviyo API key is loaded from the environment.
              </p>
            </div>

            <div>
              <label className="block text-white/90 font-medium mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Mistral AI API Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={mistralKey}
                  onChange={e => setMistralKey(e.target.value)}
                  placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {validationStatus.mistral && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {validationStatus.mistral === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                )}
              </div>
              <p className="text-white/50 text-sm mt-1">
                Get free API key at{' '}
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

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-500/20 border border-red-500/30 rounded-lg text-red-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            <Button
              onClick={handleConnect}
              loading={loading}
              disabled={!klaviyoKey || !mistralKey}
              className="w-full"
              size="lg"
            >
              Connect & Start Analyzing
            </Button>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-white/50 text-sm">
            Powered by Mistral AI • Built for Klaviyo Winter Challenge
          </p>
        </div>
      </div>
    </div>
  );
}
