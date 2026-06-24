import { useState } from "react"
import cards from "../data/cards"

function Home() {
  const [cardIndex, setCardIndex] = useState(0)

  const nextCard = () => {
    if (cardIndex < cards.length - 1) setCardIndex(cardIndex + 1)
  }

  const prevCard = () => {
    if (cardIndex > 0) setCardIndex(cardIndex - 1)
  }

  const currentCard = cards[cardIndex]

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="max-w-md mx-auto px-4 pt-3">

        {/* Topics */}
        <div className="flex gap-5 overflow-x-auto mb-3 text-sm">
          <span className="text-blue-500 font-bold">Logistic</span>
          <span className="text-gray-400">SVM</span>
          <span className="text-gray-400">Trees</span>
          <span className="text-gray-400">Random Forest</span>
        </div>

        <div className="text-right text-gray-500 text-sm mb-2">
          {cardIndex + 1} / {cards.length}
        </div>

        <div className="bg-white text-black rounded-3xl overflow-hidden min-h-[760px]">
          
          {/* Image Area = 30% */}
          <div className="h-56 bg-gray-300 flex items-center justify-center">
            Diagram
          </div>

          {/* Save Button */}
          <div className="flex justify-end px-5 pt-3">
            <button className="text-gray-500 text-xl">🔖</button>
          </div>

          <div className="px-5 pb-5">
            <h2 className="text-2xl font-bold mb-2">
              {currentCard.title}
            </h2>

            <p className="text-[17px] leading-7 text-gray-800">
              {currentCard.summary}
            </p>
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <button
            onClick={prevCard}
            className="bg-gray-800 px-6 py-3 rounded-xl"
          >
            Previous
          </button>

          <button
            onClick={nextCard}
            className="bg-blue-600 px-6 py-3 rounded-xl"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default Home