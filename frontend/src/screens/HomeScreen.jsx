import { useEffect, useState } from "react";
import LearningCard from "../components/LearningCard";

function HomeScreen({
  card,
  currentIndex,
  totalCards,
  onOpenDetail,
  onOpenQuickCheck,
  onNextCard,
  onPrevCard,
}) {
  const [touchStartX, setTouchStartX] = useState(null);
  const [activeTopic, setActiveTopic] = useState("Logistic Regression");
  const topicTabs = ["Logistic Regression", "SVM", "Trees", "KNN", "Naive Bayes"];

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "ArrowRight") onNextCard();
      if (event.key === "ArrowLeft") onPrevCard();
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [onNextCard, onPrevCard]);

  const handleTouchStart = (event) => {
    setTouchStartX(event.touches[0].clientX);
  };

  const handleTouchEnd = (event) => {
    if (touchStartX === null) return;

    const endX = event.changedTouches[0].clientX;
    const distance = endX - touchStartX;

    if (distance < -50) onNextCard();
    if (distance > 50) onPrevCard();

    setTouchStartX(null);
  };

  return (
    <div className="flex h-full flex-col bg-[#050816] text-white">
      <div className="px-3 pt-3 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
          {topicTabs.map((tab) => {
            const isActive = activeTopic === tab;

            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTopic(tab)}
                className={`shrink-0 border-b-2 px-2 py-1.5 text-sm transition ${
                  isActive
                    ? "border-purple-500 text-purple-300"
                    : "border-transparent text-slate-400"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="flex-1 px-2 pb-2"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <LearningCard
          card={card}
          currentIndex={currentIndex}
          totalCards={totalCards}
          onExplore={onOpenDetail}
          onQuickCheck={onOpenQuickCheck}
        />
      </div>
    </div>
  );
}

export default HomeScreen;
