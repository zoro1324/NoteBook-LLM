import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Grid2X2, List, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import NotebookCard from "@/components/NotebookCard";
import CreateNotebookCard from "@/components/CreateNotebookCard";
import NotebookIcon from "@/components/NotebookIcon";
import { notebooksApi } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";

type ViewMode = "grid" | "list";
type TabType = "all" | "my" | "featured";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("my");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const queryClient = useQueryClient();

  // Fetch notebooks from API
  const { data: notebooks = [], isLoading } = useQuery({
    queryKey: ['notebooks'],
    queryFn: async () => {
      const response = await notebooksApi.list();
      return response.data;
    },
  });

  // Create notebook mutation
  const createNotebookMutation = useMutation({
    mutationFn: async () => {
      const response = await notebooksApi.create({
        title: "Untitled notebook",
        description: "",
        is_public: false,
      });
      return response.data;
    },
    onSuccess: (newNotebook) => {
      queryClient.invalidateQueries({ queryKey: ['notebooks'] });
      navigate(`/notebook/${newNotebook.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to create notebook",
        variant: "destructive",
      });
    },
  });

  const handleCreateNotebook = () => {
    createNotebookMutation.mutate();
  };

  const tabs: { id: TabType; label: string }[] = [
    { id: "all", label: "All" },
    { id: "my", label: "My notebooks" },
    { id: "featured", label: "Featured notebooks" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-8 py-6 max-w-7xl mx-auto">
        {/* Tabs and Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === tab.id
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-secondary rounded-lg p-1">
              <button className="p-1.5 rounded text-muted-foreground">
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded transition-colors ${viewMode === "grid" ? "bg-notebook-active text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <Grid2X2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded transition-colors ${viewMode === "list" ? "bg-notebook-active text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <button className="notebook-btn-primary">
              Most recent
              <ChevronDown className="w-4 h-4" />
            </button>

            {/* Create Button */}
            <button
              onClick={handleCreateNotebook}
              disabled={createNotebookMutation.isPending}
              className="notebook-btn bg-secondary text-foreground hover:bg-accent border border-border disabled:opacity-50"
            >
              <span className="text-lg">+</span>
              {createNotebookMutation.isPending ? "Creating..." : "Create new"}
            </button>
          </div>
        </div>

        {/* Section Title */}
        <h2 className="text-xl font-medium text-foreground mb-4">My notebooks</h2>

        {/* Notebook Grid */}
        <div className={`grid gap-4 ${viewMode === "grid"
          ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          : "grid-cols-1"
          }`}>
          <CreateNotebookCard onClick={handleCreateNotebook} />

          {isLoading ? (
            <div className="col-span-full text-center text-muted-foreground py-8">
              Loading notebooks...
            </div>
          ) : notebooks.length === 0 ? (
            <div className="col-span-full text-center text-muted-foreground py-8">
              No notebooks yet. Create your first notebook to get started!
            </div>
          ) : (
            notebooks.map((notebook) => (
              <NotebookCard
                key={notebook.id}
                id={String(notebook.id)}
                title={notebook.title}
                date={new Date(notebook.updated_at).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
                sourceCount={notebook.documents?.length || 0}
                icon={<NotebookIcon type="pattern" />}
                isPublic={notebook.is_public}
                onClick={() => navigate(`/notebook/${notebook.id}`)}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
