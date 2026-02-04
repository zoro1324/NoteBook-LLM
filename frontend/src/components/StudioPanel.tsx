import { Pencil, Mic, Video, GitBranch, FileText, BookOpen, HelpCircle, BarChart3, Presentation, Table, Plus, MoreVertical } from "lucide-react";

const StudioPanel = () => {
  const tools = [
    { icon: <Mic className="w-5 h-5" />, label: "Audio Overview", hasEdit: true },
    { icon: <Video className="w-5 h-5" />, label: "Video Overview", hasEdit: false },
    { icon: <GitBranch className="w-5 h-5" />, label: "Mind Map", hasEdit: false },
    { icon: <FileText className="w-5 h-5" />, label: "Reports", hasEdit: false },
    { icon: <BookOpen className="w-5 h-5" />, label: "Flashcards", hasEdit: true },
    { icon: <HelpCircle className="w-5 h-5" />, label: "Quiz", hasEdit: true },
    { icon: <BarChart3 className="w-5 h-5" />, label: "Infographic", hasEdit: true },
    { icon: <Presentation className="w-5 h-5" />, label: "Slide deck", hasEdit: true },
    { icon: <Table className="w-5 h-5" />, label: "Data table", hasEdit: true },
  ];

  const notes = [
    { id: "1", icon: <Mic className="w-4 h-4" />, title: "How DMA Moves Data...", source: "1 source", time: "7h ago", hasAudio: true },
    { id: "2", icon: <FileText className="w-4 h-4" />, title: "Architectural Blueprint of Direct...", source: "1 source", time: "7h ago" },
    { id: "3", icon: <FileText className="w-4 h-4" />, title: "Direct Memory Access Controller...", source: "1 source", time: "82d ago" },
    { id: "4", icon: <FileText className="w-4 h-4" />, title: "Direct Memory Access Controller...", source: "1 source", time: "82d ago" },
  ];

  const languages = ["हिन्दी", "বাংলা", "ગુજરાતી", "ಕನ್ನಡ", "മലയാളം", "मराठी", "ਪੰਜਾਬੀ", "தமிழ்", "తెలుగు"];

  return (
    <div className="w-80 flex-shrink-0 flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">Studio</h2>
          <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
        </div>

        {/* Audio Overview Languages */}
        <div className="bg-secondary/50 rounded-lg p-3 mb-4">
          <p className="text-sm text-notebook-teal">
            Create an Audio Overview in: {languages.join(", ")}
          </p>
        </div>

        {/* Studio Tools Grid */}
        <div className="grid grid-cols-2 gap-2">
          {tools.map((tool, index) => (
            <div
              key={index}
              className="studio-tool group relative"
            >
              <span className="text-muted-foreground group-hover:text-foreground transition-colors">
                {tool.icon}
              </span>
              <span className="text-sm text-foreground">{tool.label}</span>
              {tool.hasEdit && (
                <button className="absolute right-2 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-notebook-active transition-all">
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {notes.map((note) => (
          <div key={note.id} className="source-item group">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              {note.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">{note.title}</p>
              <p className="text-xs text-muted-foreground">{note.source} · {note.time}</p>
            </div>
            {note.hasAudio && (
              <div className="flex items-center gap-1">
                <button className="p-1 rounded hover:bg-notebook-active transition-colors">
                  <Mic className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <button className="p-1 rounded hover:bg-notebook-active transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-muted-foreground">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
              </div>
            )}
            <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-notebook-active transition-all">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        ))}
      </div>

      {/* Add Note Button */}
      <div className="p-4 border-t border-border">
        <button className="w-full notebook-btn bg-background border border-border text-foreground hover:bg-secondary justify-center">
          <Plus className="w-4 h-4" />
          Add note
        </button>
      </div>
    </div>
  );
};

export default StudioPanel;
