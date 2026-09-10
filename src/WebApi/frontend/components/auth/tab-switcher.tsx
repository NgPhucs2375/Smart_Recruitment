interface TabSwitcherProps {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}

export function TabSwitcher({ tabs, active, onChange }: TabSwitcherProps) {
  return (
    <div className="mb-6 grid grid-cols-3 rounded-xl border border-[#d8d5ce] bg-white/80 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-lg py-2 text-xs sm:text-sm font-medium transition-all ${
            active === tab.id
              ? "bg-[#151515] text-white shadow-sm"
              : "text-[#69727a] hover:text-[#151515]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
