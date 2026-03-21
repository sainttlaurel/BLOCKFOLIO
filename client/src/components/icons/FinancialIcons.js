/**
 * Professional Financial Iconography System
 * 
 * Implements comprehensive icon system for financial applications following
 * fintech design standards with consistent visual hierarchy and accessibility.
 * 
 * Requirements: 7.4 - Professional iconography and visual elements consistent 
 * with financial applications
 * 
 * Features:
 * - Comprehensive trading and financial icons
 * - Consistent sizing and styling
 * - Accessibility support with ARIA labels
 * - Professional fintech design standards
 * - Responsive scaling across breakpoints
 * - Integration with existing color palette
 */

import {
  // Core Trading Icons
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Activity,
  
  // Portfolio Management
  Wallet,
  CreditCard,
  Coins,
  Target,
  Shield,
  Award,
  
  // Market Data
  LineChart,
  AreaChart,
  CandlestickChart,
  Globe,
  Zap,
  
  // Trading Actions
  ShoppingCart,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  
  // Navigation & UI
  Menu,
  Search,
  Filter,
  Settings,
  Bell,
  User,
  LogOut,
  Home,
  History,
  
  // Data & Analytics
  Calculator,
  Percent,
  Hash,
  Database,
  Download,
  Upload,
  
  // Status & Indicators
  Wifi,
  WifiOff,
  Signal,
  Power,
  
  // Responsive & Layout
  Monitor,
  Tablet,
  Smartphone,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  
  // Security & Verification
  Lock,
  Unlock,
  Key,
  Fingerprint,
  Mail,
  
  // Time & Calendar
  Calendar,
  Timer,
  
  // File & Document
  FileText,
  
  // Additional Financial Icons
  Minus as TrendingFlat,
  Banknote,
  Building2,
  Landmark,
  Receipt,
  Scale,
  Briefcase,
  
  // Miscellaneous
  Check,
  X,
  Plus,
  Minus,
  Info,
  HelpCircle,
  Star,
  Bookmark
} from 'lucide-react';

/**
 * Icon size configurations for consistent scaling
 */
export const ICON_SIZES = {
  xs: 'h-3 w-3',      // 12px - Small indicators
  sm: 'h-4 w-4',      // 16px - Table icons, buttons
  md: 'h-5 w-5',      // 20px - Default size
  lg: 'h-6 w-6',      // 24px - Section headers
  xl: 'h-8 w-8',      // 32px - Large actions
  '2xl': 'h-10 w-10', // 40px - Hero elements
  '3xl': 'h-12 w-12'  // 48px - Major features
};

/**
 * Icon color themes for different contexts
 */
export const ICON_THEMES = {
  default: 'text-neutral-600',
  primary: 'text-brand-primary-600',
  secondary: 'text-neutral-500',
  success: 'text-market-green-600',
  danger: 'text-market-red-600',
  warning: 'text-warning-600',
  info: 'text-info-600',
  muted: 'text-neutral-400',
  inverse: 'text-neutral-white'
};

/**
 * Base Icon Component with consistent styling and accessibility
 */
export const BaseIcon = ({ 
  icon: IconComponent, 
  size = 'md', 
  theme = 'default', 
  className = '', 
  ariaLabel,
  ...props 
}) => {
  const sizeClass = ICON_SIZES[size] || ICON_SIZES.md;
  const themeClass = ICON_THEMES[theme] || ICON_THEMES.default;
  
  return (
    <IconComponent
      className={`financial-icon ${sizeClass} ${themeClass} ${className}`}
      aria-label={ariaLabel}
      role={ariaLabel ? 'img' : undefined}
      {...props}
    />
  );
};

/**
 * Trading & Market Icons
 */
