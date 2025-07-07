import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

function Navbar() {
  return (
    <header className="w-full px-6 py-4 bg-[#0f0f0f] border-b border-[#1e1e1e] shadow-md text-center select-none">
      <h1 className="text-2xl font-bold text-white tracking-wide">AI Interview Assistant</h1>
    </header>
  );
}

function formatAnswerPoints(answer) {
  const lines = answer.split("\n").map((line) => line.trim()).filter(Boolean);
  const pointsPattern = /^(\d+\.|-)/;
  const isPoints = lines.every((line) => pointsPattern.test(line));

  if (isPoints) {
    return (
      <ol className="list-decimal list-inside space-y-1 text-gray-200">
        {lines.map((line, i) => (
          <li key={i}>{line.replace(/^(\d+\.|-)\s*/, "")}</li>
        ))}
      </ol>
    );
  }

  return <p className="whitespace-pre-wrap text-gray-200">{answer}</p>;
}

function QAItem({ index, question, answer }) {
  return (
    <Card className="mb-4 bg-[#1c1c1c] border border-[#2a2a2a] text-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-purple-400">Question #{index + 1}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-2 font-medium text-gray-300">{question}</p>
        <Separator className="my-2 bg-gray-600" />
        <div>{formatAnswerPoints(answer)}</div>
      </CardContent>
    </Card>
  );
}

export default function InterviewAssistant() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [listening, setListening] = useState(false);
  const [qaList, setQaList] = useState([]);

  const handleStartListening = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
      getAnswer(transcript);
      setListening(false);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      alert("Speech recognition error: " + event.error);
      setListening(false);
    };

    recognition.onend = () => {
      if (listening) setListening(false);
    };
  };

  const getAnswer = async (questionText) => {
    try {
      
      const response = await fetch("https://intervuiassistant-backend.onrender.com/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionText }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      const data = await response.json();
      const newAnswer = data.answer || "No answer returned from server.";

      setAnswer(newAnswer);
      setQaList((prev) => [{ question: questionText, answer: newAnswer }, ...prev]);
    } catch (error) {
      console.error("Error fetching answer:", error);
      setAnswer("Failed to get answer. Please try again.");
    }
  };

  const clearAll = () => {
    setQuestion("");
    setAnswer("");
    setQaList([]);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      <Navbar />

      <main className="px-6 py-8 max-w-screen-xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
          {/* Left Column */}
          <div>
            <div className="flex gap-4 mb-6">
              <Button
                onClick={handleStartListening}
                disabled={listening}
                className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
              >
                {listening ? "Listening..." : " Start Listening"}
              </Button>
              <Button
                onClick={clearAll}
                variant="destructive"
                className="text-white font-bold"
              >
                 Clear All
              </Button>
            </div>

            <Card className="mb-8 bg-[#1e1e1e] border border-[#2a2a2a]">
              <CardHeader>
                <CardTitle className="text-lg text-primary">Latest Question</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="italic text-gray-400">{question || "..."}</p>
              </CardContent>
            </Card>

            <Card className="mb-10 bg-[#1e1e1e] border border-[#2a2a2a]">
              <CardHeader>
                <CardTitle className="text-lg text-primary">AI Answer</CardTitle>
              </CardHeader>
              <CardContent>{formatAnswerPoints(answer || "...")}</CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div>
            <h3 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2 text-purple-400">
              Recent Q&A
            </h3>

            <ScrollArea className="max-h-[80vh] pr-2">
              {qaList.length === 0 ? (
                <p className="italic text-gray-500">No questions asked yet.</p>
              ) : (
                qaList.map(({ question, answer }, idx) => (
                  <QAItem key={idx} index={idx} question={question} answer={answer} />
                ))
              )}
            </ScrollArea>
          </div>
        </div>
      </main>
    </div>
  );
}
