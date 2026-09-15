interface TabSwitcherProps {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}

export function TabSwitcher({ tabs, active, onChange }: TabSwitcherProps) {
  return (
    <div className="mb-6 grid grid-cols-3 rounded-xl border border-border bg-white/80 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-lg py-2 text-xs sm:text-sm font-medium transition-all ${
            active === tab.id
              ? "bg-primary text-white shadow-sm"
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
