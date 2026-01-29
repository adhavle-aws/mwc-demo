import React, { useEffect, useState } from 'react';
import type { ProgressTabProps } from '../types';

/**
 * ProgressTab Component
 * 
 * Displays real-time CloudFormation deployment progress with:
 * - Progress bar showing deployment percentage
 * - Resource list with color-coded status indicators
 * - Event timeline showing deployment history
 * - Auto-refresh mechanism (5 second interval)
 * - Deployment duration display
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.6, 5.7
 */
const ProgressTab: React.FC<ProgressTabProps> = ({
  stackName,
  status,
  resources,
  events,
  startTime,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  /**
   * Calculate deployment duration
   */
  const getDuration = (): string => {
    const durationMs = currentTime.getTime() - startTime.getTime();
    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  /**
   * Calculate progress percentage based on resource statuses
   */
  const getProgressPercentage = (): number => {
    if (resources.length === 0) return 0;

    const completedStatuses = [
      'CREATE_COMPLETE',
      'UPDATE_COMPLETE',
      'DELETE_COMPLETE',
    ];

    const completedCount = resources.filter((resource) =>
      completedStatuses.includes(resource.status)
    ).length;

    return Math.round((completedCount / resources.length) * 100);
  };

  /**
   * Get status color based on deployment status
   */
  const getStatusColor = (resourceStatus: string): string => {
    if (resourceStatus.includes('COMPLETE') && !resourceStatus.includes('ROLLBACK')) {
      return 'text-[#10b981]'; // Green for success
    } else if (resourceStatus.includes('IN_PROGRESS')) {
      return 'text-[#f59e0b]'; // Yellow for in-progress
    } else if (resourceStatus.includes('FAILED') || resourceStatus.includes('ROLLBACK')) {
      return 'text-[#ef4444]'; // Red for failure
    } else {
      return 'text-[#9ca3af]'; // Gray for unknown
    }
  };

  /**
   * Get status icon based on resource status
   */
  const getStatusIcon = (resourceStatus: string): React.ReactElement => {
    if (resourceStatus.includes('COMPLETE') && !resourceStatus.includes('ROLLBACK')) {
      return (
        <svg
          className="w-5 h-5 text-[#10b981]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    } else if (resourceStatus.includes('IN_PROGRESS')) {
      return (
        <svg
          className="w-5 h-5 text-[#f59e0b] animate-spin"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    } else if (resourceStatus.includes('FAILED') || resourceStatus.includes('ROLLBACK')) {
      return (
        <svg
          className="w-5 h-5 text-[#ef4444]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    } else {
      return (
        <svg
          className="w-5 h-5 text-[#9ca3af]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    }
  };

  /**
   * Check if deployment is in terminal state
   */
  const isTerminalStatus = (deploymentStatus: string): boolean => {
    const terminalStatuses = [
      'CREATE_COMPLETE',
      'UPDATE_COMPLETE',
      'DELETE_COMPLETE',
      'CREATE_FAILED',
      'UPDATE_FAILED',
      'DELETE_FAILED',
      'ROLLBACK_COMPLETE',
      'ROLLBACK_FAILED',
      'UPDATE_ROLLBACK_COMPLETE',
      'UPDATE_ROLLBACK_FAILED',
    ];
    return terminalStatuses.includes(deploymentStatus);
  };

  /**
   * Auto-refresh mechanism - update current time every 5 seconds
   * Stop refreshing when deployment reaches terminal status
   */
  useEffect(() => {
    if (!autoRefresh || isTerminalStatus(status)) {
      return;
    }

    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 5000); // 5 second interval

    return () => clearInterval(intervalId);
  }, [autoRefresh, status]);

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (timestamp: Date): string => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const progressPercentage = getProgressPercentage();
  const duration = getDuration();

  return (
    <div className="flex flex-col h-full bg-[#0a0e1a] overflow-hidden">
      {/* Header with stack info and duration */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-[#2d3548] bg-[#151b2d]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-[#e4e7eb] break-words">
              {stackName}
            </h3>
            <p className="text-xs sm:text-sm text-[#9ca3af] mt-1">
              Status: <span className={getStatusColor(status)}>{status}</span>
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs sm:text-sm text-[#9ca3af]">Duration</p>
            <p className="text-base sm:text-lg font-semibold text-[#e4e7eb]">{duration}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs sm:text-sm font-medium text-[#9ca3af]">
              Overall Progress
            </span>
            <span className="text-xs sm:text-sm font-semibold text-[#e4e7eb]">
              {progressPercentage}%
            </span>
          </div>
          <div className="w-full h-2 bg-[#1e2638] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] transition-all duration-500 ease-out"
              style={{ width: `${progressPercentage}%` }}
              role="progressbar"
              aria-valuenow={progressPercentage}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Auto-refresh toggle */}
        <div className="mt-3 flex items-center justify-end">
          <label className="flex items-center gap-2 text-xs sm:text-sm text-[#9ca3af] cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 text-[#3b82f6] bg-[#1e2638] border-[#2d3548] rounded focus:ring-[#3b82f6] focus:ring-2"
            />
            <span>Auto-refresh (5s)</span>
          </label>
        </div>
      </div>

      {/* Content area with resources and events */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 p-3 sm:p-6">
          {/* Resources list */}
          <div>
            <h4 className="text-sm font-semibold text-[#e4e7eb] mb-3 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-[#3b82f6]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Resources ({resources.length})
            </h4>
            <div className="space-y-2">
              {resources.length === 0 ? (
                <p className="text-xs sm:text-sm text-[#6b7280] italic">
                  No resources yet
                </p>
              ) : (
                resources.map((resource, index) => (
                  <div
                    key={`${resource.logicalId}-${index}`}
                    className="
                      p-2 sm:p-3
                      bg-[#151b2d]
                      border border-[#2d3548]
                      rounded
                      hover:border-[#3b82f6]/50
                      hover:shadow-lg
                      transition-all duration-200
                      transform hover:scale-102
                    "
                  >
                    <div className="flex items-start gap-2 sm:gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getStatusIcon(resource.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-[#e4e7eb] truncate">
                          {resource.logicalId}
                        </p>
                        <p className="text-xs text-[#6b7280] mt-0.5 truncate">
                          {resource.type}
                        </p>
                        <p
                          className={`text-xs font-medium mt-1 ${getStatusColor(
                            resource.status
                          )}`}
                        >
                          {resource.status}
                        </p>
                        {resource.physicalId && (
                          <p className="text-xs text-[#9ca3af] mt-1 truncate">
                            {resource.physicalId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Event timeline */}
          <div>
            <h4 className="text-sm font-semibold text-[#e4e7eb] mb-3 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-[#8b5cf6]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Event Timeline ({events.length})
            </h4>
            <div className="space-y-3">
              {events.length === 0 ? (
                <p className="text-xs sm:text-sm text-[#6b7280] italic">No events yet</p>
              ) : (
                events
                  .slice()
                  .reverse()
                  .map((event, index) => (
                    <div
                      key={`${event.logicalId}-${event.timestamp}-${index}`}
                      className="relative pl-4 sm:pl-6 pb-3 border-l-2 border-[#2d3548] last:border-l-0 last:pb-0"
                    >
                      {/* Timeline dot */}
                      <div
                        className={`
                        absolute left-0 top-0 -translate-x-1/2
                        w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full
                        ${
                          event.status.includes('COMPLETE') &&
                          !event.status.includes('ROLLBACK')
                            ? 'bg-[#10b981]'
                            : event.status.includes('FAILED') ||
                              event.status.includes('ROLLBACK')
                            ? 'bg-[#ef4444]'
                            : 'bg-[#f59e0b]'
                        }
                      `}
                      />

                      {/* Event content */}
                      <div className="bg-[#151b2d] border border-[#2d3548] rounded p-2 sm:p-3">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-1 sm:gap-2">
                          <p className="text-xs sm:text-sm font-medium text-[#e4e7eb] break-words">
                            {event.logicalId}
                          </p>
                          <span className="text-xs text-[#6b7280] whitespace-nowrap">
                            {formatTimestamp(event.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-[#9ca3af] mt-1 break-words">
                          {event.resourceType}
                        </p>
                        <p
                          className={`text-xs font-medium mt-1 ${getStatusColor(
                            event.status
                          )}`}
                        >
                          {event.status}
                        </p>
                        {event.reason && (
                          <p className="text-xs text-[#6b7280] mt-2 italic break-words">
                            {event.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressTab;