export const TradingIcons = {
  // Price Movement
  PriceUp: (props) => <BaseIcon icon={TrendingUp} theme="success" ariaLabel="Price increase" {...props} />,
  PriceDown: (props) => <BaseIcon icon={TrendingDown} theme="danger" ariaLabel="Price decrease" {...props} />,
  PriceFlat: (props) => <BaseIcon icon={TrendingFlat} theme="muted" ariaLabel="Price unchanged" {...props} />,
  
  // Trading Actions
  Buy: (props) => <BaseIcon icon={ArrowUpCircle} theme="success" ariaLabel="Buy order" {...props} />,
  Sell: (props) => <BaseIcon icon={ArrowDownCircle} theme="danger" ariaLabel="Sell order" {...props} />,
  Trade: (props) => <BaseIcon icon={ShoppingCart} theme="primary" ariaLabel="Execute trade" {...props} />,
  
  // Market Data
  Chart: (props) => <BaseIcon icon={BarChart3} ariaLabel="Price chart" {...props} />,
  LineChart: (props) => <BaseIcon icon={LineChart} ariaLabel="Line chart" {...props} />,
  AreaChart: (props) => <BaseIcon icon={AreaChart} ariaLabel="Area chart" {...props} />,
  Candlestick: (props) => <BaseIcon icon={CandlestickChart} ariaLabel="Candlestick chart" {...props} />,
  
  // Volume & Activity
  Volume: (props) => <BaseIcon icon={BarChart3} ariaLabel="Trading volume" {...props} />,
  Activity: (props) => <BaseIcon icon={Activity} ariaLabel="Market activity" {...props} />,
  Pulse: (props) => <BaseIcon icon={Zap} theme="warning" ariaLabel="Market pulse" {...props} />,
  
  // Market Status
  MarketOpen: (props) => <BaseIcon icon={Globe} theme="success" ariaLabel="Market open" {...props} />,
  MarketClosed: (props) => <BaseIcon icon={Globe} theme="muted" ariaLabel="Market closed" {...props} />,
  LiveData: (props) => <BaseIcon icon={Signal} theme="success" ariaLabel="Live data" {...props} />,
  
  // Financial Institutions
  Bank: (props) => <BaseIcon icon={Building2} theme="primary" ariaLabel="Bank" {...props} />,
  Institution: (props) => <BaseIcon icon={Landmark} theme="primary" ariaLabel="Financial institution" {...props} />,
  
  // Currency & Payments
  Cash: (props) => <BaseIcon icon={Banknote} theme="success" ariaLabel="Cash" {...props} />,
  Receipt: (props) => <BaseIcon icon={Receipt} ariaLabel="Transaction receipt" {...props} />,
  
  // Professional Services
  Legal: (props) => <BaseIcon icon={Scale} theme="primary" ariaLabel="Legal compliance" {...props} />,
  Business: (props) => <BaseIcon icon={Briefcase} theme="primary" ariaLabel="Business" {...props} />
};

/**
 * Portfolio & Wallet Icons
 */
export const PortfolioIcons = {
  // Portfolio Management
  Portfolio: (props) => <BaseIcon icon={PieChart} theme="primary" ariaLabel="Portfolio overview" {...props} />,
  Holdings: (props) => <BaseIcon icon={Wallet} ariaLabel="Portfolio holdings" {...props} />,
  Balance: (props) => <BaseIcon icon={DollarSign} theme="success" ariaLabel="Account balance" {...props} />,
  
  // Asset Types
  Cryptocurrency: (props) => <BaseIcon icon={Coins} theme="warning" ariaLabel="Cryptocurrency" {...props} />,
  Fiat: (props) => <BaseIcon icon={CreditCard} ariaLabel="Fiat currency" {...props} />,
  
  // Performance Metrics
  Performance: (props) => <BaseIcon icon={Target} theme="primary" ariaLabel="Performance metrics" {...props} />,
  Returns: (props) => <BaseIcon icon={TrendingUp} theme="success" ariaLabel="Investment returns" {...props} />,
  Allocation: (props) => <BaseIcon icon={PieChart} ariaLabel="Asset allocation" {...props} />,
  
  // Security & Protection
  Secure: (props) => <BaseIcon icon={Shield} theme="success" ariaLabel="Secure" {...props} />,
  Verified: (props) => <BaseIcon icon={Award} theme="success" ariaLabel="Verified" {...props} />,
  Protected: (props) => <BaseIcon icon={Lock} theme="primary" ariaLabel="Protected" {...props} />
};

/**
 * User Interface & Navigation Icons
 */
