import { useState } from "react";
import BottomNav from "./components/BottomNav";
import Explore from "./screens/Explore";
import Home from "./screens/Home";
import Profile from "./screens/Profile";

function App() {
  const [activeScreen, setActiveScreen] = useState("home");

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      
      {/* Mobile Frame */}
      <div className="w-[430px] h-[844px] bg-black text-white rounded-[40px] overflow-hidden border-4 border-gray-800 shadow-2xl flex flex-col">
        
        {/* Screen Content */}
        <div className="flex-1 overflow-hidden">
          {activeScreen === "explore" && <Explore />}
          {activeScreen === "home" && <Home />}
          {activeScreen === "profile" && <Profile />}
        </div>

        {/* Bottom Nav */}
        <BottomNav
          activeScreen={activeScreen}
          setActiveScreen={setActiveScreen}
        />
      </div>
    </div>
  );
}

export default App;