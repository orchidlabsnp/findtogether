import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
}

const questions: Question[] = [
  {
    id: 1,
    text: "What should you do if a stranger asks you to go with them?",
    options: [
      "Go with them if they seem nice",
      "Say 'NO' loudly and find a trusted adult",
      "Keep it a secret",
      "Follow them to see where they go"
    ],
    correctAnswer: 1
  },
  {
    id: 2,
    text: "Who are safe adults you can talk to if you feel scared or unsafe?",
    options: [
      "Only strangers",
      "Parents, teachers, police officers, or trusted family friends",
      "People you meet online",
      "Nobody"
    ],
    correctAnswer: 1
  },
  {
    id: 3,
    text: "What should you do if you get lost in a public place?",
    options: [
      "Go looking for your family alone",
      "Leave with someone who offers to help",
      "Stay where you are and ask a store employee or police officer for help",
      "Hide somewhere quiet"
    ],
    correctAnswer: 2
  }
];

export default function SafetyGame() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const handleAnswer = (answerIndex: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    
    if (answerIndex === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResult(true);
    }
    setSelectedAnswer(null);
    setIsAnswered(false);
  };

  const resetGame = () => {
    setCurrentQuestion(0);
    setScore(0);
    setShowResult(false);
    setSelectedAnswer(null);
    setIsAnswered(false);
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Safety Learning Game
        </h1>
        <p className="text-gray-600 mb-8">
          Learn about personal safety through this fun and interactive game!
        </p>

        {!showResult ? (
          <Card>
            <CardContent className="p-6">
              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">
                  Question {currentQuestion + 1} of {questions.length}
                </p>
                <h2 className="text-xl font-semibold mb-4">
                  {questions[currentQuestion].text}
                </h2>
              </div>

              <div className="space-y-3">
                {questions[currentQuestion].options.map((option, index) => (
                  <Button
                    key={index}
                    variant={
                      isAnswered
                        ? index === questions[currentQuestion].correctAnswer
                          ? "default"
                          : index === selectedAnswer
                          ? "destructive"
                          : "outline"
                        : selectedAnswer === index
                        ? "default"
                        : "outline"
                    }
                    className="w-full justify-start text-left relative"
                    onClick={() => handleAnswer(index)}
                  >
                    {option}
                    {isAnswered && index === questions[currentQuestion].correctAnswer && (
                      <CheckCircle2 className="h-4 w-4 absolute right-4" />
                    )}
                    {isAnswered && index === selectedAnswer && index !== questions[currentQuestion].correctAnswer && (
                      <AlertCircle className="h-4 w-4 absolute right-4" />
                    )}
                  </Button>
                ))}
              </div>

              {isAnswered && (
                <div className="mt-6">
                  <Button onClick={handleNext} className="w-full">
                    {currentQuestion === questions.length - 1 ? "See Results" : "Next Question"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-2xl font-bold mb-4">Game Complete!</h2>
              <p className="text-xl mb-6">
                You scored {score} out of {questions.length}!
              </p>
              <Button onClick={resetGame} className="w-full">
                Play Again
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-2">Safety Tip</h3>
              <p className="text-sm text-gray-600">
                Remember, your safety is important! Always trust your instincts and talk to a trusted adult if you feel uncomfortable or unsafe in any situation.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
