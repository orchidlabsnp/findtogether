import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, HelpCircle } from "lucide-react";

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
}

interface Question {
  id: number;
  category: 'stranger_danger' | 'online_safety' | 'personal_safety' | 'emergency' | 'cyberbullying';
  difficulty: 'easy' | 'medium' | 'hard';
  text: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  tip: string;
}

const questions: Question[] = [
  // Stranger Danger
  {
    id: 1,
    category: 'stranger_danger',
    difficulty: 'easy',
    text: "What should you do if a stranger asks you to go with them?",
    options: [
      "Go with them if they seem nice",
      "Say 'NO' loudly and find a trusted adult",
      "Keep it a secret",
      "Follow them to see where they go"
    ],
    correctAnswer: 1,
    explanation: "Always say NO to strangers who ask you to go somewhere, even if they seem friendly. Find a trusted adult immediately and tell them what happened.",
    tip: "Remember the 'Safe Adult Network' - these are people you trust and can go to for help, like parents, teachers, or trusted family friends."
  },
  {
    id: 2,
    category: 'stranger_danger',
    difficulty: 'medium',
    text: "What should you do if someone you don't know offers you candy or gifts?",
    options: [
      "Accept it if it looks nice",
      "Take it and tell your parents later",
      "Say 'No thank you' and walk away immediately",
      "Share it with your friends"
    ],
    correctAnswer: 2,
    explanation: "Never accept gifts, candy, or anything else from strangers. This could be a trick to harm you.",
    tip: "Use the 'Three Steps Rule': Say no, walk away, and tell a trusted adult."
  },
  // Online Safety
  {
    id: 3,
    category: 'online_safety',
    difficulty: 'medium',
    text: "What should you do if someone online asks for your personal information?",
    options: [
      "Share it if they seem friendly",
      "Never share personal information and tell a trusted adult",
      "Only share your first name",
      "Ask them for their information first"
    ],
    correctAnswer: 1,
    explanation: "Never share personal information online, including your name, address, school, or photos. People online may not be who they say they are.",
    tip: "Keep your personal information private online - think of it like a special secret that only your family knows."
  },
  // Personal Safety
  {
    id: 4,
    category: 'personal_safety',
    difficulty: 'easy',
    text: "Who are safe adults you can talk to if you feel scared or unsafe?",
    options: [
      "Only strangers",
      "Parents, teachers, police officers, or trusted family friends",
      "People you meet online",
      "Nobody"
    ],
    correctAnswer: 1,
    explanation: "Safe adults are people you know and trust, like parents, teachers, and trusted family friends. They can help you when you feel unsafe.",
    tip: "Create a list of trusted adults with your parents and keep their contact information handy."
  },
  // Emergency Situations
  {
    id: 5,
    category: 'emergency',
    difficulty: 'medium',
    text: "What should you do if you get lost in a public place?",
    options: [
      "Go looking for your family alone",
      "Leave with someone who offers to help",
      "Stay where you are and ask a store employee or police officer for help",
      "Hide somewhere quiet"
    ],
    correctAnswer: 2,
    explanation: "If you're lost, stay where you are. Find a store employee or police officer - they are trained to help lost children.",
    tip: "Remember the 'Stay Put' rule - you're more likely to be found if you stay in one place."
  },
  // Cyberbullying
  {
    id: 6,
    category: 'cyberbullying',
    difficulty: 'hard',
    text: "What should you do if someone is being mean to you or others online?",
    options: [
      "Be mean back to them",
      "Keep it to yourself",
      "Delete all your social media",
      "Don't respond, save evidence, and tell a trusted adult"
    ],
    correctAnswer: 3,
    explanation: "Never respond to bullying. Save screenshots or evidence and tell a trusted adult who can help you handle the situation properly.",
    tip: "Use the 'Stop, Block, and Tell' method: Stop responding, block the bully, and tell a trusted adult."
  },
  // More Emergency Scenarios
  {
    id: 7,
    category: 'emergency',
    difficulty: 'hard',
    text: "If there's an emergency and you need to call for help, what number should you dial?",
    options: [
      "Your friend's number",
      "911",
      "A random number",
      "Your school's number"
    ],
    correctAnswer: 1,
    explanation: "In any emergency, dial 911. This connects you to police, fire, or medical help. Only use it for real emergencies.",
    tip: "Practice saying your name, address, and describing emergency situations with your parents."
  },
  // Online Privacy
  {
    id: 8,
    category: 'online_safety',
    difficulty: 'hard',
    text: "Which of these passwords is the most secure?",
    options: [
      "password123",
      "your birthday",
      "K9*mP#2$vL9q",
      "your pet's name"
    ],
    correctAnswer: 2,
    explanation: "Strong passwords use a mix of letters, numbers, and special characters. Never use personal information in passwords.",
    tip: "Create strong passwords by thinking of a sentence and using the first letter of each word, plus numbers and symbols."
  }
];

