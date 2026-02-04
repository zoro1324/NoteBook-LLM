import { Plus, Search, Globe, Zap, ArrowRight, Check, ChevronDown } from "lucide-react";
import { Youtube } from "lucide-react";

const SourcesPanel = () => {
  return (
    <div className="w-80 flex-shrink-0 flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">Sources</h2>
          <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
        </div>

        {/* Add Sources Button */}
        <button className="w-full notebook-btn-primary justify-center mb-4">
          <Plus className="w-4 h-4" />
          Add sources
        </button>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search the web for new sources"
            className="notebook-input w-full pl-10"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <button className="notebook-btn-primary text-xs py-1.5">
            <Globe className="w-3.5 h-3.5" />
            Web
            <ChevronDown className="w-3 h-3" />
          </button>
          <button className="notebook-btn-primary text-xs py-1.5">
            <Zap className="w-3.5 h-3.5" />
            Fast research
            <ChevronDown className="w-3 h-3" />
          </button>
          <button className="p-1.5 rounded-full bg-secondary hover:bg-accent transition-colors">
            <ArrowRight className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </div>

      {/* Source List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {/* Select All */}
        <div className="source-item">
          <div className="w-5 h-5 rounded border-2 border-foreground flex items-center justify-center">
            <Check className="w-3 h-3 text-foreground" />
          </div>
          <span className="text-sm text-foreground">Select all sources</span>
        </div>

        {/* Source Item */}
        <div className="source-item bg-accent">
          <div className="w-5 h-5 rounded border-2 border-foreground bg-foreground flex items-center justify-center">
            <Check className="w-3 h-3 text-background" />
          </div>
          <div className="w-6 h-6 rounded bg-red-600 flex items-center justify-center flex-shrink-0">
            <Youtube className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm text-foreground truncate flex-1">Direct Memory Access in Tamil | DMA in...</span>
        </div>
      </div>
    </div>
  );
};

export default SourcesPanel;
