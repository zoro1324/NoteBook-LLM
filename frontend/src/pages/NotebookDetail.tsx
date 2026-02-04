import Header from "@/components/Header";
import SourcesPanel from "@/components/SourcesPanel";
import ChatPanel from "@/components/ChatPanel";
import StudioPanel from "@/components/StudioPanel";

const NotebookDetail = () => {
  return (
    <div className="min-h-screen h-screen bg-background flex flex-col">
      <Header 
        showBackToHome 
        notebookTitle="Direct Memory Access (DMA) in Tamil" 
        isPublic 
      />
      
      <main className="flex-1 flex overflow-hidden p-2 gap-0">
        <SourcesPanel />
        <ChatPanel />
        <StudioPanel />
      </main>
    </div>
  );
};

export default NotebookDetail;
