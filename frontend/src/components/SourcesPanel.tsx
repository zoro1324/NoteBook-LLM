import { useState, useRef } from "react";
import { Plus, Search, Globe, Zap, ArrowRight, Check, ChevronDown, Upload, File } from "lucide-react";
import { Youtube } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { documentsApi } from "@/lib/api";
import type { Document } from "@/types/api";
import { toast } from "@/components/ui/use-toast";

interface SourcesPanelProps {
  notebookId: string;
  documents: Document[];
  selectedDocuments: Set<number>;
  onToggleDocument: (id: number) => void;
  onToggleAll: () => void;
}

const SourcesPanel = ({
  notebookId,
  documents,
  selectedDocuments,
  onToggleDocument,
  onToggleAll
}: SourcesPanelProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: (file: File) => documentsApi.upload(file, notebookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notebook', notebookId] });
      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to upload document",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const toggleDocument = (docId: number) => {
    onToggleDocument(docId);
  };

  const toggleAll = () => {
    onToggleAll();
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <File className="w-3.5 h-3.5 text-red-600" />;
    if (fileType.includes('video')) return <Youtube className="w-3.5 h-3.5 text-white" />;
    return <File className="w-3.5 h-3.5 text-blue-600" />;
  };

  return (
    <div className="w-80 flex-shrink-0 flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-foreground">Sources</h2>
          <button className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted-foreground">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </button>
        </div>

        {/* Add Sources Button */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.txt,.doc,.docx"
        />
        <button
          className="w-full notebook-btn-primary justify-center mb-4"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadMutation.isPending}
        >
          {uploadMutation.isPending ? (
            <>
              <Upload className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add sources
            </>
          )}
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
        {documents.length > 0 && (
          <>
            {/* Select All */}
            <div
              className="source-item cursor-pointer"
              onClick={toggleAll}
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedDocuments.size === documents.length
                ? 'border-foreground bg-foreground'
                : 'border-foreground'
                }`}>
                {selectedDocuments.size === documents.length && (
                  <Check className="w-3 h-3 text-background" />
                )}
              </div>
              <span className="text-sm text-foreground">Select all sources</span>
            </div>

            {documents.map((doc) => (
              <div
                key={doc.id}
                className={`source-item cursor-pointer ${selectedDocuments.has(doc.id) ? 'bg-accent' : ''
                  }`}
                onClick={() => toggleDocument(doc.id)}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${selectedDocuments.has(doc.id)
                  ? 'border-foreground bg-foreground'
                  : 'border-muted-foreground'
                  }`}>
                  {selectedDocuments.has(doc.id) && (
                    <Check className="w-3 h-3 text-background" />
                  )}
                </div>
                <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${doc.file_type.includes('pdf') ? 'bg-red-600' : 'bg-blue-600'
                  }`}>
                  {getFileIcon(doc.file_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-foreground truncate block">
                    {doc.title}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {doc.word_count} words
                  </span>
                </div>
              </div>
            ))}
          </>
        )}

        {documents.length === 0 && (
          <div className="text-center text-muted-foreground py-8 px-4">
            <p className="text-sm mb-2">No sources yet</p>
            <p className="text-xs">Click "Add sources" to upload documents</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SourcesPanel;
