import React from 'react';

interface TabsProps {
  tabs: { label: string; content: React.ReactNode }[];
  activeTab: number;
  onTabClick: (index: number) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabClick }) => {
  return (
    <div>
      <div className="flex border-b">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`px-4 py-2 -mb-px border-b-2 ${
              activeTab === index ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500'
            }`}
            onClick={() => onTabClick(index)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {tabs[activeTab].content}
      </div>
    </div>
  );
};

export default Tabs;