import React from 'react';
import type { AgentStatusIndicatorProps } from '../types';

/**
 * AgentStatusIndicator Component
 * 
 * Displays a visual status indicator for agents with color coding and animations.
 * 
 * Features:
 * - Green dot for 'available' status
 * - Yellow pulsing dot for 'busy' status
 * - Red dot for 'error' status
 * - Gray dot for 'unknown' status
 * - Tooltip on hover showing status details
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */
const AgentStatusIndicator: React.FC<AgentStatusIndicatorProps> = ({ 
  status, 
  tooltip 
}) => {
  // Determine the color class based on status
  const getStatusColor = (): string => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'busy':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      case 'unknown':
      default:
        return 'bg-gray-500';
    }
  };

  // Determine if pulsing animation should be applied
  const shouldPulse = status === 'busy';

  // Generate default tooltip text if not provided
  const getDefaultTooltip = (): string => {
    switch (status) {
      case 'available':
        return 'Agent is available';
      case 'busy':
        return 'Agent is busy processing';
      case 'error':
        return 'Agent encountered an error';
      case 'unknown':
      default:
        return 'Agent status unknown';
    }
  };

  const tooltipText = tooltip || getDefaultTooltip();

  return (
    <div className="relative inline-flex items-center group">
      {/* Status dot */}
      <div
        className={`
          w-2.5 h-2.5 rounded-full
          ${getStatusColor()}
          ${shouldPulse ? 'animate-pulse' : ''}
        `}
        aria-label={`Agent status: ${status}`}
        role="status"
      />
      
      {/* Tooltip */}
      <div
        className="
          absolute left-1/2 -translate-x-1/2 bottom-full mb-2
          px-2 py-1 text-xs text-white bg-gray-900 rounded
          whitespace-nowrap pointer-events-none
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
          z-10
        "
        role="tooltip"
      >
        {tooltipText}
        {/* Tooltip arrow */}
        <div
          className="
            absolute left-1/2 -translate-x-1/2 top-full
            w-0 h-0
            border-l-4 border-l-transparent
            border-r-4 border-r-transparent
            border-t-4 border-t-gray-900
          "
        />
      </div>
    </div>
  );
};

export default AgentStatusIndicator;
