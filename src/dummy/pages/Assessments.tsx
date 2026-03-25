import { CheckCircle, Clock, PlayCircle, Award, TrendingUp, Video, Sparkles } from "lucide-react";
import { Link } from "react-router";

export function Assessments() {
  const assessments = [
    {
      id: 1,
      title: "JavaScript Fundamentals",
      description: "Test your knowledge of JavaScript basics, ES6+ features, and best practices",
      duration: "45 min",
      questions: 30,
      difficulty: "Intermediate",
      status: "completed",
      score: 92,
      icon: CheckCircle,
      color: "#06B6D4",
    },
    {
      id: 2,
      title: "React & Frontend Development",
      description: "Assess your skills in React, hooks, state management, and component design",
      duration: "60 min",
      questions: 40,
      difficulty: "Advanced",
      status: "completed",
      score: 88,
      icon: CheckCircle,
      color: "#06B6D4",
    },
    {
      id: 3,
      title: "Data Structures & Algorithms",
      description: "Solve coding challenges covering arrays, trees, graphs, and dynamic programming",
      duration: "90 min",
      questions: 15,
      difficulty: "Advanced",
      status: "in-progress",
      score: 0,
      icon: Clock,
      color: "#8B5CF6",
    },
    {
      id: 4,
      title: "System Design Basics",
      description: "Learn and demonstrate understanding of scalability, databases, and architecture",
      duration: "75 min",
      questions: 20,
      difficulty: "Advanced",
      status: "not-started",
      score: 0,
      icon: PlayCircle,
      color: "#312E81",
    },
    {
      id: 5,
      title: "SQL & Database Management",
      description: "Test your SQL query skills, database design, and optimization techniques",
      duration: "45 min",
      questions: 25,
      difficulty: "Intermediate",
      status: "not-started",
      score: 0,
      icon: PlayCircle,
      color: "#312E81",
    },
    {
      id: 6,
      title: "Behavioral & Communication",
      description: "Demonstrate soft skills, problem-solving approach, and team collaboration",
      duration: "30 min",
      questions: 15,
      difficulty: "Beginner",
      status: "not-started",
      score: 0,
      icon: PlayCircle,
      color: "#312E81",
    },
  ];

  const stats = [
    {
      label: "Completed",
      value: "2/6",
      icon: CheckCircle,
      color: "#06B6D4",
    },
    {
      label: "Avg Score",
      value: "90%",
      icon: TrendingUp,
      color: "#8B5CF6",
    },
    {
      label: "Total Time",
      value: "105 min",
      icon: Clock,
      color: "#312E81",
    },
    {
      label: "Skill Level",
      value: "Advanced",
      icon: Award,
      color: "#06B6D4",
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-3 py-1 rounded-full text-xs text-white" style={{ backgroundColor: "#06B6D4" }}>
            Completed
          </span>
        );
      case "in-progress":
        return (
          <span className="px-3 py-1 rounded-full text-xs text-white" style={{ backgroundColor: "#8B5CF6" }}>
            In Progress
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs border" style={{ borderColor: 'rgba(49, 46, 129, 0.2)', color: '#312E81' }}>
            Not Started
          </span>
        );
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "#06B6D4";
      case "Intermediate":
        return "#8B5CF6";
      case "Advanced":
        return "#312E81";
      default:
        return "#312E81";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl" style={{ color: '#312E81' }}>
          Skill Assessments
        </h1>
        <button
          className="px-6 py-3 rounded-lg text-white transition-all hover:shadow-lg"
          style={{ backgroundColor: '#06B6D4' }}
        >
          View Certificates
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-6 border"
              style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: stat.color + '15' }}
                >
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
              </div>
              <div className="text-3xl mb-1" style={{ color: '#312E81' }}>
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Progress Overview */}
      <div className="bg-white rounded-xl p-6 border" style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}>
        <h3 className="text-lg mb-4" style={{ color: '#312E81' }}>
          Overall Progress
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Assessment Completion</span>
            <span style={{ color: '#06B6D4' }}>33% Complete</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: '33%', backgroundColor: '#06B6D4' }}
            />
          </div>
        </div>
      </div>

      {/* Articles CTA */}
      <div className="bg-gradient-to-r from-purple-50 to-cyan-50 rounded-xl p-8 border" style={{ borderColor: 'rgba(139, 92, 246, 0.2)' }}>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#8B5CF6' }}>
            <Video className="w-10 h-10 text-white" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center gap-2 justify-center md:justify-start mb-2">
              <Sparkles className="w-5 h-5" style={{ color: '#8B5CF6' }} />
              <h3 className="text-2xl" style={{ color: '#312E81' }}>
                Ready for Interview Practice?
              </h3>
            </div>
            <p className="text-muted-foreground">
              Test your skills with our AI-powered interview simulator. Get real-time feedback and improve your performance.
            </p>
          </div>
          <Link to="/interview">
            <button
              className="px-8 py-4 rounded-lg text-white transition-all hover:shadow-xl whitespace-nowrap"
              style={{ backgroundColor: '#06B6D4' }}
            >
              Start Practice Interview
            </button>
          </Link>
        </div>
      </div>

      {/* Assessments List */}
      <div className="grid lg:grid-cols-2 gap-6">
        {assessments.map((assessment) => {
          const Icon = assessment.icon;
          return (
            <div
              key={assessment.id}
              className="bg-white rounded-xl border p-6 hover:shadow-xl transition-all duration-300"
              style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: assessment.color + '15' }}
                >
                  <Icon className="w-6 h-6" style={{ color: assessment.color }} />
                </div>
                {getStatusBadge(assessment.status)}
              </div>

              <h3 className="text-xl mb-2" style={{ color: '#312E81' }}>
                {assessment.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {assessment.description}
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{assessment.duration}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>{assessment.questions} questions</span>
                </div>
                <div className="flex items-center gap-1">
                  <span
                    className="px-2 py-0.5 rounded text-xs text-white"
                    style={{ backgroundColor: getDifficultyColor(assessment.difficulty) }}
                  >
                    {assessment.difficulty}
                  </span>
                </div>
              </div>

              {assessment.status === "completed" && (
                <div className="mb-4 p-4 rounded-lg" style={{ backgroundColor: '#EEF2FF' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm" style={{ color: '#312E81' }}>Your Score</span>
                    <span className="text-2xl" style={{ color: '#06B6D4' }}>
                      {assessment.score}%
                    </span>
                  </div>
                </div>
              )}

              <button
                className={`w-full py-3 rounded-lg transition-all ${
                  assessment.status === "completed"
                    ? "border hover:bg-secondary"
                    : "text-white hover:shadow-lg"
                }`}
                style={
                  assessment.status === "completed"
                    ? { borderColor: 'rgba(49, 46, 129, 0.2)', color: '#312E81' }
                    : { backgroundColor: '#06B6D4' }
                }
              >
                {assessment.status === "completed"
                  ? "Review Results"
                  : assessment.status === "in-progress"
                  ? "Continue Assessment"
                  : "Start Assessment"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}