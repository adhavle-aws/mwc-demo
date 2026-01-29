import React, { useState } from 'react';

/**
 * ResourcesTab Component
 * 
 * Displays a list of provisioned resources with their details.
 * Shows resource types, identifiers, statuses, and metadata.
 * 
 * Features:
 * - Searchable resource list
 * - Filterable by resource type
 * - Status indicators with color coding
 * - Resource details expansion
 * - Copy resource identifiers
 * 
 * Requirements: 3.3, 10.1
 */

export interface Resource {
  logicalId: string;
  physicalId: string;
  type: string;
  status: string;
  timestamp?: Date;
  properties?: Record<string, any>;
}

export interface ResourcesTabProps {
  resources: Resource[];
}

const ResourcesTab: React.FC<ResourcesTabProps> = ({ resources }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [expandedResource, setExpandedResource] = useState<string | null>(null);

  /**
   * Get unique resource types for filtering
   */
  const getResourceTypes = (): string[] => {
    const types = new Set(resources.map((r) => r.type));
    return Array.from(types).sort();
  };

  /**
   * Filter resources based on search and type
   */
  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      searchQuery === '' ||
      resource.logicalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.physicalId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = selectedType === 'all' || resource.type === selectedType;

    return matchesSearch && matchesType;
  });

  /**
   * Get status color based on resource status
   */
  const getStatusColor = (status: string): string => {
    if (status.includes('COMPLETE') && !status.includes('ROLLBACK')) {
      return 'text-[#10b981] bg-[#10b981]/10';
    } else if (status.includes('IN_PROGRESS')) {
      return 'text-[#f59e0b] bg-[#f59e0b]/10';
    } else if (status.includes('FAILED') || status.includes('ROLLBACK')) {
      return 'text-[#ef4444] bg-[#ef4444]/10';
    } else {
      return 'text-[#9ca3af] bg-[#9ca3af]/10';
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status: string): React.ReactElement => {
    if (status.includes('COMPLETE') && !status.includes('ROLLBACK')) {
      return (
        <svg
          className="w-4 h-4"
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
    } else if (status.includes('IN_PROGRESS')) {
      return (
        <svg
          className="w-4 h-4 animate-spin"
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
    } else if (status.includes('FAILED') || status.includes('ROLLBACK')) {
      return (
        <svg
          className="w-4 h-4"
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
          className="w-4 h-4"
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
   * Copy resource ID to clipboard
   */
  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  /**
   * Toggle resource expansion
   */
  const toggleExpand = (logicalId: string) => {
    setExpandedResource(expandedResource === logicalId ? null : logicalId);
  };

  const resourceTypes = getResourceTypes();

  return (
    <div className="flex flex-col h-full bg-[#0a0e1a]">
      {/* Header with search and filters */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-[#2d3548] bg-[#151b2d]">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
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
          <h3 className="text-base sm:text-lg font-semibold text-[#e4e7eb]">
            Resources ({filteredResources.length})
          </h3>
        </div>

        {/* Search input */}
        <div className="mb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full
                px-3 sm:px-4 py-2 pl-9 sm:pl-10
                bg-[#1e2638]
                border border-[#2d3548]
                rounded
                text-[#e4e7eb]
                placeholder-[#6b7280]
                focus:outline-none focus:ring-2 focus:ring-[#3b82f6]
                text-sm
              "
            />
            <svg
              className="absolute left-2.5 sm:left-3 top-2.5 w-4 h-4 sm:w-5 sm:h-5 text-[#6b7280]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Type filter */}
        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="
              w-full
              px-3 py-2
              bg-[#1e2638]
              border border-[#2d3548]
              rounded
              text-[#e4e7eb]
              text-sm
              focus:outline-none focus:ring-2 focus:ring-[#3b82f6]
            "
          >
            <option value="all">All Resource Types</option>
            {resourceTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Resource list */}
      <div className="flex-1 overflow-auto p-3 sm:p-6">
        {filteredResources.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-10 h-10 sm:w-12 sm:h-12 text-[#6b7280] mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-[#9ca3af] text-sm">
              {searchQuery || selectedType !== 'all'
                ? 'No resources match your filters'
                : 'No resources available'}
            </p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filteredResources.map((resource) => (
              <div
                key={resource.logicalId}
                className="
                  bg-[#151b2d]
                  border border-[#2d3548]
                  rounded-lg
                  overflow-hidden
                  hover:border-[#3b82f6]/50
                  hover:shadow-lg
                  transition-all duration-200
                  transform hover:scale-102
                "
              >
                {/* Resource header */}
                <div
                  className="p-3 sm:p-4 cursor-pointer"
                  onClick={() => toggleExpand(resource.logicalId)}
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-[#e4e7eb] truncate">
                          {resource.logicalId}
                        </h4>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyId(resource.logicalId);
                          }}
                          className="text-[#6b7280] hover:text-[#3b82f6] active:scale-90 transition-all duration-150 transform flex-shrink-0"
                          aria-label="Copy logical ID"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                      </div>
                      <p className="text-xs text-[#6b7280] mb-2 break-words">{resource.type}</p>
                      <div className="flex items-center gap-2">
                        <span
                          className={`
                            inline-flex items-center gap-1.5
                            px-2 py-1
                            rounded
                            text-xs font-medium
                            ${getStatusColor(resource.status)}
                          `}
                        >
                          {getStatusIcon(resource.status)}
                          <span className="hidden xs:inline">{resource.status}</span>
                        </span>
                      </div>
                    </div>

                    {/* Expand icon */}
                    <svg
                      className={`
                        w-5 h-5 text-[#6b7280] flex-shrink-0
                        transition-transform duration-200
                        ${expandedResource === resource.logicalId ? 'rotate-180' : ''}
                      `}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>

                {/* Expanded details */}
                {expandedResource === resource.logicalId && (
                  <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-[#2d3548]">
                    <div className="pt-3 sm:pt-4 space-y-3">
                      {/* Physical ID */}
                      <div>
                        <p className="text-xs text-[#6b7280] mb-1">Physical ID</p>
                        <div className="flex items-start gap-2">
                          <p className="text-xs sm:text-sm text-[#e4e7eb] font-mono break-all flex-1">
                            {resource.physicalId}
                          </p>
                          <button
                            onClick={() => handleCopyId(resource.physicalId)}
                            className="text-[#6b7280] hover:text-[#3b82f6] active:scale-90 transition-all duration-150 transform flex-shrink-0"
                            aria-label="Copy physical ID"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Timestamp */}
                      {resource.timestamp && (
                        <div>
                          <p className="text-xs text-[#6b7280] mb-1">Last Updated</p>
                          <p className="text-xs sm:text-sm text-[#e4e7eb]">
                            {new Date(resource.timestamp).toLocaleString()}
                          </p>
                        </div>
                      )}

                      {/* Properties */}
                      {resource.properties && Object.keys(resource.properties).length > 0 && (
                        <div>
                          <p className="text-xs text-[#6b7280] mb-2">Properties</p>
                          <div className="bg-[#1e2638] rounded p-2 sm:p-3 space-y-2">
                            {Object.entries(resource.properties).map(([key, value]) => (
                              <div key={key} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-4">
                                <span className="text-xs text-[#9ca3af] break-words">{key}:</span>
                                <span className="text-xs text-[#e4e7eb] font-mono break-all sm:text-right">
                                  {typeof value === 'object'
                                    ? JSON.stringify(value)
                                    : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourcesTab;
