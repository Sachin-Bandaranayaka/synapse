'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, CheckCircle, XCircle, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface MetaSettings {
  metaPixelId: string;
  metaConversionsApiEnabled: boolean;
  hasAccessToken: boolean;
}

export function MetaConversionsSettings() {
  const [settings, setSettings] = useState<MetaSettings>({
    metaPixelId: '',
    metaConversionsApiEnabled: false,
    hasAccessToken: false,
  });
  const [accessToken, setAccessToken] = useState('');
  const [showAccessToken, setShowAccessToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/tenant/meta-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch Meta settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch Meta settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const validateCredentials = async () => {
    if (!settings.metaPixelId || !accessToken) {
      setValidationStatus('invalid');
      return;
    }

    setValidating(true);
    try {
      const response = await fetch('/api/tenant/meta-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metaPixelId: settings.metaPixelId,
          metaAccessToken: accessToken,
          metaConversionsApiEnabled: false, // Just validate, don't enable yet
        }),
      });

      if (response.ok) {
        setValidationStatus('valid');
        toast({
          title: 'Success',
          description: 'Meta credentials are valid',
        });
      } else {
        setValidationStatus('invalid');
        const errorData = await response.json();
        toast({
          title: 'Validation Failed',
          description: errorData.error || 'Invalid credentials',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setValidationStatus('invalid');
      toast({
        title: 'Error',
        description: 'Failed to validate credentials',
        variant: 'destructive',
      });
    } finally {
      setValidating(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/tenant/meta-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metaPixelId: settings.metaPixelId,
          metaAccessToken: accessToken,
          metaConversionsApiEnabled: settings.metaConversionsApiEnabled,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings({
          metaPixelId: data.metaPixelId,
          metaConversionsApiEnabled: data.metaConversionsApiEnabled,
          hasAccessToken: data.hasAccessToken,
        });
        setAccessToken(''); // Clear the input after saving
        toast({
          title: 'Success',
          description: 'Meta Conversions API settings saved successfully',
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Error',
          description: errorData.error || 'Failed to save settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const clearSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/tenant/meta-settings', {
        method: 'DELETE',
      });

      if (response.ok) {
        setSettings({
          metaPixelId: '',
          metaConversionsApiEnabled: false,
          hasAccessToken: false,
        });
        setAccessToken('');
        setValidationStatus('idle');
        toast({
          title: 'Success',
          description: 'Meta Conversions API settings cleared',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to clear settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Meta Conversions API</CardTitle>
          <CardDescription>
            Configure Meta Conversions API to track leads and purchases
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meta Conversions API</CardTitle>
        <CardDescription>
          Configure Meta Conversions API to track leads and purchases from your Facebook/Instagram ads
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            This integration will automatically send lead and purchase events to your Meta Pixel,
            helping you optimize your Facebook and Instagram ad campaigns for better performance and lower costs.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pixelId">Meta Pixel ID</Label>
            <Input
              id="pixelId"
              placeholder="Enter your Meta Pixel ID"
              value={settings.metaPixelId}
              onChange={(e) => {
                setSettings({ ...settings, metaPixelId: e.target.value });
                setValidationStatus('idle');
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accessToken">Meta Access Token</Label>
            <div className="relative">
              <Input
                id="accessToken"
                type={showAccessToken ? 'text' : 'password'}
                placeholder={settings.hasAccessToken ? 'Token is configured' : 'Enter your Meta Access Token'}
                value={accessToken}
                onChange={(e) => {
                  setAccessToken(e.target.value);
                  setValidationStatus('idle');
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowAccessToken(!showAccessToken)}
              >
                {showAccessToken ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {settings.hasAccessToken && !accessToken && (
              <p className="text-sm text-muted-foreground">
                Access token is already configured. Enter a new token to update it.
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={validateCredentials}
              disabled={validating || !settings.metaPixelId || !accessToken}
              variant="outline"
              size="sm"
            >
              {validating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : validationStatus === 'valid' ? (
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
              ) : validationStatus === 'invalid' ? (
                <XCircle className="h-4 w-4 mr-2 text-red-600" />
              ) : null}
              Validate Credentials
            </Button>
            {validationStatus === 'valid' && (
              <span className="text-sm text-green-600">Credentials are valid</span>
            )}
            {validationStatus === 'invalid' && (
              <span className="text-sm text-red-600">Invalid credentials</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={settings.metaConversionsApiEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, metaConversionsApiEnabled: checked })
              }
              disabled={!settings.metaPixelId || (!settings.hasAccessToken && !accessToken)}
            />
            <Label htmlFor="enabled">Enable Meta Conversions API</Label>
          </div>

          {settings.metaConversionsApiEnabled && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Meta Conversions API is enabled. Lead and purchase events will be automatically sent to your Meta Pixel.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex space-x-2">
          <Button
            onClick={saveSettings}
            disabled={saving || !settings.metaPixelId || (!settings.hasAccessToken && !accessToken)}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Settings
          </Button>
          {(settings.metaPixelId || settings.hasAccessToken) && (
            <Button
              onClick={clearSettings}
              disabled={saving}
              variant="outline"
            >
              Clear Settings
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground space-y-2">
          <p><strong>How to get your credentials:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to your Facebook Business Manager</li>
            <li>Navigate to Events Manager and find your Pixel ID</li>
            <li>Generate an Access Token with 'ads_management' permissions</li>
            <li>Enter both credentials above and validate them</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}