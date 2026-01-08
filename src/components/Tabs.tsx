interface TabsProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex gap-2 border-b border-white/20 mb-6">
      {tabs.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`
            px-6 py-3 font-semibold transition-all duration-200
            ${
              activeTab === tab
                ? 'text-white border-b-2 border-pink-500'
                : 'text-white/60 hover:text-white/80'
            }
          `}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
