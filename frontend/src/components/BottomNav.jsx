function BottomNav({ activeTab, onTabChange }) {
  const items = [
    { id: "explore", label: "Explore", icon: "🔍" },
    { id: "home", label: "Home", icon: "⌂" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  return (
    <div className="bg-[#050816] px-4 py-2">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.label}
              onClick={() => onTabChange(item.id)}
              className={`flex h-12 w-12 items-center justify-center text-3xl transition ${
                isActive ? "text-purple-300" : "text-slate-400"
              }`}
            >
              {item.icon}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default BottomNav;