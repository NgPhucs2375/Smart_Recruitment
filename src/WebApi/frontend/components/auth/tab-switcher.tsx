interface TabSwitcherProps {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}

export function TabSwitcher({ tabs, active, onChange }: TabSwitcherProps) {
  const cols = tabs.length <= 2 ? "grid-cols-2" : "grid-cols-3";
  return (
    <div className={`mb-4 grid ${cols} rounded-xl border border-border bg-white/80 p-1`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          aria-pressed={active === tab.id}
          className={`rounded-lg px-2 py-2.5 text-xs sm:text-sm font-medium transition-all ${
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
