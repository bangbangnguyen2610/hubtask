import { useState } from 'react';
import { Cloud, MessageSquare, Check, X, ExternalLink, RefreshCw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useLocalStorage } from '../hooks/useLocalStorage';

const integrationsList = [
  {
    id: 'lark',
    name: 'Lark / Feishu',
    description: 'Sync tasks from Lark Base and get notifications',
    icon: MessageSquare,
    color: 'bg-blue-500',
    fields: [
      { key: 'appId', label: 'App ID', type: 'text' },
      { key: 'appSecret', label: 'App Secret', type: 'password' },
    ],
  },
  {
    id: 'cloudflare',
    name: 'Cloudflare',
    description: 'Monitor Pages deployments and Workers',
    icon: Cloud,
    color: 'bg-orange-500',
    fields: [
      { key: 'apiToken', label: 'API Token', type: 'password' },
      { key: 'accountId', label: 'Account ID', type: 'text' },
    ],
  },
];

export function Integrations() {
  const [configs, setConfigs] = useLocalStorage('integrations', {});
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({});
  const [testStatus, setTestStatus] = useState({});

  const handleEdit = (integration) => {
    setEditing(integration.id);
    setFormData(configs[integration.id] || {});
  };

  const handleSave = (integrationId) => {
    setConfigs({ ...configs, [integrationId]: formData });
    setEditing(null);
    setFormData({});
  };

  const handleCancel = () => {
    setEditing(null);
    setFormData({});
  };

  const handleDisconnect = (integrationId) => {
    const newConfigs = { ...configs };
    delete newConfigs[integrationId];
    setConfigs(newConfigs);
    setTestStatus({ ...testStatus, [integrationId]: null });
  };

  const handleTest = async (integrationId) => {
    setTestStatus({ ...testStatus, [integrationId]: 'testing' });

    // Simulate API test
    setTimeout(() => {
      const hasConfig = configs[integrationId] && Object.keys(configs[integrationId]).length > 0;
      setTestStatus({
        ...testStatus,
        [integrationId]: hasConfig ? 'success' : 'error',
      });
    }, 1500);
  };

  const isConnected = (integrationId) => {
    return configs[integrationId] && Object.keys(configs[integrationId]).length > 0;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Integrations</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Connect your favorite tools</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {integrationsList.map((integration) => (
          <Card key={integration.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${integration.color}`}>
                    <integration.icon size={24} className="text-white" />
                  </div>
                  <div>
                    <CardTitle>{integration.name}</CardTitle>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {integration.description}
                    </p>
                  </div>
                </div>
                {isConnected(integration.id) && (
                  <span className="flex items-center gap-1 text-sm text-green-500">
                    <Check size={16} />
                    Connected
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editing === integration.id ? (
                <div className="space-y-4">
                  {integration.fields.map((field) => (
                    <Input
                      key={field.key}
                      label={field.label}
                      type={field.type}
                      value={formData[field.key] || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.key]: e.target.value })
                      }
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  ))}
                  <div className="flex gap-2">
                    <Button onClick={() => handleSave(integration.id)}>
                      Save
                    </Button>
                    <Button variant="secondary" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {isConnected(integration.id) ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTest(integration.id)}
                        disabled={testStatus[integration.id] === 'testing'}
                      >
                        {testStatus[integration.id] === 'testing' ? (
                          <RefreshCw size={16} className="mr-2 animate-spin" />
                        ) : testStatus[integration.id] === 'success' ? (
                          <Check size={16} className="mr-2 text-green-500" />
                        ) : testStatus[integration.id] === 'error' ? (
                          <X size={16} className="mr-2 text-red-500" />
                        ) : null}
                        Test Connection
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(integration)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDisconnect(integration.id)}
                      >
                        Disconnect
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => handleEdit(integration)}>
                      Connect
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Documentation Links */}
      <Card>
        <CardHeader>
          <CardTitle>Documentation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <a
              href="https://open.larksuite.com/document"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ExternalLink size={18} className="text-gray-400" />
              <span className="text-gray-900 dark:text-white">Lark API Documentation</span>
            </a>
            <a
              href="https://developers.cloudflare.com/api"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ExternalLink size={18} className="text-gray-400" />
              <span className="text-gray-900 dark:text-white">Cloudflare API Documentation</span>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
