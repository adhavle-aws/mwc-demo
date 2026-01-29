import React, { useRef } from 'react';

/**
 * TabBar Component Props
 */
export interface TabBarProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: string;
  }>;
  activeTabId: string;
  onTabChange: (tabId: string) => void;
}

/**
 * TabBar Component
 * 
 * Displays a horizontal list of tabs with selection handling and keyboard navigation.
 * 
 * Features:
 * - Tab list display with labels and optional icons
 * - Active tab highlighting
 * - Click handling for tab selection
 * - Keyboard navigation with arrow keys (Left/Right)
 * - Focus management for accessibility
 * 
 * Requirements: 3.5, 3.6
 */
const TabBar: React.FC<TabBarProps> = ({ tabs, activeTabId, onTabChange }) => {
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let newIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        break;
      case 'ArrowRight':
        event.preventDefault();
        newIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = tabs.length - 1;
        break;
      default:
        return;
    }

    const newTab = tabs[newIndex];
    if (newTab) {
      onTabChange(newTab.id);
      // Focus the new tab
      const tabElement = tabRefs.current.get(newTab.id);
      if (tabElement) {
        tabElement.focus();
      }
    }
  };

  /**
   * Handle tab click
   */
  const handleTabClick = (tabId: string) => {
    onTabChange(tabId);
  };

  /**
   * Set ref for a tab button
   */
  const setTabRef = (tabId: string, element: HTMLButtonElement | null) => {
    if (element) {
      tabRefs.current.set(tabId, element);
    } else {
      tabRefs.current.delete(tabId);
    }
  };

  return (
    <div
      className="
        border-b border-[#2d3548]
        bg-[#0a0e1a]
      "
      role="tablist"
      aria-label="Response sections"
    >
      {/* Horizontal tabs on desktop, vertical on mobile */}
      <div className="
        flex flex-col sm:flex-row
        sm:overflow-x-auto
        scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent
      ">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;
          
          return (
            <button
              key={tab.id}
              ref={(el) => setTabRef(tab.id, el)}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabClick(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`
                px-4 sm:px-6 py-3
                text-sm font-medium
                whitespace-nowrap
                transition-all duration-200
                transform
                border-b-2 sm:border-b-2
                flex items-center gap-2
                w-full sm:w-auto
                justify-start sm:justify-center
                ${
                  isActive
                    ? 'text-[#3b82f6] border-[#3b82f6] bg-[#151b2d]'
                    : 'text-[#9ca3af] border-transparent hover:text-[#e4e7eb] hover:bg-[#151b2d] hover:scale-105'
                }
                focus:outline-none focus:ring-2 focus:ring-[#3b82f6] focus:ring-inset
              `}
            >
              {/* Optional icon */}
              {tab.icon && (
                <span className="text-base" aria-hidden="true">
                  {tab.icon}
                </span>
              )}
              
              {/* Tab label */}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabBar;
