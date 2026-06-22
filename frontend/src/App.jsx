import { useState } from "react"
import BottomNav from "./components/BottomNav"
import Explore from "./screens/Explore"
import Home from "./screens/Home"
import Profile from "./screens/Profile"

function App() {
  const [activeScreen, setActiveScreen] = useState("home")

  return (
    <div>
      {activeScreen === "explore" && <Explore />}
      {activeScreen === "home" && <Home />}
      {activeScreen === "profile" && <Profile />}

      <BottomNav
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
      />
    </div>
  )
}

export default App