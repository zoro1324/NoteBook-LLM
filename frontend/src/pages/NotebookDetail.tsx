import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import SourcesPanel from "@/components/SourcesPanel";
import ChatPanel from "@/components/ChatPanel";
import StudioPanel from "@/components/StudioPanel";
import { notebooksApi } from "@/lib/api";

const NotebookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Fetch notebook data
  const notebookId = id || null;

  const { data: notebook, isLoading } = useQuery({
    queryKey: ['notebook', notebookId],
    queryFn: async () => {
      if (!notebookId) return null;
      const response = await notebooksApi.get(notebookId);
      return response.data;
    },
    enabled: !!notebookId,
  });

  // Source selection state
  const [selectedDocuments, setSelectedDocuments] = useState<Set<number>>(new Set());

  // Initialize selection when notebook loads
  useEffect(() => {
    if (notebook?.documents) {
      setSelectedDocuments(new Set(notebook.documents.map(d => d.id)));
    }
  }, [notebook?.documents]);

  const handleToggleDocument = (docId: number) => {
    setSelectedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
      } else {
        newSet.add(docId);
      }
      return newSet;
    });
  };

  const handleToggleAll = () => {
    if (!notebook?.documents) return;

    if (selectedDocuments.size === notebook.documents.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(notebook.documents.map(d => d.id)));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen h-screen bg-background flex flex-col">
        <Header showBackToHome notebookTitle="Loading..." />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-muted-foreground">Loading notebook...</div>
        </main>
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="min-h-screen h-screen bg-background flex flex-col">
        <Header showBackToHome notebookTitle="Not Found" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-medium mb-4">Notebook not found</h2>
            <button
              onClick={() => navigate('/')}
              className="notebook-btn-primary"
            >
              Back to home
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen bg-background flex flex-col">
      <Header
        showBackToHome
        notebookTitle={notebook.title}
        isPublic={notebook.is_public}
      />

      <main className="flex-1 flex overflow-hidden p-2 gap-0">
        <SourcesPanel
          notebookId={notebookId!}
          documents={notebook.documents || []}
          selectedDocuments={selectedDocuments}
          onToggleDocument={handleToggleDocument}
          onToggleAll={handleToggleAll}
        />
        <ChatPanel
          notebookId={notebookId!}
          selectedDocuments={selectedDocuments}
        />
        <StudioPanel
          documents={notebook.documents || []}
          guides={notebook.guides || []}
          notebookId={notebookId!}
        />
      </main>
    </div>
  );
};

export default NotebookDetail;