export default function SafetyGame() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<Record<Question['category'], number>>({
    stranger_danger: 0,
    online_safety: 0,
    personal_safety: 0,
    emergency: 0,
    cyberbullying: 0
  });
  const [showResult, setShowResult] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  
  const filteredQuestions = questions.filter(q => q.difficulty === difficulty);
  const currentQuestionData = filteredQuestions[currentQuestion];
  
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const progress = (currentQuestion / filteredQuestions.length) * 100;

  const handleAnswer = (answerIndex: number) => {
    if (isAnswered) return;
    
    setSelectedAnswer(answerIndex);
    setIsAnswered(true);
    setShowExplanation(true);
    
    if (answerIndex === currentQuestionData.correctAnswer) {
      setScores(prev => ({
        ...prev,
        [currentQuestionData.category]: prev[currentQuestionData.category] + 1
      }));
    }
  };

  const handleNext = () => {
    if (currentQuestion < filteredQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setShowExplanation(false);
    } else {
      setShowResult(true);
    }
    setSelectedAnswer(null);
    setIsAnswered(false);
  };

  const resetGame = (newDifficulty?: 'easy' | 'medium' | 'hard') => {
    setCurrentQuestion(0);
    setScores({
      stranger_danger: 0,
      online_safety: 0,
      personal_safety: 0,
      emergency: 0,
      cyberbullying: 0
    });
    setShowResult(false);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setShowExplanation(false);
    if (newDifficulty) {
      setDifficulty(newDifficulty);
    }
  };

  const getCategoryIcon = (category: Question['category']) => {
    switch (category) {
      case 'stranger_danger':
        return <AlertCircle className="h-5 w-5" />;
      case 'online_safety':
        return <HelpCircle className="h-5 w-5" />;
      case 'personal_safety':
        return <CheckCircle2 className="h-5 w-5" />;
      case 'emergency':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'cyberbullying':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">
              Safety Learning Game
            </h1>
            <p className="text-gray-600 mt-2">
              Learn about personal safety through this fun and interactive game!
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={difficulty === 'easy' ? 'default' : 'outline'}
              onClick={() => resetGame('easy')}
            >
              Easy
            </Button>
            <Button
              variant={difficulty === 'medium' ? 'default' : 'outline'}
              onClick={() => resetGame('medium')}
            >
              Medium
            </Button>
            <Button
              variant={difficulty === 'hard' ? 'default' : 'outline'}
              onClick={() => resetGame('hard')}
            >
              Hard
            </Button>
          </div>
        </div>

        {!showResult ? (
          <Card>
            <CardContent className="p-6">
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(currentQuestionData.category)}
                    <Badge variant="outline" className="capitalize">
                      {currentQuestionData.category.replace('_', ' ')}
                    </Badge>
                    <Badge 
                      variant={
                        currentQuestionData.difficulty === 'easy' 
                          ? 'default' 
                          : currentQuestionData.difficulty === 'medium'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {currentQuestionData.difficulty}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    Question {currentQuestion + 1} of {filteredQuestions.length}
                  </p>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <motion.div
                    className="bg-primary h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>

                <h2 className="text-xl font-semibold mb-4">
                  {currentQuestionData.text}
                </h2>
              </div>

              <div className="space-y-3">
                {currentQuestionData.options.map((option, index) => (
                  <Button
                    key={index}
                    variant={
                      isAnswered
                        ? index === currentQuestionData.correctAnswer
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
                    disabled={isAnswered}
                  >
                    {option}
                    {isAnswered && index === currentQuestionData.correctAnswer && (
                      <CheckCircle2 className="h-4 w-4 absolute right-4" />
                    )}
                    {isAnswered && index === selectedAnswer && index !== currentQuestionData.correctAnswer && (
                      <AlertCircle className="h-4 w-4 absolute right-4" />
                    )}
                  </Button>
                ))}
              </div>

              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-muted rounded-lg"
                >
                  <h4 className="font-semibold mb-2">Explanation:</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {currentQuestionData.explanation}
                  </p>
                  <div className="flex items-start gap-2">
                    <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-blue-600">
                      <span className="font-semibold">Pro Tip:</span>{" "}
                      {currentQuestionData.tip}
                    </p>
                  </div>
                </motion.div>
              )}

              {isAnswered && (
                <div className="mt-6">
                  <Button onClick={handleNext} className="w-full">
                    {currentQuestion === filteredQuestions.length - 1 ? "See Results" : "Next Question"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-6 text-center">Game Complete!</h2>
              
              <div className="grid gap-4 mb-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary mb-2">
                    {totalScore} / {filteredQuestions.length}
                  </p>
                  <p className="text-sm text-gray-500">Total Score</p>
                </div>

                <div className="grid gap-2">
                  {Object.entries(scores).map(([category, score]) => (
                    <div key={category} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(category as Question['category'])}
                        <span className="capitalize">{category.replace('_', ' ')}</span>
                      </div>
                      <Badge variant="outline">{score} correct</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => resetGame(difficulty)} className="flex-1">
                  Try Again
                </Button>
                <Button 
                  onClick={() => resetGame(
                    difficulty === 'easy' ? 'medium' : 
                    difficulty === 'medium' ? 'hard' : 'easy'
                  )} 
                  className="flex-1"
                >
                  {difficulty === 'hard' ? 'Try Easy Mode' : 'Try Next Level'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 bg-blue-50 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h3 className="font-semibold mb-2">Remember</h3>
              <p className="text-sm text-gray-600">
                Your safety is important! Always trust your instincts and talk to a trusted adult if you feel uncomfortable or unsafe in any situation. Keep practicing these safety rules and share what you've learned with friends and family.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
