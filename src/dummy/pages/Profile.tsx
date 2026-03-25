import { User, Mail, Phone, MapPin, Briefcase, Calendar, Edit, Camera } from "lucide-react";

export function Profile() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl mb-6" style={{ color: '#312E81' }}>
        My Profile
      </h1>

      {/* Profile Header Card */}
      <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}>
        {/* Cover Image */}
        <div className="h-32 relative" style={{ backgroundColor: '#312E81' }}>
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #312E81 0%, #8B5CF6 100%)' }} />
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16 mb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-xl border-4 border-white overflow-hidden" style={{ backgroundColor: '#EEF2FF' }}>
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-16 h-16" style={{ color: '#312E81' }} />
                </div>
              </div>
              <button className="absolute bottom-2 right-2 p-2 rounded-lg bg-white shadow-lg border" style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}>
                <Camera className="w-4 h-4" style={{ color: '#312E81' }} />
              </button>
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl mb-1" style={{ color: '#312E81' }}>
                    John Doe
                  </h2>
                  <p className="text-muted-foreground mb-2">Computer Science Student</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>San Francisco, CA</span>
                  </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-secondary transition-colors" style={{ borderColor: 'rgba(49, 46, 129, 0.2)', color: '#312E81' }}>
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t" style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}>
            <div className="text-center">
              <div className="text-2xl mb-1" style={{ color: '#06B6D4' }}>24</div>
              <div className="text-sm text-muted-foreground">Job Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1" style={{ color: '#8B5CF6' }}>12</div>
              <div className="text-sm text-muted-foreground">Applications</div>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-1" style={{ color: '#312E81' }}>5</div>
              <div className="text-sm text-muted-foreground">Interviews</div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-xl border p-6" style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}>
        <h3 className="text-xl mb-4" style={{ color: '#312E81' }}>
          Contact Information
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EEF2FF' }}>
              <Mail className="w-5 h-5" style={{ color: '#312E81' }} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-sm" style={{ color: '#312E81' }}>john.doe@email.com</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EEF2FF' }}>
              <Phone className="w-5 h-5" style={{ color: '#312E81' }} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="text-sm" style={{ color: '#312E81' }}>+1 (555) 123-4567</p>
            </div>
          </div>
        </div>
      </div>

      {/* Education */}
      <div className="bg-white rounded-xl border p-6" style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}>
        <h3 className="text-xl mb-4" style={{ color: '#312E81' }}>
          Education
        </h3>
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EEF2FF' }}>
              <Briefcase className="w-6 h-6" style={{ color: '#312E81' }} />
            </div>
            <div className="flex-1">
              <h4 className="mb-1" style={{ color: '#312E81' }}>Bachelor of Science in Computer Science</h4>
              <p className="text-sm text-muted-foreground mb-2">Stanford University</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>2022 - 2026</span>
                <span>•</span>
                <span className="text-primary" style={{ color: '#06B6D4' }}>GPA: 3.8/4.0</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      <div className="bg-white rounded-xl border p-6" style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}>
        <h3 className="text-xl mb-4" style={{ color: '#312E81' }}>
          Skills
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            "JavaScript", "React", "Node.js", "Python", "TypeScript",
            "SQL", "Git", "AWS", "Docker", "MongoDB",
            "REST APIs", "GraphQL", "TailwindCSS"
          ].map((skill, index) => (
            <span
              key={index}
              className="px-4 py-2 rounded-lg border"
              style={{
                borderColor: 'rgba(49, 46, 129, 0.2)',
                color: '#312E81',
                backgroundColor: '#EEF2FF'
              }}
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-xl border p-6" style={{ borderColor: 'rgba(49, 46, 129, 0.1)' }}>
        <h3 className="text-xl mb-4" style={{ color: '#312E81' }}>
          About Me
        </h3>
        <p className="text-muted-foreground leading-relaxed">
          I'm a passionate Computer Science student with a strong foundation in full-stack development.
          I love building scalable web applications and solving complex problems. Currently seeking
          internship opportunities where I can contribute to meaningful projects and grow as a developer.
          In my free time, I enjoy contributing to open-source projects and learning about new technologies.
        </p>
      </div>
    </div>
  );
}
