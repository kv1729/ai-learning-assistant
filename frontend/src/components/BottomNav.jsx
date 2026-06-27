function BottomNav({ activeScreen, setActiveScreen }) {
  return (
    <div className="h-16 bg-black border-t border-gray-800 flex justify-around items-center text-white">
      
      <button
        onClick={() => setActiveScreen("explore")}
        className={activeScreen === "explore" ? "text-purple-400 text-2xl" : "text-gray-500 text-2xl"}
      >
        🧭
      </button>

      <button
        onClick={() => setActiveScreen("home")}
        className={activeScreen === "home" ? "text-purple-400 text-2xl" : "text-gray-500 text-2xl"}
      >
        🏠
      </button>

      <button
        onClick={() => setActiveScreen("profile")}
        className={activeScreen === "profile" ? "text-purple-400 text-2xl" : "text-gray-500 text-2xl"}
      >
        👤
      </button>

    </div>
  );
}

export default BottomNav;