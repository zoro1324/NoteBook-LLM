import { useState, useRef, useEffect } from "react";
import { Mic, Video, GitBranch, FileText, BookOpen, HelpCircle, BarChart3, Presentation, Table, Plus, MoreVertical, Loader2, Play, Pause, X, Check, ArrowRight, RefreshCw } from "lucide-react";
import { notebooksApi } from "@/lib/api";
import type { Document, NotebookGuide } from "@/types/api";

interface StudioPanelProps {
  notebookId: string;
  documents: Document[];
  guides: NotebookGuide[];
}

type PodcastView = 'idle' | 'loading_options' | 'selecting' | 'generating' | 'playing' | 'error';

const StudioPanel = ({ notebookId, documents = [], guides = [] }: StudioPanelProps) => {
  const [view, setView] = useState<PodcastView>('idle');
  const [options, setOptions] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null); // -1 for custom
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize audio on url change
  useEffect(() => {
    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlaying(false);
      audioRef.current = audio;
      setView('playing');
    }
    return () => {
      if (audioRef.current) audioRef.current.pause();
    }
  }, [audioUrl]);

  const fetchOptions = async () => {
    if (documents.length === 0) {
      alert("Please upload documents first.");
      return;
    }
    setView('loading_options');
    setError(null);
    try {
      const response = await notebooksApi.getPodcastOptions(notebookId);
      setOptions(response.data.options);
      setView('selecting');
    } catch (err) {
      console.error(err);
      setError("Failed to generate options.");
      setView('error');
    }
  };

  const generatePodcast = async (instruction: string) => {
    setView('generating');
    setError(null);
    try {
      const response = await notebooksApi.generatePodcast(notebookId, instruction);
      if (response.data.audio_url) {
        setAudioUrl(response.data.audio_url);
        // Autoplay handled by useEffect

        // Optionally refresh parent or wait for user to reload?
        // Ideally we should trigger a refetch of the notebook to get the new guide
        // but for now, the user can just click the new guide after reload.
        // Or we can assume the parent re-renders. 
        // Actually, without a refetch, the guide won't appear in the list immediately.
        // We can add a simple window.location.reload() or callback if needed, but let's stick to simple flow.
      } else {
        throw new Error("No audio URL returned");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate podcast.");
      setView('error');
    }
  };

  const handleOptionSelect = (index: number) => {
    setSelectedOption(index);
  };

  const confirmSelection = () => {
    if (selectedOption === null) return;

    let instruction = "";
    if (selectedOption === -1) {
      if (!customInput.trim()) return;
      instruction = customInput;
    } else {
      instruction = options[selectedOption];
    }

    generatePodcast(instruction);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (audioRef.current.paused) {
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const resetView = () => {
    setAudioUrl(null);
    setOptions([]);
    setSelectedOption(null);
    setCustomInput("");
    setView('idle');
    setError(null);
  };

  const tools = [
    { icon: <Mic className="w-5 h-5" />, label: "Audio Overview", hasEdit: true, action: fetchOptions },
    { icon: <Video className="w-5 h-5" />, label: "Video Overview", hasEdit: false },
    { icon: <GitBranch className="w-5 h-5" />, label: "Mind Map", hasEdit: false },
    { icon: <FileText className="w-5 h-5" />, label: "Reports", hasEdit: false },
    { icon: <BookOpen className="w-5 h-5" />, label: "Flashcards", hasEdit: true },
    { icon: <HelpCircle className="w-5 h-5" />, label: "Quiz", hasEdit: true },
    { icon: <BarChart3 className="w-5 h-5" />, label: "Infographic", hasEdit: true },
    { icon: <Presentation className="w-5 h-5" />, label: "Slide deck", hasEdit: true },
    { icon: <Table className="w-5 h-5" />, label: "Data table", hasEdit: true },
  ];

  return (
    <div className="w-80 flex-shrink-0 flex flex-col h-full bg-background border-l border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">Studio</h2>
        </div>

        {/* Active Podcast Workflow UI */}
        {view !== 'idle' && (
          <div className="mb-4 bg-secondary/30 rounded-lg p-3 border border-border">

            {/* Header with Close */}
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium flex items-center gap-2">
                <Mic className="w-4 h-4 text-notebook-teal" />
                Audio Overview
              </span>
              <button onClick={resetView} className="hover:bg-secondary rounded p-1">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Content based on State */}
            {view === 'loading_options' && (
              <div className="flex flex-col items-center py-4 gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-notebook-teal" />
                <span className="text-xs">Generating themes...</span>
              </div>
            )}

            {view === 'selecting' && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground mb-2">Select a focus for your deep dive:</p>
                {options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleOptionSelect(idx)}
                    className={`w-full text-left p-2 rounded text-sm border transition-all ${selectedOption === idx
                        ? 'bg-notebook-teal/10 border-notebook-teal text-notebook-teal'
                        : 'bg-background border-border hover:border-notebook-teal/50'
                      }`}
                  >
                    {opt}
                  </button>
                ))}

                {/* Custom Option */}
                <div className={`p-2 rounded border transition-all ${selectedOption === -1
                    ? 'bg-notebook-teal/10 border-notebook-teal'
                    : 'bg-background border-border'
                  }`}>
                  <button
                    onClick={() => handleOptionSelect(-1)}
                    className={`text-sm font-medium w-full text-left ${selectedOption === -1 ? 'text-notebook-teal' : 'text-foreground'}`}
                  >
                    Custom Instruction
                  </button>
                  {selectedOption === -1 && (
                    <input
                      type="text"
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="e.g. Focus on technical details..."
                      className="w-full mt-2 bg-background border border-border rounded p-1.5 text-xs focus:ring-1 focus:ring-notebook-teal outline-none"
                    />
                  )}
                </div>

                <button
                  onClick={confirmSelection}
                  disabled={selectedOption === null || (selectedOption === -1 && !customInput.trim())}
                  className="w-full mt-2 bg-notebook-teal text-white py-1.5 rounded text-sm font-medium disabled:opacity-50 hover:bg-notebook-teal/90 transition-colors flex items-center justify-center gap-2"
                >
                  Generate <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {view === 'generating' && (
              <div className="flex flex-col items-center py-4 gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-notebook-teal" />
                <span className="text-xs">Creating your podcast...</span>
                <span className="text-[10px] text-muted-foreground/70 text-center">(This may take 1-2 minutes)</span>
              </div>
            )}

            {view === 'playing' && (
              <div className="flex flex-col items-center gap-3">
                <div className="w-full bg-notebook-teal/10 h-12 rounded flex items-center justify-center animate-pulse">
                  {/* Visualizer placeholder */}
                  <div className="flex gap-1 items-end h-6">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="w-1 bg-notebook-teal animate-bounce" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                </div>
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 bg-notebook-teal rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </button>
                <button onClick={resetView} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> New conversation
                </button>
              </div>
            )}

            {view === 'error' && (
              <div className="flex flex-col items-center py-2 gap-2">
                <span className="text-xs text-red-500 text-center">{error}</span>
                <button onClick={resetView} className="text-xs underline text-muted-foreground">Try Again</button>
              </div>
            )}

          </div>
        )}

        {/* Studio Tools Grid */}
        <div className="grid grid-cols-2 gap-2">
          {tools.map((tool, index) => (
            <div
              key={index}
              onClick={() => tool.action && tool.action()}
              className={`studio-tool group relative cursor-pointer ${tool.label === "Audio Overview" ? 'border-notebook-teal/50 bg-notebook-teal/5' : ''}`}
            >
              <span className={`group-hover:text-foreground transition-colors ${tool.label === "Audio Overview" ? 'text-notebook-teal' : 'text-muted-foreground'}`}>
                {tool.icon}
              </span>
              <span className="text-sm text-foreground">{tool.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Audio Guides List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {guides.filter(g => g.guide_type === 'audio').map((guide) => (
          <div key={guide.id} className="source-item group cursor-pointer hover:bg-secondary/50 transition-colors" onClick={() => {
            setAudioUrl(guide.content);
          }}>
            <div className="w-8 h-8 rounded-lg bg-notebook-teal/10 flex items-center justify-center flex-shrink-0 text-notebook-teal">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground truncate">{guide.title}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(guide.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
        {guides.filter(g => g.guide_type === 'audio').length === 0 && (
          <div className="text-center p-4 text-muted-foreground text-sm">
            No audio overviews generated yet.
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
