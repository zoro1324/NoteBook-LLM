import { useState, useRef, useEffect } from "react";
import { Mic, Video, GitBranch, FileText, BookOpen, HelpCircle, BarChart3, Presentation, Table, Plus, MoreVertical, Loader2, Play, Pause, X, Check, ArrowRight, RefreshCw, User, ChevronRight } from "lucide-react";
import { notebooksApi } from "@/lib/api";
import type { Document, NotebookGuide } from "@/types/api";

interface StudioPanelProps {
  notebookId: string;
  documents: Document[];
  guides: NotebookGuide[];
}

type PodcastView =
  | 'idle'
  | 'loading_personas'
  | 'selecting_personas'
  | 'loading_scenarios'
  | 'selecting_scenario'
  | 'generating'
  | 'playing'
  | 'error';

interface PersonaOption {
  person1: string;
  person2: string;
}

const StudioPanel = ({ notebookId, documents = [], guides = [] }: StudioPanelProps) => {
  const [view, setView] = useState<PodcastView>('idle');

  // Data State
  const [personaOptions, setPersonaOptions] = useState<PersonaOption[]>([]);
  const [scenarioOptions, setScenarioOptions] = useState<string[]>([]);

  // Selection State
  const [selectedPersonaIdx, setSelectedPersonaIdx] = useState<number | null>(null); // -1 for custom
  const [selectedScenarioIdx, setSelectedScenarioIdx] = useState<number | null>(null); // -1 for custom

  // Custom Inputs
  const [customPerson1, setCustomPerson1] = useState("");
  const [customPerson2, setCustomPerson2] = useState("");
  const [customScenario, setCustomScenario] = useState("");

  // Result State
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

  // --- Step 1: Fetch Personas ---
  const fetchPersonas = async () => {
    if (documents.length === 0) {
      alert("Please upload documents first.");
      return;
    }
    setView('loading_personas');
    setError(null);
    try {
      const response = await notebooksApi.getPersonaOptions(notebookId);
      setPersonaOptions(response.data.options);
      setView('selecting_personas');
    } catch (err) {
      console.error(err);
      setError("Failed to generate persona options.");
      setView('error');
    }
  };

  // --- Step 2: Confirm Personas & Fetch Scenarios ---
  const confirmPersonas = async () => {
    if (selectedPersonaIdx === null) return;

    let p1 = "";
    let p2 = "";

    if (selectedPersonaIdx === -1) {
      if (!customPerson1.trim() || !customPerson2.trim()) return;
      p1 = customPerson1;
      p2 = customPerson2;
    } else {
      p1 = personaOptions[selectedPersonaIdx].person1;
      p2 = personaOptions[selectedPersonaIdx].person2;
    }

    // Move to next step
    setView('loading_scenarios');
    try {
      const response = await notebooksApi.getScenarioOptions(notebookId, p1, p2);
      setScenarioOptions(response.data.options);
      setView('selecting_scenario');
    } catch (err) {
      console.error(err);
      setError("Failed to generate scenarios.");
      setView('error');
    }
  };

  // --- Step 3: Confirm Scenario & Generate ---
  const generatePodcast = async () => {
    if (selectedScenarioIdx === null) return;
    if (selectedPersonaIdx === null) return; // Should not happen

    let instruction = "";
    if (selectedScenarioIdx === -1) {
      if (!customScenario.trim()) return;
      instruction = customScenario;
    } else {
      instruction = scenarioOptions[selectedScenarioIdx];
    }

    // Retrieve personas again
    let p1 = "";
    let p2 = "";
    if (selectedPersonaIdx === -1) {
      p1 = customPerson1;
      p2 = customPerson2;
    } else {
      p1 = personaOptions[selectedPersonaIdx].person1;
      p2 = personaOptions[selectedPersonaIdx].person2;
    }

    setView('generating');
    setError(null);
    try {
      const response = await notebooksApi.generatePodcast(notebookId, instruction, p1, p2);
      if (response.data.audio_url) {
        setAudioUrl(response.data.audio_url);
        // Autoplay handled by useEffect
      } else {
        throw new Error("No audio URL returned");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to generate podcast.");
      setView('error');
    }
  };

  const handlePersonaSelect = (index: number) => {
    setSelectedPersonaIdx(index);
  };

  const handleScenarioSelect = (index: number) => {
    setSelectedScenarioIdx(index);
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
    setPersonaOptions([]);
    setScenarioOptions([]);
    setSelectedPersonaIdx(null);
    setSelectedScenarioIdx(null);
    setCustomPerson1("");
    setCustomPerson2("");
    setCustomScenario("");
    setView('idle');
    setError(null);
  };

  const tools = [
    { icon: <Mic className="w-5 h-5" />, label: "Audio Overview", hasEdit: true, action: fetchPersonas },
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

            {/* View State Rendering */}

            {/* 1. Loading Personas */}
            {view === 'loading_personas' && (
              <div className="flex flex-col items-center py-4 gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-notebook-teal" />
                <span className="text-xs">Analyzing content for personas...</span>
              </div>
            )}

            {/* 2. Selecting Personas */}
            {view === 'selecting_personas' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-xs text-muted-foreground mb-2">Step 1: Choose your hosts</p>

                {personaOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePersonaSelect(idx)}
                    className={`w-full text-left p-2 rounded text-sm border transition-all ${selectedPersonaIdx === idx
                      ? 'bg-notebook-teal/10 border-notebook-teal text-notebook-teal'
                      : 'bg-background border-border hover:border-notebook-teal/50'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3" />
                      <span className="font-medium text-xs">{opt.person1}</span>
                      <span className="text-muted-foreground text-[10px]">&</span>
                      <span className="font-medium text-xs">{opt.person2}</span>
                    </div>
                  </button>
                ))}

                {/* Custom Option */}
                <div className={`p-2 rounded border transition-all ${selectedPersonaIdx === -1
                  ? 'bg-notebook-teal/10 border-notebook-teal'
                  : 'bg-background border-border'
                  }`}>
                  <button
                    onClick={() => handlePersonaSelect(-1)}
                    className={`text-sm font-medium w-full text-left mb-2 ${selectedPersonaIdx === -1 ? 'text-notebook-teal' : 'text-foreground'}`}
                  >
                    Custom Hosts
                  </button>
                  {selectedPersonaIdx === -1 && (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={customPerson1}
                        onChange={(e) => setCustomPerson1(e.target.value)}
                        placeholder="Host 1 (e.g. Skeptic)"
                        className="w-full bg-background border border-border rounded p-1.5 text-xs focus:ring-1 focus:ring-notebook-teal outline-none"
                      />
                      <input
                        type="text"
                        value={customPerson2}
                        onChange={(e) => setCustomPerson2(e.target.value)}
                        placeholder="Host 2 (e.g. Fan)"
                        className="w-full bg-background border border-border rounded p-1.5 text-xs focus:ring-1 focus:ring-notebook-teal outline-none"
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={confirmPersonas}
                  disabled={selectedPersonaIdx === null || (selectedPersonaIdx === -1 && (!customPerson1.trim() || !customPerson2.trim()))}
                  className="w-full mt-2 bg-notebook-teal text-white py-1.5 rounded text-sm font-medium disabled:opacity-50 hover:bg-notebook-teal/90 transition-colors flex items-center justify-center gap-2"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 3. Loading Scenarios */}
            {view === 'loading_scenarios' && (
              <div className="flex flex-col items-center py-4 gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-notebook-teal" />
                <span className="text-xs">Generating scenarios...</span>
              </div>
            )}

            {/* 4. Selecting Scenario */}
            {view === 'selecting_scenario' && (
              <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-xs text-muted-foreground">Step 2: Choose a scenario</p>
                  <button onClick={() => setView('selecting_personas')} className="text-[10px] text-notebook-teal hover:underline">Back</button>
                </div>

                {scenarioOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleScenarioSelect(idx)}
                    className={`w-full text-left p-2 rounded text-sm border transition-all ${selectedScenarioIdx === idx
                      ? 'bg-notebook-teal/10 border-notebook-teal text-notebook-teal'
                      : 'bg-background border-border hover:border-notebook-teal/50'
                      }`}
                  >
                    {opt}
                  </button>
                ))}

                {/* Custom Option */}
                <div className={`p-2 rounded border transition-all ${selectedScenarioIdx === -1
                  ? 'bg-notebook-teal/10 border-notebook-teal'
                  : 'bg-background border-border'
                  }`}>
                  <button
                    onClick={() => handleScenarioSelect(-1)}
                    className={`text-sm font-medium w-full text-left ${selectedScenarioIdx === -1 ? 'text-notebook-teal' : 'text-foreground'}`}
                  >
                    Custom Instruction
                  </button>
                  {selectedScenarioIdx === -1 && (
                    <input
                      type="text"
                      value={customScenario}
                      onChange={(e) => setCustomScenario(e.target.value)}
                      placeholder="e.g. Focus on technical details..."
                      className="w-full mt-2 bg-background border border-border rounded p-1.5 text-xs focus:ring-1 focus:ring-notebook-teal outline-none"
                    />
                  )}
                </div>

                <button
                  onClick={generatePodcast}
                  disabled={selectedScenarioIdx === null || (selectedScenarioIdx === -1 && !customScenario.trim())}
                  className="w-full mt-2 bg-notebook-teal text-white py-1.5 rounded text-sm font-medium disabled:opacity-50 hover:bg-notebook-teal/90 transition-colors flex items-center justify-center gap-2"
                >
                  Generate <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* 5. Generating */}
            {view === 'generating' && (
              <div className="flex flex-col items-center py-4 gap-2 text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin text-notebook-teal" />
                <span className="text-xs">Creating your podcast...</span>
                <span className="text-[10px] text-muted-foreground/70 text-center">(This may take 1-2 minutes)</span>
              </div>
            )}

            {/* 6. Playing */}
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

            {/* Error */}
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
