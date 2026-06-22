import { useState } from "react"
import cards from "../data/cards"

function Home() {
  const [cardIndex, setCardIndex] = useState(0)

  const nextCard = () => {
    if (cardIndex < cards.length - 1) {
      setCardIndex(cardIndex + 1)
    }
  }

  const prevCard = () => {
    if (cardIndex > 0) {
      setCardIndex(cardIndex - 1)
    }
  }

  const currentCard = cards[cardIndex]

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="max-w-md mx-auto px-4 pt-4">

        {/* Topic Tabs */}
        <div className="flex gap-3 overflow-x-auto mb-4">
          <button className="bg-white text-black px-4 py-2 rounded-full">
            Logistic
          </button>
          <button className="bg-gray-800 px-4 py-2 rounded-full">SVM</button>
          <button className="bg-gray-800 px-4 py-2 rounded-full">Trees</button>
        </div>

        {/* Progress */}
        <div className="text-right mb-3 text-gray-400">
          {cardIndex + 1} / {cards.length}
        </div>

        {/* Main Card */}
        <div className="bg-white text-black rounded-3xl overflow-hidden shadow-xl">
          <div className="h-64 bg-gray-300 flex items-center justify-center text-lg">
            Diagram Placeholder
          </div>

          <div className="p-6">
            <h2 className="text-3xl font-bold mb-4">
              {currentCard.title}
            </h2>

            <p className="text-gray-700 text-lg leading-relaxed">
              {currentCard.summary}
            </p>

            <div className="mt-8 flex justify-between">
              <button className="text-blue-600 font-semibold">
                Dive Deeper
              </button>

              <button className="text-green-600 font-semibold">
                Quick Check
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
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