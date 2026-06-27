function LearningCard({ card, currentIndex, totalCards }) {
  return (
    <div className="w-full h-full bg-[#111827] rounded-3xl overflow-hidden shadow-2xl flex flex-col">
      
      {/* Progress */}
      <div className="px-4 pt-3 pb-2 flex justify-between items-center text-white text-xs">
        <span>{currentIndex + 1} / {totalCards}</span>
        <span>🔖</span>
      </div>

      {/* Visual Section */}
      <div className="h-[35%] bg-black">
        <img
          src={card.image}
          alt={card.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content Section */}
      <div className="flex-1 px-4 py-4 text-white flex flex-col">
        
        <h2 className="text-2xl font-bold mb-3">
          {card.title}
        </h2>

        <p className="text-gray-300 leading-6 text-sm flex-1">
          {card.summary}
        </p>

        <div className="mt-4 flex gap-2">
          <button className="flex-1 bg-purple-600 py-2 rounded-xl text-sm font-medium">
            Explore
          </button>

          <button className="flex-1 bg-green-600 py-2 rounded-xl text-sm font-medium">
            Quick Check
          </button>
        </div>

        <div className="text-center text-gray-500 text-xs mt-3">
          ↑ Swipe up for next card
        </div>
      </div>
    </div>
  );
}

export default LearningCard;