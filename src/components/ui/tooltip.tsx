'use client';

import { useState, ReactNode } from 'react';
import { HelpCircle, Info } from 'lucide-react';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
  trigger?: 'hover' | 'click';
  maxWidth?: string;
}

export function Tooltip({ 
  content, 
  children, 
  position = 'top', 
  className = '', 
  trigger = 'hover',
  maxWidth = 'max-w-xs'
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return {
          tooltip: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
          arrow: 'top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900'
        };
      case 'bottom':
        return {
          tooltip: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
          arrow: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900'
        };
      case 'left':
        return {
          tooltip: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
          arrow: 'left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900'
        };
      case 'right':
        return {
          tooltip: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
          arrow: 'right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900'
        };
      default:
        return {
          tooltip: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
          arrow: 'top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900'
        };
    }
  };

  const positionClasses = getPositionClasses();

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}
      {isVisible && (
        <div className={`absolute ${positionClasses.tooltip} ${maxWidth} px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-50 pointer-events-none`}>
          {content}
          <div className={`absolute ${positionClasses.arrow} w-0 h-0`}></div>
        </div>
      )}
    </div>
  );
}

interface HelpTooltipProps {
  content: ReactNode;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: string;
}

export function HelpTooltip({ content, className = '', position = 'top', maxWidth = 'max-w-xs' }: HelpTooltipProps) {
  return (
    <Tooltip content={content} position={position} className={className} maxWidth={maxWidth}>
      <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-300 cursor-help" />
    </Tooltip>
  );
}

interface InfoTooltipProps {
  content: ReactNode;
  className?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  maxWidth?: string;
}

export function InfoTooltip({ content, className = '', position = 'top', maxWidth = 'max-w-xs' }: InfoTooltipProps) {
  return (
    <Tooltip content={content} position={position} className={className} maxWidth={maxWidth}>
      <Info className="h-4 w-4 text-blue-400 hover:text-blue-300 cursor-help" />
    </Tooltip>
  );
}

// Cost-specific tooltips with predefined content
export function CostPriceTooltip({ className = '' }: { className?: string }) {
  return (
    <HelpTooltip
      content={
        <div className="space-y-2">
          <p className="font-medium">Cost Price</p>
          <p>The actual cost you paid for this product, including:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Purchase price from supplier</li>
            <li>Shipping costs</li>
            <li>Import duties (if applicable)</li>
          </ul>
          <p className="text-xs text-gray-300">Used to calculate gross profit margin.</p>
        </div>
      }
      className={className}
      maxWidth="max-w-sm"
    />
  );
}

export function PackagingCostTooltip({ className = '' }: { className?: string }) {
  return (
    <HelpTooltip
      content={
        <div className="space-y-2">
          <p className="font-medium">Packaging Cost</p>
          <p>Cost of materials and labor for packaging this order:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Boxes, bags, or containers</li>
            <li>Protective materials (bubble wrap, etc.)</li>
            <li>Labels and stickers</li>
            <li>Labor time for packaging</li>
          </ul>
          <p className="text-xs text-gray-300">Leave empty to use tenant default.</p>
        </div>
      }
      className={className}
      maxWidth="max-w-sm"
    />
  );
}

export function PrintingCostTooltip({ className = '' }: { className?: string }) {
  return (
    <HelpTooltip
      content={
        <div className="space-y-2">
          <p className="font-medium">Printing Cost</p>
          <p>Cost of printing materials for this order:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Invoice printing</li>
            <li>Shipping labels</li>
            <li>Packing slips</li>
            <li>Marketing materials</li>
          </ul>
          <p className="text-xs text-gray-300">Leave empty to use tenant default.</p>
        </div>
      }
      className={className}
      maxWidth="max-w-sm"
    />
  );
}

export function LeadCostTooltip({ className = '' }: { className?: string }) {
  return (
    <HelpTooltip
      content={
        <div className="space-y-2">
          <p className="font-medium">Lead Acquisition Cost</p>
          <p>Total cost spent to acquire this batch of leads:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Advertising spend (Facebook, Google, etc.)</li>
            <li>Marketing campaign costs</li>
            <li>Lead generation tools</li>
            <li>Affiliate commissions</li>
          </ul>
          <p className="text-xs text-gray-300">Will be divided equally among all leads in the batch.</p>
        </div>
      }
      className={className}
      maxWidth="max-w-sm"
    />
  );
}

export function ReturnCostTooltip({ className = '' }: { className?: string }) {
  return (
    <HelpTooltip
      content={
        <div className="space-y-2">
          <p className="font-medium">Return Shipping Cost</p>
          <p>Cost associated with processing this return:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Return shipping fees</li>
            <li>Restocking fees</li>
            <li>Processing labor</li>
            <li>Refund processing fees</li>
          </ul>
          <p className="text-xs text-gray-300">Leave empty to use tenant default return cost.</p>
        </div>
      }
      className={className}
      maxWidth="max-w-sm"
    />
  );
}

export function ProfitMarginTooltip({ className = '' }: { className?: string }) {
  return (
    <InfoTooltip
      content={
        <div className="space-y-2">
          <p className="font-medium">Profit Margin</p>
          <p>Percentage of revenue that becomes profit:</p>
          <div className="text-xs space-y-1">
            <p><strong>Formula:</strong> (Net Profit ÷ Revenue) × 100</p>
            <p><strong>Excellent:</strong> 30%+ margin</p>
            <p><strong>Good:</strong> 20-30% margin</p>
            <p><strong>Fair:</strong> 10-20% margin</p>
            <p><strong>Low:</strong> 0-10% margin</p>
            <p><strong>Loss:</strong> Negative margin</p>
          </div>
        </div>
      }
      className={className}
      maxWidth="max-w-sm"
    />
  );
}