export const UIIcons = {
  // Navigation
  Menu: (props) => <BaseIcon icon={Menu} ariaLabel="Menu" {...props} />,
  Home: (props) => <BaseIcon icon={Home} ariaLabel="Home" {...props} />,
  Back: (props) => <BaseIcon icon={ChevronLeft} ariaLabel="Go back" {...props} />,
  Forward: (props) => <BaseIcon icon={ChevronRight} ariaLabel="Go forward" {...props} />,
  
  // Actions
  Search: (props) => <BaseIcon icon={Search} ariaLabel="Search" {...props} />,
  Filter: (props) => <BaseIcon icon={Filter} ariaLabel="Filter" {...props} />,
  Settings: (props) => <BaseIcon icon={Settings} ariaLabel="Settings" {...props} />,
  Refresh: (props) => <BaseIcon icon={RefreshCw} ariaLabel="Refresh" {...props} />,
  
  // User Account
  Profile: (props) => <BaseIcon icon={User} ariaLabel="User profile" {...props} />,
  Logout: (props) => <BaseIcon icon={LogOut} theme="danger" ariaLabel="Logout" {...props} />,
  
  // Notifications
  Notifications: (props) => <BaseIcon icon={Bell} ariaLabel="Notifications" {...props} />,
  Alert: (props) => <BaseIcon icon={AlertTriangle} theme="warning" ariaLabel="Alert" {...props} />,
  
  // Layout Controls
  Expand: (props) => <BaseIcon icon={Maximize2} ariaLabel="Expand" {...props} />,
  Collapse: (props) => <BaseIcon icon={Minimize2} ariaLabel="Collapse" {...props} />,
  ChevronUp: (props) => <BaseIcon icon={ChevronUp} ariaLabel="Expand up" {...props} />,
  ChevronDown: (props) => <BaseIcon icon={ChevronDown} ariaLabel="Collapse down" {...props} />,
  
  // Basic Actions
  Add: (props) => <BaseIcon icon={Plus} theme="success" ariaLabel="Add" {...props} />,
  Remove: (props) => <BaseIcon icon={Minus} theme="danger" ariaLabel="Remove" {...props} />,
  Info: (props) => <BaseIcon icon={Info} theme="info" ariaLabel="Information" {...props} />,
  Help: (props) => <BaseIcon icon={HelpCircle} theme="info" ariaLabel="Help" {...props} />,
  
  // Favorites & Bookmarks
  Star: (props) => <BaseIcon icon={Star} theme="warning" ariaLabel="Favorite" {...props} />,
  Bookmark: (props) => <BaseIcon icon={Bookmark} theme="primary" ariaLabel="Bookmark" {...props} />
};

/**
 * Status & Feedback Icons
 */
export const StatusIcons = {
  // Order Status
  Pending: (props) => <BaseIcon icon={Clock} theme="warning" ariaLabel="Pending" {...props} />,
  Completed: (props) => <BaseIcon icon={CheckCircle} theme="success" ariaLabel="Completed" {...props} />,
  Failed: (props) => <BaseIcon icon={XCircle} theme="danger" ariaLabel="Failed" {...props} />,
  Cancelled: (props) => <BaseIcon icon={X} theme="muted" ariaLabel="Cancelled" {...props} />,
  
  // Connection Status
  Connected: (props) => <BaseIcon icon={Wifi} theme="success" ariaLabel="Connected" {...props} />,
  Disconnected: (props) => <BaseIcon icon={WifiOff} theme="danger" ariaLabel="Disconnected" {...props} />,
  Syncing: (props) => <BaseIcon icon={RefreshCw} theme="info" ariaLabel="Syncing" {...props} />,
  
  // Data Status
  Loading: (props) => <BaseIcon icon={RefreshCw} theme="info" ariaLabel="Loading" {...props} />,
  Error: (props) => <BaseIcon icon={AlertTriangle} theme="danger" ariaLabel="Error" {...props} />,
  Success: (props) => <BaseIcon icon={Check} theme="success" ariaLabel="Success" {...props} />,
  
  // System Status
  Online: (props) => <BaseIcon icon={Power} theme="success" ariaLabel="Online" {...props} />,
  Offline: (props) => <BaseIcon icon={Power} theme="muted" ariaLabel="Offline" {...props} />
};

/**
 * Data & Analytics Icons
 */
export const DataIcons = {
  // Calculations
  Calculator: (props) => <BaseIcon icon={Calculator} ariaLabel="Calculator" {...props} />,
  Percentage: (props) => <BaseIcon icon={Percent} ariaLabel="Percentage" {...props} />,
  Hash: (props) => <BaseIcon icon={Hash} ariaLabel="Hash" {...props} />,
  
  // Data Management
  Database: (props) => <BaseIcon icon={Database} ariaLabel="Database" {...props} />,
  Export: (props) => <BaseIcon icon={Download} ariaLabel="Export data" {...props} />,
  Import: (props) => <BaseIcon icon={Upload} ariaLabel="Import data" {...props} />,
  
  // History & Records
  History: (props) => <BaseIcon icon={History} ariaLabel="Transaction history" {...props} />,
  Calendar: (props) => <BaseIcon icon={Calendar} ariaLabel="Calendar" {...props} />,
  Timer: (props) => <BaseIcon icon={Timer} ariaLabel="Timer" {...props} />,
  
  // Documentation
  Document: (props) => <BaseIcon icon={FileText} ariaLabel="Document" {...props} />,
  Report: (props) => <BaseIcon icon={BarChart3} ariaLabel="Report" {...props} />
};

