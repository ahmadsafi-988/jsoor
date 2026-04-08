import { useState, useEffect } from "react";
import { Mic, MicOff, Video, VideoOff, X, Send, Sparkles, ArrowLeft } from "lucide-react";
import { Link } from "react-router";

export function InterviewSimulator() {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [message, setMessage] = useState("");
  const [transcript, setTranscript] = useState<Array<{ role: string; text: string; time: string }>>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");

  const aiQuestions = [
    "Tell me about yourself and your background in computer science.",
    "What interests you most about this position and our company?",
    "Can you describe a challenging project you've worked on and how you overcame obstacles?",
    "How do you stay updated with the latest technologies and industry trends?",
    "Describe a time when you had to work in a team. What was your role?",
    "What are your greatest strengths and how do they apply to this role?",
    "Where do you see yourself in 5 years?",
    "Do you have any questions for me about the role or company?",
  ];

  useEffect(() => {
    if (isInterviewActive && transcript.length === 0) {
      // Start with initial greeting
      setTimeout(() => {
        const greeting = "Hello! Welcome to your AI interview simulation. I'm here to help you practice your interview skills. Let's begin. " + aiQuestions[0];
        setCurrentQuestion(aiQuestions[0]);
        setTranscript([
          {
            role: "AI Interviewer",
            text: greeting,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }, 1000);
    }
  }, [isInterviewActive]);

  const startInterview = () => {
    setIsInterviewActive(true);
    setTranscript([]);
  };

  const endInterview = () => {
    setIsInterviewActive(false);
    setCurrentQuestion("");
  };

  const handleSendMessage = () => {
    if (!message.trim()) return;

    const newEntry = {
      role: "You",
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTranscript([...transcript, newEntry]);

    // Simulate AI response after user answers
    setTimeout(() => {
      const nextQuestionIndex = Math.floor(transcript.filter(t => t.role === "AI Interviewer").length / 2);
      if (nextQuestionIndex < aiQuestions.length) {
        const nextQuestion = aiQuestions[nextQuestionIndex];
        setCurrentQuestion(nextQuestion);
        setTranscript(prev => [
          ...prev,
          {
            role: "AI Interviewer",
            text: nextQuestion,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      } else {
        setCurrentQuestion("Thank you for completing the interview simulation! You did great.");
        setTranscript(prev => [
          ...prev,
          {
            role: "AI Interviewer",
            text: "Thank you for completing the interview simulation! You did great. You can review the transcript and see your performance analysis.",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    }, 2000);

    setMessage("");
  };

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}>
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" style={{ color: '#312E81' }} />
          </Link>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#8B5CF6' }}>
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl" style={{ color: '#312E81' }}>
              AI Interview Simulator
            </h1>
            <p className="text-sm text-muted-foreground">
              Practice your interview skills with AI-powered feedback
            </p>
          </div>
        </div>
        {isInterviewActive && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-sm" style={{ color: '#312E81' }}>Recording</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Feed Area */}
        <div className="flex-1 p-6">
          <div className="h-full bg-gray-900 rounded-2xl overflow-hidden relative">
            {!isInterviewActive ? (
              // Start Screen
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-6 px-6">
                  <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: '#8B5CF6' }}>
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl text-white mb-3">
                      Ready to Practice?
                    </h2>
                    <p className="text-gray-400 text-lg max-w-md mx-auto">
                      Start your AI-powered interview simulation. Get real-time feedback and improve your skills.
                    </p>
                  </div>
                  <button
                    onClick={startInterview}
                    className="px-8 py-4 rounded-lg text-white transition-all hover:shadow-xl text-lg"
                    style={{ backgroundColor: '#06B6D4' }}
                  >
                    Start Interview
                  </button>
                </div>
              </div>
            ) : (
              // Active Interview Screen
              <>
                {/* Video Placeholder */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {isCameraOn ? (
                    <div className="relative w-full h-full bg-gradient-to-br from-gray-800 to-gray-900">
                      {/* Simulated Video Feed */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-32 h-32 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#312E81' }}>
                            <Video className="w-16 h-16 text-white" />
                          </div>
                          <p className="text-white text-lg">Your Video Feed</p>
                          <p className="text-gray-400 text-sm">Camera is active</p>
                        </div>
                      </div>
                      {/* AI Interviewer Badge */}
                      <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#8B5CF6' }}>
                            <Sparkles className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-medium">AI Interviewer</p>
                            <p className="text-gray-300 text-sm">Listening...</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <VideoOff className="w-24 h-24 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 text-lg">Camera is off</p>
                    </div>
                  )}
                </div>

                {/* Current Question Overlay */}
                {currentQuestion && (
                  <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-11/12 max-w-3xl">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border shadow-xl" style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#8B5CF6' }}>
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm mb-1" style={{ color: '#8B5CF6' }}>Current Question:</p>
                          <p className="text-lg" style={{ color: '#312E81' }}>{currentQuestion}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Chat Transcript Panel */}
        <div className="w-96 bg-white border-l flex flex-col" style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}>
          {/* Chat Header */}
          <div className="p-4 border-b" style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}>
            <h3 className="text-lg" style={{ color: '#312E81' }}>
              Interview Transcript
            </h3>
            <p className="text-sm text-muted-foreground">
              {transcript.length > 0 ? `${transcript.length} messages` : 'Conversation will appear here'}
            </p>
          </div>

          {/* Transcript Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {transcript.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#EEF2FF' }}>
                  <Sparkles className="w-8 h-8" style={{ color: '#8B5CF6' }} />
                </div>
                <p className="text-muted-foreground">
                  Start the interview to begin
                </p>
              </div>
            ) : (
              transcript.map((entry, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${entry.role === "You" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      backgroundColor: entry.role === "AI Interviewer" ? '#8B5CF6' : '#06B6D4',
                    }}
                  >
                    {entry.role === "AI Interviewer" ? (
                      <Sparkles className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-white text-sm">Y</span>
                    )}
                  </div>
                  <div className={`flex-1 ${entry.role === "You" ? "text-right" : ""}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium" style={{ color: '#312E81' }}>
                        {entry.role}
                      </span>
                      <span className="text-xs text-muted-foreground">{entry.time}</span>
                    </div>
                    <div
                      className="inline-block px-4 py-2 rounded-lg text-sm"
                      style={{
                        backgroundColor: entry.role === "AI Interviewer" ? '#EEF2FF' : '#E0F2FE',
                        color: '#1E1B4B',
                      }}
                    >
                      {entry.text}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Message Input */}
          {isInterviewActive && (
            <div className="p-4 border-t" style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your answer..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-all"
                  style={{ borderColor: 'rgba(49, 46, 129, 0.2)' }}
                />
                <button
                  onClick={handleSendMessage}
                  className="p-2 rounded-lg text-white transition-all hover:shadow-lg"
                  style={{ backgroundColor: '#06B6D4' }}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar */}
      {isInterviewActive && (
        <div className="bg-white border-t px-6 py-4" style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}>
          <div className="flex items-center justify-center gap-4">
            {/* Microphone Toggle */}
            <button
              onClick={() => setIsMicOn(!isMicOn)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:shadow-lg ${
                isMicOn ? 'bg-gray-100' : 'bg-red-500'
              }`}
            >
              {isMicOn ? (
                <Mic className="w-6 h-6" style={{ color: '#312E81' }} />
              ) : (
                <MicOff className="w-6 h-6 text-white" />
              )}
            </button>

            {/* Camera Toggle */}
            <button
              onClick={() => setIsCameraOn(!isCameraOn)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all hover:shadow-lg ${
                isCameraOn ? 'bg-gray-100' : 'bg-red-500'
              }`}
            >
              {isCameraOn ? (
                <Video className="w-6 h-6" style={{ color: '#312E81' }} />
              ) : (
                <VideoOff className="w-6 h-6 text-white" />
              )}
            </button>

            {/* End Interview */}
            <button
              onClick={endInterview}
              className="px-6 py-3 rounded-lg bg-red-500 text-white flex items-center gap-2 transition-all hover:shadow-lg hover:bg-red-600"
            >
              <X className="w-5 h-5" />
              End Simulation
            </button>
          </div>
          <div className="text-center mt-3">
            <p className="text-sm text-muted-foreground">
              {isMicOn ? "🎤 Microphone active" : "🎤 Microphone muted"} • {isCameraOn ? "📹 Camera on" : "📹 Camera off"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}