import { useState } from "react";
import { Pencil, Mic, Video, GitBranch, FileText, BookOpen, HelpCircle, BarChart3, Presentation, Table, Plus, MoreVertical, Loader2, Play, Pause } from "lucide-react";
import { documentsApi } from "@/lib/api";
import type { Document } from "@/types/api";

interface StudioPanelProps {
  documents: Document[];
}

const StudioPanel = ({ documents = [] }: StudioPanelProps) => {
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

  const handleGeneratePodcast = async (doc: Document) => {
    try {
      setGeneratingId(doc.id);
      const response = await documentsApi.generatePodcast(doc.id);

      if (response.data.audio_url) {
        // Play the audio
        if (audioPlayer) {
          audioPlayer.pause();
        }

        const audio = new Audio(response.data.audio_url);
        audio.onended = () => {
          setPlayingId(null);
          setAudioPlayer(null);
        };

        setAudioUrl(response.data.audio_url);
        setAudioPlayer(audio);
        setPlayingId(doc.id);

        try {
          await audio.play();
        } catch (e) {
          console.error("Audio playback failed:", e);
        }
      }
    } catch (error) {
      console.error("Failed to generate podcast:", error);
      alert("Failed to generate podcast. Please try again.");
    } finally {
      setGeneratingId(null);
    }
  };

  const handlePlayPause = (docId: number) => {
    if (playingId === docId && audioPlayer) {
      if (audioPlayer.paused) {
        audioPlayer.play();
        setPlayingId(docId);
      } else {
        audioPlayer.pause();
        setPlayingId(null);
      }
    } else if (audioUrl && docId === playingId) {
      // Resume if same doc
      if (audioPlayer) audioPlayer.play();
    }
  };

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

  const languages = ["हिन्दी", "বাংলা", "ગુજરાતી", "ಕನ್ನಡ", "മലയാളം", "मराठी", "ਪੰਜਾਬੀ", "தமிழ்", "తెలుగు"];

  return (
    <div className="w-80 flex-shrink-0 flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">Studio</h2>
          <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
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

      {/* Notes List (Documents) */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {documents.map((doc) => (
          <div key={doc.id} className="source-item group">
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">{doc.title}</p>
              <p className="text-xs text-muted-foreground">
                {doc.word_count} words · {new Date(doc.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-1 opacity-100">
              {generatingId === doc.id ? (
                <div className="p-1 rounded">
                  <Loader2 className="w-3.5 h-3.5 text-notebook-teal animate-spin" />
                </div>
              ) : playingId === doc.id ? (
                <button
                  onClick={() => handlePlayPause(doc.id)}
                  className="p-1 rounded hover:bg-notebook-active transition-colors text-notebook-teal"
                >
                  <Pause className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  onClick={() => handleGeneratePodcast(doc)}
                  className="p-1 rounded hover:bg-notebook-active transition-colors group-hover:block hidden"
                  title="Generate Audio Overview"
                >
                  <Mic className="w-3.5 h-3.5 text-muted-foreground hover:text-notebook-teal" />
                </button>
              )}
            </div>


            <button className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-notebook-active transition-all">
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        ))}
        {documents.length === 0 && (
          <div className="text-center p-4 text-muted-foreground text-sm">
            No documents available. Upload a document to generate an overview.
          </div>
        )}
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
