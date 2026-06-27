import { useState, useEffect } from "react";
import cards from "../data/cards";
import LearningCard from "../components/LearningCard";

function Home() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextCard = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.key === "ArrowRight") nextCard();
      if (event.key === "ArrowLeft") prevCard();
    };

    window.addEventListener("keydown", handleKeyPress);

    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentIndex]);

  return (
    <div className="h-full bg-black text-white flex flex-col">
      
      {/* Top Navigation */}
      <div className="px-4 py-3 overflow-x-auto whitespace-nowrap border-b border-gray-800">
        <div className="flex gap-5 text-xs">
          <span className="text-purple-400 font-semibold border-b-2 border-purple-400 pb-1">
            Logistic
          </span>
          <span className="text-gray-400">SVM</span>
          <span className="text-gray-400">Trees</span>
          <span className="text-gray-400">KNN</span>
          <span className="text-gray-400">Naive</span>
        </div>
      </div>

      {/* Main Card */}
      <div className="flex-1 p-2">
        <LearningCard
          card={cards[currentIndex]}
          currentIndex={currentIndex}
          totalCards={cards.length}
        />
      </div>
    </div>
  );
}

export default Home;