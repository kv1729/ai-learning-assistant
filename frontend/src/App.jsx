import { useState } from "react";
import BottomNav from "./components/BottomNav";
import cards from "./data/cards";
import DetailScreen from "./screens/DetailScreen";
import HomeScreen from "./screens/HomeScreen";
import QuickCheckScreen from "./screens/QuickCheckScreen";

function PlaceholderScreen({ title, detail, onBack }) {
  return (
    <div className="flex h-full flex-col justify-between bg-[#050816] px-5 py-6 text-white">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-300"
        >
          ← Back
        </button>

        <div className="mt-8 rounded-[32px] border border-white/10 bg-slate-900/80 p-6">
          <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-300">Placeholder</p>
          <h2 className="mt-3 text-2xl font-semibold">{title}</h2>
          <p className="mt-3 text-[15px] leading-7 text-slate-300">{detail}</p>
        </div>
      </div>

      <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
        This area is intentionally left simple while the learning loop stays focused.
      </div>
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [currentScreen, setCurrentScreen] = useState("home");
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  const currentCard = cards[currentCardIndex] ?? cards[0];

  const handleNextCard = () => {
    setCurrentCardIndex((prev) => (prev < cards.length - 1 ? prev + 1 : prev));
  };

  const handlePrevCard = () => {
    setCurrentCardIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentScreen(tab === "home" ? "home" : tab);
  };

  const handleOpenDetail = () => {
    setCurrentScreen("detail");
    setActiveTab("home");
  };

  const handleOpenQuickCheck = () => {
    setCurrentScreen("quickcheck");
    setActiveTab("home");
  };

  const handleBackFromFlow = () => {
    setCurrentScreen("home");
    setActiveTab("home");
  };

  const renderScreen = () => {
    if (currentScreen === "detail") {
      return <DetailScreen card={currentCard} setCurrentScreen={handleBackFromFlow} />;
    }

    if (currentScreen === "quickcheck") {
      return <QuickCheckScreen card={currentCard} setCurrentScreen={handleBackFromFlow} />;
    }

    if (currentScreen === "explore") {
      return (
        <PlaceholderScreen
          title="Explore"
          detail="More learning paths and topic collections will appear here soon."
          onBack={handleBackFromFlow}
        />
      );
    }

    if (currentScreen === "profile") {
      return (
        <PlaceholderScreen
          title="Profile"
          detail="Saved lessons and progress tracking will appear here as the learning loop grows."
          onBack={handleBackFromFlow}
        />
      );
    }

    return (
      <HomeScreen
        card={currentCard}
        currentIndex={currentCardIndex}
        totalCards={cards.length}
        onOpenDetail={handleOpenDetail}
        onOpenQuickCheck={handleOpenQuickCheck}
        onNextCard={handleNextCard}
        onPrevCard={handlePrevCard}
      />
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050816] px-4 py-6">
      <div className="flex h-[844px] w-[430px] flex-col overflow-hidden rounded-[40px] border border-white/10 bg-[#050816] text-white shadow-2xl">
        <div className="flex-1 overflow-hidden">{renderScreen()}</div>
        <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      </div>
    </div>
  );
}

export default App;