/**
 * Device & Responsive Icons
 */
export const DeviceIcons = {
  Desktop: (props) => <BaseIcon icon={Monitor} ariaLabel="Desktop view" {...props} />,
  Tablet: (props) => <BaseIcon icon={Tablet} ariaLabel="Tablet view" {...props} />,
  Mobile: (props) => <BaseIcon icon={Smartphone} ariaLabel="Mobile view" {...props} />
};

/**
 * Security & Authentication Icons
 */
export const SecurityIcons = {
  Lock: (props) => <BaseIcon icon={Lock} theme="primary" ariaLabel="Locked" {...props} />,
  Unlock: (props) => <BaseIcon icon={Unlock} theme="warning" ariaLabel="Unlocked" {...props} />,
  Key: (props) => <BaseIcon icon={Key} ariaLabel="Security key" {...props} />,
  Fingerprint: (props) => <BaseIcon icon={Fingerprint} theme="primary" ariaLabel="Biometric authentication" {...props} />,
  Email: (props) => <BaseIcon icon={Mail} ariaLabel="Email" {...props} />
};

/**
 * Utility function to get icon by name
 */
export const getIcon = (iconName, category = 'UI') => {
  const iconMaps = {
    Trading: TradingIcons,
    Portfolio: PortfolioIcons,
    UI: UIIcons,
    Status: StatusIcons,
    Data: DataIcons,
    Device: DeviceIcons,
    Security: SecurityIcons
  };
  
  const iconMap = iconMaps[category];
  return iconMap ? iconMap[iconName] : null;
};

/**
 * Icon showcase component for development and testing
 */
export const IconShowcase = () => {
  const iconCategories = [
    { name: 'Trading', icons: TradingIcons },
    { name: 'Portfolio', icons: PortfolioIcons },
    { name: 'UI', icons: UIIcons },
    { name: 'Status', icons: StatusIcons },
    { name: 'Data', icons: DataIcons },
    { name: 'Device', icons: DeviceIcons },
    { name: 'Security', icons: SecurityIcons }
  ];

  return (
    <div className="p-6 bg-surface-primary">
      <h2 className="text-2xl font-bold text-primary mb-6">Financial Iconography System</h2>
      
      {iconCategories.map(({ name, icons }) => (
        <div key={name} className="mb-8">
          <h3 className="text-lg font-semibold text-secondary mb-4">{name} Icons</h3>
          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {Object.entries(icons).map(([iconName, IconComponent]) => (
              <div key={iconName} className="flex flex-col items-center p-3 border border-primary rounded-lg hover:bg-surface-secondary transition-colors">
                <IconComponent size="lg" />
                <span className="text-xs text-tertiary mt-2 text-center">{iconName}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-secondary mb-4">Size Variations</h3>
        <div className="flex items-center space-x-4">
          {Object.entries(ICON_SIZES).map(([sizeName, sizeClass]) => (
            <div key={sizeName} className="flex flex-col items-center">
              <TradingIcons.Chart size={sizeName} />
              <span className="text-xs text-tertiary mt-1">{sizeName}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-secondary mb-4">Theme Variations</h3>
        <div className="flex items-center space-x-4">
          {Object.entries(ICON_THEMES).map(([themeName, themeClass]) => (
            <div key={themeName} className="flex flex-col items-center">
              <TradingIcons.Chart theme={themeName} />
              <span className="text-xs text-tertiary mt-1">{themeName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Default export with all icon categories and utilities
 */
const FinancialIconsSystem = {
  TradingIcons,
  PortfolioIcons,
  UIIcons,
  StatusIcons,
  DataIcons,
  DeviceIcons,
  SecurityIcons,
  BaseIcon,
  getIcon,
  IconShowcase,
  ICON_SIZES,
  ICON_THEMES
};

export default FinancialIconsSystem;