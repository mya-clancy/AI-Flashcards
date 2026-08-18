import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Heart, HeartCrack, RefreshCw } from 'lucide-react';

export default function Flashcards() {
  const { deckId } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [health, setHealth] = useState(5);
  const [maxHealth, setMaxHealth] = useState(5);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  
  // For identification type
  const [textInput, setTextInput] = useState('');

  useEffect(() => {
    async function fetchDeck() {
      if (!deckId) return;
      const docRef = doc(db, 'flashcards', deckId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setDeck(data);
        // Set health based on difficulty
        let hp = 5;
        if (data.difficulty === 'Hard' || data.difficulty === 'Expert') hp = 3;
        if (data.difficulty === 'EXTREME') hp = 1;
        setHealth(hp);
        setMaxHealth(hp);
      } else {
        navigate('/');
      }
    }
    fetchDeck();
  }, [deckId, navigate]);

  if (!deck) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const cards = deck.cards || [];
  const currentCard = cards[currentIndex];
  const qType = deck.settings?.type || 'multiple_choice';

  const handleAnswer = (answer: string) => {
    if (showExplanation) return;
    
    setSelectedAnswer(answer);
    setShowExplanation(true);
    
    // Simple check (case insensitive for identification)
    const isCorrect = answer.trim().toLowerCase() === currentCard.answer.trim().toLowerCase();
    
    if (!isCorrect) {
      setHealth(h => {
        const newHealth = h - 1;
        if (newHealth <= 0) setGameOver(true);
        return newHealth;
      });
    }
  };

  const handleNext = () => {
    setShowExplanation(false);
    setSelectedAnswer(null);
    setTextInput('');
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex(c => c + 1);
    } else {
      setWon(true);
    }
  };

  const restart = () => {
    setCurrentIndex(0);
    setHealth(maxHealth);
    setGameOver(false);
    setWon(false);
    setShowExplanation(false);
    setSelectedAnswer(null);
    setTextInput('');
  };

  if (gameOver) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a1526] text-center p-6">
        <HeartCrack className="w-24 h-24 text-red-500 mb-6 animate-bounce" />
        <h1 className="text-5xl font-black text-red-500 mb-4 tracking-wider">GAME OVER</h1>
        <p className="text-xl text-blue-200 mb-8">You ran out of health!</p>
        <div className="flex gap-4">
          <button onClick={restart} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl flex items-center gap-2 transition-all">
            <RefreshCw className="w-5 h-5" /> Try Again
          </button>
          <Link to={`/lecture/${deck.lectureId}`} className="px-8 py-4 bg-[#162c4c] hover:bg-[#1a365d] border border-white/10 font-bold rounded-xl transition-all">
            Back to Lecture
          </Link>
        </div>
      </div>
    );
  }

  if (won) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a1526] text-center p-6">
        <div className="text-7xl mb-6">🏆</div>
        <h1 className="text-5xl font-black text-yellow-400 mb-4 tracking-wider">VICTORY!</h1>
        <p className="text-xl text-blue-200 mb-8">You mastered this deck with {health} health remaining!</p>
        <Link to={`/lecture/${deck.lectureId}`} className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl transition-all">
          Back to Lecture
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 flex flex-col min-h-screen">
      <header className="flex justify-between items-center py-6 mb-4">
        <Link to={`/lecture/${deck.lectureId}`} className="text-blue-400 hover:text-blue-300">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex gap-1">
          {Array.from({ length: maxHealth }).map((_, i) => (
            <Heart key={i} className={`w-8 h-8 ${i < health ? 'text-red-500 fill-red-500' : 'text-gray-600 fill-gray-600'} transition-all`} />
          ))}
        </div>
      </header>

      <div className="mb-4 flex justify-between text-sm font-bold text-blue-300">
        <span>Question {currentIndex + 1} / {cards.length}</span>
        <span className="uppercase tracking-wider px-2 py-1 bg-blue-500/20 rounded-md">
          {deck.difficulty}
        </span>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-[#162c4c] p-10 rounded-3xl border border-white/10 shadow-2xl flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Question */}
          <h2 className="text-2xl md:text-4xl font-bold leading-tight mb-12">
            {currentCard?.question}
          </h2>

          {/* Answers */}
          <div className="w-full max-w-xl">
            {qType === 'multiple_choice' && currentCard?.options && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentCard.options.map((opt: string, i: number) => {
                  const isSelected = selectedAnswer === opt;
                  const isCorrectAnswer = opt === currentCard.answer;
                  
                  let btnClass = "p-4 rounded-xl border-2 text-left font-semibold transition-all ";
                  if (!showExplanation) {
                    btnClass += "border-blue-500/30 bg-[#0f2139] hover:border-blue-400 hover:bg-[#1a365d]";
                  } else {
                    if (isCorrectAnswer) btnClass += "border-green-500 bg-green-500/20 text-green-300";
                    else if (isSelected && !isCorrectAnswer) btnClass += "border-red-500 bg-red-500/20 text-red-300";
                    else btnClass += "border-gray-600 bg-[#0f2139] opacity-50";
                  }

                  return (
                    <button 
                      key={i} 
                      disabled={showExplanation}
                      onClick={() => handleAnswer(opt)}
                      className={btnClass}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {(qType === 'identification' || qType === 'drag_drop') && (
              <form onSubmit={(e) => { e.preventDefault(); if(textInput) handleAnswer(textInput); }} className="w-full">
                <input
                  type="text"
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  disabled={showExplanation}
                  placeholder="Type your answer here..."
                  className="w-full bg-[#0f2139] border-2 border-blue-500/50 rounded-xl p-4 text-xl text-center text-white focus:outline-none focus:border-blue-400 disabled:opacity-50"
                />
                {!showExplanation && (
                  <button type="submit" className="mt-4 w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-xl font-bold transition-all">
                    Submit Answer
                  </button>
                )}
              </form>
            )}

            {/* Drag & Drop Hint */}
            {qType === 'drag_drop' && !showExplanation && (
              <p className="mt-6 text-sm text-blue-300/60 italic">
                * Note: Simple text entry matching used for Drag & Drop mode in this version.
              </p>
            )}
          </div>
        </div>

        {/* Explanation Footer */}
        {showExplanation && (
          <div className={`mt-6 p-6 rounded-2xl border ${selectedAnswer?.toLowerCase() === currentCard.answer.toLowerCase() ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'} flex flex-col md:flex-row items-center justify-between gap-6 animate-in slide-in-from-bottom-4`}>
            <div>
              <h3 className={`font-bold text-lg ${selectedAnswer?.toLowerCase() === currentCard.answer.toLowerCase() ? 'text-green-400' : 'text-red-400'} mb-1`}>
                {selectedAnswer?.toLowerCase() === currentCard.answer.toLowerCase() ? 'Correct!' : 'Incorrect!'}
              </h3>
              <p className="text-gray-300">
                The correct answer is: <span className="font-bold text-white">{currentCard.answer}</span>
              </p>
            </div>
            <button onClick={handleNext} className="whitespace-nowrap px-8 py-4 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors shadow-lg">
              {currentIndex + 1 < cards.length ? 'Next Question' : 'Finish Deck'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
