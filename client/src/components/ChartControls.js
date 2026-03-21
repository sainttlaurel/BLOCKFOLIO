import React, { useState } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  Move, 
  Maximize2, 
  RotateCcw,
  Settings,
  Eye,
  EyeOff,
  BarChart3,
  TrendingUp
} from 'lucide-react';

const ChartControls = ({
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onTogglePan,
  onToggleVolume,
  onToggleFullscreen,
  showVolume = true,
  isPanning = false,
  isZoomed = false,
  isFullscreen = false,
  className = ''
}) => {
  const [showTooltip, setShowTooltip] = useState(null);

  const controls = [
    {
      id: 'zoomIn',
      icon: ZoomIn,
      label: 'Zoom In',
      onClick: onZoomIn,
      disabled: false
    },
    {
      id: 'zoomOut',
      icon: ZoomOut,
      label: 'Zoom Out',
      onClick: onZoomOut,
      disabled: false
    },
    {
      id: 'pan',
      icon: Move,
      label: isPanning ? 'Disable Pan' : 'Enable Pan',
      onClick: onTogglePan,
      active: isPanning,
      disabled: false
    },
    {
      id: 'reset',
      icon: RotateCcw,
      label: 'Reset Zoom',
      onClick: onResetZoom,
      disabled: !isZoomed,
      show: isZoomed
    },
    {
      id: 'volume',
      icon: showVolume ? Eye : EyeOff,
      label: showVolume ? 'Hide Volume' : 'Show Volume',
      onClick: onToggleVolume,
      active: showVolume,
      disabled: false
    },
    {
      id: 'fullscreen',
      icon: Maximize2,
      label: isFullscreen ? 'Exit Fullscreen' : 'Fullscreen',
      onClick: onToggleFullscreen,
      active: isFullscreen,
      disabled: false
    }
  ];

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {controls.map((control) => {
        if (control.show === false) return null;
        
        const Icon = control.icon;
        
        return (
          <div key={control.id} className="relative">
            <button
              onClick={control.onClick}
              disabled={control.disabled}
              onMouseEnter={() => setShowTooltip(control.id)}
              onMouseLeave={() => setShowTooltip(null)}
              className={`
                p-2 rounded-lg transition-all duration-200 
                ${control.disabled 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : control.active
                    ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
                ${control.disabled ? '' : 'hover:shadow-sm'}
              `}
              title={control.label}
            >
              <Icon size={16} />
            </button>
            
            {/* Tooltip */}
            {showTooltip === control.id && !control.disabled && (
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 z-50">
                <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-lg">
                  {control.label}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ChartControls;