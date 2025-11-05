import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Screen, Question } from './types';
import { carImageUrl } from './assets';

// --- Sound Hook ---

const useSound = () => {
  const audioCtx = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioCtx.current) {
      try {
        // Fix for browser policies that require user interaction to start AudioContext
        audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error("Web Audio API is not supported in this browser");
      }
    }
  }, []);

  const playSound = useCallback((type: 'correct' | 'incorrect' | 'move' | 'gameover' | 'click') => {
    if (!audioCtx.current) return;
    const now = audioCtx.current.currentTime;
    
    switch (type) {
      case 'correct': {
        const oscillator1 = audioCtx.current.createOscillator();
        const gainNode1 = audioCtx.current.createGain();
        oscillator1.connect(gainNode1);
        gainNode1.connect(audioCtx.current.destination);
        oscillator1.type = 'sine';
        oscillator1.frequency.setValueAtTime(523.25, now); // C5
        gainNode1.gain.setValueAtTime(0.15, now);
        gainNode1.gain.exponentialRampToValueAtTime(0.00001, now + 0.1);
        oscillator1.start(now);
        oscillator1.stop(now + 0.1);

        const oscillator2 = audioCtx.current.createOscillator();
        const gainNode2 = audioCtx.current.createGain();
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioCtx.current.destination);
        oscillator2.type = 'sine';
        oscillator2.frequency.setValueAtTime(783.99, now + 0.1); // G5
        gainNode2.gain.setValueAtTime(0.15, now + 0.1);
        gainNode2.gain.exponentialRampToValueAtTime(0.00001, now + 0.2);
        oscillator2.start(now + 0.1);
        oscillator2.stop(now + 0.2);
        break;
      }
      case 'incorrect': {
        const oscillator = audioCtx.current.createOscillator();
        const gainNode = audioCtx.current.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.current.destination);
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(164.81, now); // E3
        oscillator.frequency.exponentialRampToValueAtTime(110, now + 0.2);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.2);
        oscillator.start(now);
        oscillator.stop(now + 0.2);
        break;
      }
      case 'move': {
        const bufferSize = audioCtx.current.sampleRate * 0.3; // 0.3 seconds
        const buffer = audioCtx.current.createBuffer(1, bufferSize, audioCtx.current.sampleRate);
        const output = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1; // White noise
        }

        const whiteNoise = audioCtx.current.createBufferSource();
        whiteNoise.buffer = buffer;

        const bandpass = audioCtx.current.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(400, now);
        bandpass.frequency.exponentialRampToValueAtTime(2000, now + 0.25);
        bandpass.Q.value = 1;
        
        const gainNode = audioCtx.current.createGain();
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.25);

        whiteNoise.connect(bandpass);
        bandpass.connect(gainNode);
        gainNode.connect(audioCtx.current.destination);
        whiteNoise.start(now);
        whiteNoise.stop(now + 0.3);
        break;
      }
      case 'gameover': {
        const notes = [392, 349, 329, 293]; // G4, F4, E4, D4
        notes.forEach((freq, i) => {
            const oscillator = audioCtx.current!.createOscillator();
            const gainNode = audioCtx.current!.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.current!.destination);
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(freq, now + i * 0.15);
            gainNode.gain.setValueAtTime(0.15, now + i * 0.15);
            gainNode.gain.exponentialRampToValueAtTime(0.00001, now + i * 0.15 + 0.1);
            oscillator.start(now + i * 0.15);
            oscillator.stop(now + i * 0.15 + 0.1);
        });
        break;
      }
      case 'click': {
        const oscillator = audioCtx.current.createOscillator();
        const gainNode = audioCtx.current.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.current.destination);
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(800, now);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, now + 0.05);
        oscillator.start(now);
        oscillator.stop(now + 0.05);
        break;
      }
    }
  }, []);

  return { initAudio, playSound };
};


// --- Helper Components ---

const HeartIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-7 h-7 text-red-500"
    {...props}
  >
    <path
      d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-1.344-.688 11.85 11.85 0 01-2.032-1.103c-1.406-.82-2.502-1.72-3.32-2.618C1.95 14.826 1 13.138 1 11.458c0-1.794.888-3.37 2.164-4.332C4.4 6.25 5.923 5.5 7.592 5.5c1.583 0 3.042.724 4.088 1.868 1.046-1.144 2.505-1.868 4.088-1.868 1.67 0 3.192.75 4.428 1.718 1.276.962 2.164 2.538 2.164 4.332 0 1.68-.95 3.368-2.365 4.966-1.415 1.6-3.16 2.94-4.944 3.963a18.342 18.342 0 01-3.375 1.488l-.022.012-.007.003-.002.001-.001.001z"
    />
  </svg>
);

