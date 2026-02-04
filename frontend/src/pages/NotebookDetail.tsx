import { useState } from "react";
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
        <SourcesPanel notebookId={notebookId!} documents={notebook.documents || []} />
        <ChatPanel notebookId={notebookId!} />
        <StudioPanel />
      </main>
    </div>
  );
};

export default NotebookDetail;
