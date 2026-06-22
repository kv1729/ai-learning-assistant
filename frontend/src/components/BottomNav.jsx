function BottomNav({ activeScreen, setActiveScreen }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800">
      <div className="max-w-md mx-auto flex justify-around py-4 text-white">
        <button
          onClick={() => setActiveScreen("explore")}
          className={activeScreen === "explore" ? "font-bold" : "text-gray-500"}
        >
          🧭
        </button>

        <button
          onClick={() => setActiveScreen("home")}
          className={activeScreen === "home" ? "font-bold" : "text-gray-500"}
        >
          🏠
        </button>

        <button
          onClick={() => setActiveScreen("profile")}
          className={activeScreen === "profile" ? "font-bold" : "text-gray-500"}
        >
          👤
        </button>
      </div>
    </div>
  )
}

export default BottomNav