// --- Screen Components ---

interface WelcomeScreenProps {
  onStart: () => void;
}
const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => (
  <div className="text-center py-10 px-4">
    <div className="flex justify-center mb-6">
      <div className="w-32 h-32 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
         <img src="./files/car.png" alt="Car" className="w-20" />
      </div>
    </div>
    <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">Math Racers</h1>
    <p className="text-lg text-gray-600 mb-8">Bolalar uchun matematika poygasi!</p>
    <p className="max-w-md mx-auto text-gray-500 mb-10">
      Misollarni to'g'ri yechib, mashinangizni to'g'ri yo'lakka olib boring.
    </p>
    <button
      onClick={onStart}
      className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transform hover:scale-105 transition-all duration-300 ease-in-out"
    >
      O'yinni Boshlash
    </button>
  </div>
);

interface PlayingScreenProps {
  score: number;
  lives: number;
  question: Question | null;
  carLane: number;
  isAnimating: boolean;
  lastAnswerStatus: { correct: boolean; index: number } | null;
  selectAnswer: (index: number) => void;
  exitGame: () => void;
  restartRound: () => void;
}
const PlayingScreen: React.FC<PlayingScreenProps> = ({
  score,
  lives,
  question,
  carLane,
  isAnimating,
  lastAnswerStatus,
  selectAnswer,
  exitGame,
  restartRound,
}) => {
  const getButtonClass = (index: number) => {
    let baseClass = "w-24 h-24 md:w-28 md:h-28 text-3xl md:text-4xl rounded-full font-bold shadow-lg transform transition-all duration-300";
    if (isAnimating) {
      baseClass += " opacity-60 cursor-not-allowed";
      if (lastAnswerStatus?.index === index) {
         baseClass += lastAnswerStatus.correct ? " bg-green-400 text-white scale-110" : " bg-red-400 text-white scale-110 animate-shake";
      } else {
        baseClass += " bg-gray-200 text-gray-700";
      }
    } else {
      baseClass += " bg-blue-500 text-white hover:bg-blue-600 hover:scale-105";
    }
    return baseClass;
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="text-left">
          <div className="text-sm text-gray-500">Lives</div>
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: lives }).map((_, i) => <HeartIcon key={i} />)}
            {lives === 0 && <div className="text-2xl font-semibold text-gray-400">(0)</div>}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Score</div>
          <div className="text-3xl font-bold text-indigo-600">{score}</div>
        </div>
      </div>

      <div className="text-center my-6 md:my-10 min-h-[80px] flex items-center justify-center">
        <div className="text-4xl md:text-6xl font-bold text-gray-800 tracking-wider bg-gray-100 p-4 rounded-lg shadow-inner">
          {question?.text} = ?
        </div>
      </div>

      <div className="relative h-64 bg-gray-700 rounded-xl overflow-hidden border-4 border-gray-800 shadow-2xl p-4">
        {/* Road surface */}
        <div className="absolute inset-0 bg-gray-700"></div>
        {/* Animated Lane lines */}
        <div className="absolute inset-0 flex justify-evenly pointer-events-none">
            <div className="w-2 h-full bg-[repeating-linear-gradient(to_bottom,theme(colors.yellow.400),theme(colors.yellow.400)_20px,transparent_20px,transparent_40px)] animate-road"></div>
            <div className="w-2 h-full bg-[repeating-linear-gradient(to_bottom,theme(colors.yellow.400),theme(colors.yellow.400)_20px,transparent_20px,transparent_40px)] animate-road"></div>
        </div>


        {/* Answer Options */}
        <div className="absolute top-4 left-0 right-0 flex justify-around px-2 z-10">
          {question?.options.map((opt, i) => (
            <button key={i} onClick={() => selectAnswer(i)} disabled={isAnimating} className={getButtonClass(i)}>
              {opt}
            </button>
          ))}
        </div>

        {/* Car */}
        <div className="absolute bottom-4 left-0 w-full h-24">
          <div
            className="absolute w-1/3 h-full flex justify-center items-center"
            style={{
              left: `${carLane * 33.333}%`,
              transition: 'left 500ms ease-out',
            }}
          >
             <img src={carImageUrl} alt="Racing Car" className="w-12 h-auto md:w-16 transition-all duration-300" />
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex justify-between">
        <button onClick={exitGame} className="px-5 py-2 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition-colors">Exit</button>
        <button onClick={restartRound} className="px-5 py-2 rounded-lg bg-yellow-400 text-yellow-900 font-semibold hover:bg-yellow-500 transition-colors">Restart Round</button>
      </div>
    </div>
  );
};

interface GameOverScreenProps {
  score: number;
  onPlayAgain: () => void;
  onExit: () => void;
}
const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, onPlayAgain, onExit }) => (
  <div className="text-center py-10 px-4">
    <div className="mb-4 text-7xl">🎉</div>
    <h2 className="text-3xl font-bold text-gray-800 mb-2">O'yin Tugadi!</h2>
    <p className="text-lg text-gray-600 mb-8">
      Sizning natijangiz: <span className="font-bold text-3xl text-indigo-600">{score}</span>
    </p>
    <div className="flex flex-col sm:flex-row justify-center gap-4">
      <button
        onClick={onPlayAgain}
        className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transform hover:scale-105 transition-all duration-300 ease-in-out"
      >
        Qayta O'ynash
      </button>
      <button
        onClick={onExit}
        className="px-8 py-3 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 transition-colors"
      >
        Chiqish
      </button>
    </div>
  </div>
);


// --- Main App Component ---

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [question, setQuestion] = useState<Question | null>(null);
  const [carLane, setCarLane] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [lastAnswerStatus, setLastAnswerStatus] = useState<{ correct: boolean, index: number } | null>(null);
  const { initAudio, playSound } = useSound();

  const newQuestion = useCallback(() => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    const isAddition = Math.random() < 0.5;
    
    let text: string;
    let correctAnswer: number;

    if (isAddition) {
      text = `${a} + ${b}`;
      correctAnswer = a + b;
    } else {
      if (a >= b) {
        text = `${a} - ${b}`;
        correctAnswer = a - b;
      } else {
        text = `${b} - ${a}`;
        correctAnswer = b - a;
      }
    }
    
    const wrongs = new Set<number>();
    while (wrongs.size < 2) {
      let delta = Math.floor(Math.random() * 4) + 1;
      if (Math.random() < 0.5) delta = -delta;
      const candidate = correctAnswer + delta;
      if (candidate >= 0 && candidate !== correctAnswer) {
        wrongs.add(candidate);
      }
    }

    const options = [correctAnswer, ...Array.from(wrongs)];
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    setQuestion({ text, correctAnswer, options });
    setLastAnswerStatus(null);
  }, []);

  const resetGame = useCallback(() => {
    setScore(0);
    setLives(3);
    setCarLane(1);
    setIsAnimating(false);
    setLastAnswerStatus(null);
  }, []);
  
  const startGame = useCallback(() => {
    initAudio();
    playSound('click');
    resetGame();
    setScreen('playing');
  }, [resetGame, initAudio, playSound]);

  useEffect(() => {
    if (screen === 'playing') {
      newQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const selectAnswer = useCallback((index: number) => {
    if (isAnimating || !question) return;

    playSound('move');
    setIsAnimating(true);
    setCarLane(index);

    const isCorrect = question.options[index] === question.correctAnswer;
    setLastAnswerStatus({ correct: isCorrect, index });

    setTimeout(() => {
      playSound(isCorrect ? 'correct' : 'incorrect');
      let newLives = lives;
      if (isCorrect) {
        setScore(s => s + 10);
      } else {
        newLives = lives - 1;
        setLives(newLives);
      }

      setTimeout(() => {
        if (newLives <= 0) {
          playSound('gameover');
          setScreen('gameover');
        } else {
          newQuestion();
        }
        setIsAnimating(false);
      }, 800);
    }, 600);
  }, [isAnimating, question, lives, newQuestion, playSound]);
  
  const playAgain = useCallback(() => {
    playSound('click');
    startGame();
  }, [startGame, playSound]);

  const exitGame = useCallback(() => {
    playSound('click');
    resetGame();
    setScreen('welcome');
  }, [resetGame, playSound]);

  const restartRound = useCallback(() => {
    playSound('click');
    resetGame();
    newQuestion();
  }, [resetGame, newQuestion, playSound]);

  const renderScreen = () => {
    switch (screen) {
      case 'playing':
        return <PlayingScreen 
                  score={score} 
                  lives={lives} 
                  question={question} 
                  carLane={carLane} 
                  isAnimating={isAnimating}
                  lastAnswerStatus={lastAnswerStatus}
                  selectAnswer={selectAnswer}
                  exitGame={exitGame}
                  restartRound={restartRound}
                />;
      case 'gameover':
        return <GameOverScreen score={score} onPlayAgain={playAgain} onExit={exitGame} />;
      case 'welcome':
      default:
        return <WelcomeScreen onStart={startGame} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200 p-2 sm:p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {renderScreen()}
      </div>
      <footer className="text-center mt-4 text-xs sm:text-sm text-gray-600 w-full max-w-2xl px-2">
        <p>Tip: Questions are kept simple for young children. This app can be embedded as a React component.</p>
        <p>Matematik Poygasi - Bolalar uchun qiziqarli o'yin.</p>
      </footer>
    </div>
  );
}
