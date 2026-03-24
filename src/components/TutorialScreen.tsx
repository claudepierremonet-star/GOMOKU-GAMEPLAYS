import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Target, BookOpen } from 'lucide-react';

interface TutorialScreenProps {
  onBack: () => void;
}

export const TutorialScreen: React.FC<TutorialScreenProps> = ({ onBack }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "The Goal",
      icon: <Target className="w-6 h-6 text-blue-500" />,
      content: "Gomoku is a strategy board game. The goal is simple: be the first player to get an unbroken row of five stones horizontally, vertically, or diagonally.",
      board: (
        <div className="grid grid-cols-5 gap-1 bg-amber-200 p-2 rounded-lg w-48 mx-auto">
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} className="w-8 h-8 flex items-center justify-center border border-amber-300/50 relative">
              {/* Horizontal win on middle row */}
              {i >= 10 && i <= 14 && (
                <div className="w-6 h-6 rounded-full bg-zinc-900 shadow-md" />
              )}
            </div>
          ))}
        </div>
      )
    },
    {
      title: "How to Play",
      icon: <BookOpen className="w-6 h-6 text-emerald-500" />,
      content: "Players take turns placing one stone of their color on an empty intersection. Black always plays first. Once placed, stones cannot be moved or removed.",
      board: (
        <div className="grid grid-cols-5 gap-1 bg-amber-200 p-2 rounded-lg w-48 mx-auto">
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} className="w-8 h-8 flex items-center justify-center border border-amber-300/50 relative">
              {i === 12 && <div className="w-6 h-6 rounded-full bg-zinc-900 shadow-md" />}
              {i === 13 && <div className="w-6 h-6 rounded-full bg-white shadow-md border border-zinc-200" />}
              {i === 7 && <div className="w-6 h-6 rounded-full bg-zinc-900 shadow-md" />}
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Basic Strategy: Open Threes",
      icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
      content: "An 'Open Three' is a row of three stones with empty spaces on both ends. If your opponent gets an open three, you MUST block it, or they will make an unblockable 'Open Four' on their next turn.",
      board: (
        <div className="grid grid-cols-7 gap-1 bg-amber-200 p-2 rounded-lg w-56 mx-auto">
          {Array.from({ length: 49 }).map((_, i) => (
            <div key={i} className="w-6 h-6 flex items-center justify-center border border-amber-300/50 relative">
              {/* Open three in the middle */}
              {(i === 23 || i === 24 || i === 25) && (
                <div className="w-5 h-5 rounded-full bg-zinc-900 shadow-md" />
              )}
              {/* Highlight empty ends */}
              {(i === 22 || i === 26) && (
                <div className="w-3 h-3 rounded-full bg-red-500/50 animate-pulse" />
              )}
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Basic Strategy: Fours",
      icon: <AlertTriangle className="w-6 h-6 text-red-500" />,
      content: "A 'Four' is a row of four stones. If your opponent has four stones, they will win on their next turn. You must block the open end immediately!",
      board: (
        <div className="grid grid-cols-7 gap-1 bg-amber-200 p-2 rounded-lg w-56 mx-auto">
          {Array.from({ length: 49 }).map((_, i) => (
            <div key={i} className="w-6 h-6 flex items-center justify-center border border-amber-300/50 relative">
              {/* Four in a row */}
              {(i === 22 || i === 23 || i === 24 || i === 25) && (
                <div className="w-5 h-5 rounded-full bg-zinc-900 shadow-md" />
              )}
              {/* Blocked on one end */}
              {i === 21 && (
                <div className="w-5 h-5 rounded-full bg-white shadow-md border border-zinc-200" />
              )}
              {/* Highlight empty end */}
              {i === 26 && (
                <div className="w-3 h-3 rounded-full bg-red-500/50 animate-pulse" />
              )}
            </div>
          ))}
        </div>
      )
    },
    {
      title: "Advanced: Renju Rules",
      icon: <CheckCircle2 className="w-6 h-6 text-purple-500" />,
      content: "Because Black plays first, they have a significant advantage. In 'Renju' (Pro) rules, Black is forbidden from making 'Double Threes', 'Double Fours', or 'Overlines' (6+ stones). White has no restrictions.",
      board: (
        <div className="flex items-center justify-center h-32 bg-zinc-100 rounded-lg border border-zinc-200">
          <p className="text-zinc-500 text-sm px-6 text-center">
            You can toggle between Casual and Renju rules in the Settings menu.
          </p>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto h-[100dvh] flex flex-col p-6">
      <header className="flex items-center justify-between mb-8">
        <button
          onClick={onBack}
          className="p-2 hover:bg-zinc-200 rounded-full transition-colors -ml-2"
        >
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold">How to Play</h2>
        <div className="w-10" /> {/* Spacer */}
      </header>

      <div className="flex-1 flex flex-col">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                idx <= currentStep ? 'bg-zinc-900' : 'bg-zinc-200'
              }`}
            />
          ))}
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-zinc-50 rounded-2xl">
              {steps[currentStep].icon}
            </div>
            <h3 className="text-xl font-bold">{steps[currentStep].title}</h3>
          </div>

          <p className="text-zinc-600 leading-relaxed mb-8">
            {steps[currentStep].content}
          </p>

          <div className="mt-auto mb-8 flex justify-center">
            {steps[currentStep].board}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex-1 py-4 rounded-2xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
          >
            Previous
          </button>
          
          {currentStep === steps.length - 1 ? (
            <button
              onClick={onBack}
              className="flex-1 py-4 rounded-2xl font-semibold transition-colors bg-zinc-900 text-white hover:bg-zinc-800"
            >
              Finish
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="flex-1 py-4 rounded-2xl font-semibold transition-colors bg-zinc-900 text-white hover:bg-zinc-800"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
