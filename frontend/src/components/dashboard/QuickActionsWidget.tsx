import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  Plus,
  BarcodeIcon,
  Search,
  FileText,
  Users,
  TruckIcon,
  ClipboardList,
  AlertCircle,
  Download,
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  path: string;
  hotkey?: string;
}

const QuickActionsWidget: React.FC = () => {
  const navigate = useNavigate();

  const quickActions: QuickAction[] = [
    {
      id: 'add-part',
      title: 'Add New Part',
      description: 'Quick add inventory item',
      icon: <Plus className="w-5 h-5" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      path: '/parts/new',
      hotkey: 'Alt+N',
    },
    {
      id: 'scan-barcode',
      title: 'Scan Barcode',
      description: 'Scan part or location',
      icon: <BarcodeIcon className="w-5 h-5" />,
      color: 'bg-green-500 hover:bg-green-600',
      path: '/scan',
      hotkey: 'Alt+S',
    },
    {
      id: 'quick-search',
      title: 'Quick Search',
      description: 'Find parts instantly',
      icon: <Search className="w-5 h-5" />,
      color: 'bg-purple-500 hover:bg-purple-600',
      path: '/search',
      hotkey: 'Alt+F',
    },
    {
      id: 'csv-import',
      title: 'Bulk Import',
      description: 'Import from CSV',
      icon: <FileText className="w-5 h-5" />,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      path: '/csv',
      hotkey: 'Alt+I',
    },
    {
      id: 'vehicle-lookup',
      title: 'Vehicle Lookup',
      description: 'Find parts by vehicle',
      icon: <TruckIcon className="w-5 h-5" />,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      path: '/vehicles',
      hotkey: 'Alt+V',
    },
    {
      id: 'requests',
      title: 'Part Requests',
      description: 'View customer requests',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-pink-500 hover:bg-pink-600',
      path: '/requests',
      hotkey: 'Alt+R',
    },
    {
      id: 'audit',
      title: 'Start Audit',
      description: 'Begin inventory audit',
      icon: <ClipboardList className="w-5 h-5" />,
      color: 'bg-teal-500 hover:bg-teal-600',
      path: '/audit',
      hotkey: 'Alt+A',
    },
    {
      id: 'low-stock',
      title: 'Low Stock Alert',
      description: 'View critical items',
      icon: <AlertCircle className="w-5 h-5" />,
      color: 'bg-red-500 hover:bg-red-600',
      path: '/parts?filter=low-stock',
      hotkey: 'Alt+L',
    },
    {
      id: 'export',
      title: 'Export Data',
      description: 'Download inventory',
      icon: <Download className="w-5 h-5" />,
      color: 'bg-gray-500 hover:bg-gray-600',
      path: '/csv/export',
      hotkey: 'Alt+E',
    },
  ];

  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.altKey) {
        const action = quickActions.find(a =>
          a.hotkey && a.hotkey.toLowerCase().includes(event.key.toLowerCase())
        );
        if (action) {
          event.preventDefault();
          navigate(action.path);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);

  const handleActionClick = (action: QuickAction) => {
    // Track action usage for analytics
    console.log(`Quick action used: ${action.id}`);
    navigate(action.path);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        <span className="text-xs text-gray-500">Use Alt + key for shortcuts</span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            className={`${action.color} text-white rounded-lg p-3 transition-all duration-200 transform hover:scale-105 hover:shadow-lg group relative`}
            title={`${action.description}${action.hotkey ? ` (${action.hotkey})` : ''}`}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="p-2 bg-white/20 rounded-lg">
                {action.icon}
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">{action.title}</p>
                <p className="text-xs opacity-90 mt-1 hidden group-hover:block">
                  {action.description}
                </p>
              </div>
            </div>

            {action.hotkey && (
              <div className="absolute top-1 right-1 bg-black/20 px-1.5 py-0.5 rounded text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                {action.hotkey}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Most Used Actions */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Recent Actions</h4>
        <div className="flex flex-wrap gap-2">
          {quickActions.slice(0, 5).map((action) => (
            <button
              key={`recent-${action.id}`}
              onClick={() => handleActionClick(action)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-medium text-gray-700 transition-colors flex items-center gap-1.5"
            >
              {React.cloneElement(action.icon as React.ReactElement, { className: 'w-3 h-3' })}
              {action.title}
            </button>
          ))}
        </div>
      </div>

      {/* Tips Section */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-blue-900">Pro Tip</p>
            <p className="text-xs text-blue-700 mt-1">
              Use keyboard shortcuts to navigate faster. Press Alt + the highlighted key to quickly access any action.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsWidget;