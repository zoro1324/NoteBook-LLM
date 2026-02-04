import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, Grid2X2, List, Check } from "lucide-react";
import Header from "@/components/Header";
import NotebookCard from "@/components/NotebookCard";
import CreateNotebookCard from "@/components/CreateNotebookCard";
import NotebookIcon from "@/components/NotebookIcon";

type ViewMode = "grid" | "list";
type TabType = "all" | "my" | "featured";

const mockNotebooks = [
  {
    id: "1",
    title: "Direct Memory Access (DMA) in Tamil",
    date: "13 Nov 2025",
    sourceCount: 1,
    icon: "computer" as const,
    isPublic: true,
  },
  {
    id: "2",
    title: "Untitled notebook",
    date: "3 Feb 2026",
    sourceCount: 0,
    icon: "pattern" as const,
  },
  {
    id: "3",
    title: "Untitled notebook",
    date: "2 Feb 2026",
    sourceCount: 0,
    icon: "pattern" as const,
  },
  {
    id: "4",
    title: "Von Neumann Architecture in Tamil",
    date: "13 Nov 2025",
    sourceCount: 1,
    icon: "computer" as const,
    isPublic: true,
  },
  {
    id: "5",
    title: "Algebra and Combinatorics...",
    date: "16 Nov 2025",
    sourceCount: 1,
    icon: "ruler" as const,
    isPublic: true,
  },
  {
    id: "6",
    title: "Computer Addressing Modes in Tamil",
    date: "14 Nov 2025",
    sourceCount: 1,
    icon: "globe" as const,
  },
  {
    id: "7",
    title: "MIPS Processor Addressing Modes...",
    date: "13 Nov 2025",
    sourceCount: 1,
    icon: "chip" as const,
  },
  {
    id: "8",
    title: "Data and Control Hazards in Tamil",
    date: "13 Nov 2025",
    sourceCount: 1,
    icon: "warning" as const,
    isPublic: true,
  },
  {
    id: "9",
    title: "Pipelining and Control in Digital Principles",
    date: "13 Nov 2025",
    sourceCount: 1,
    icon: "traffic" as const,
    isPublic: true,
  },
  {
    id: "10",
    title: "Parallel and Serial Interfaces in Digital...",
    date: "13 Nov 2025",
    sourceCount: 1,
    icon: "computer" as const,
  },
  {
    id: "11",
    title: "Digital Principles and Computer...",
    date: "13 Nov 2025",
    sourceCount: 1,
    icon: "pattern" as const,
  },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>("my");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

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
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab.id
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
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "grid" ? "bg-notebook-active text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Grid2X2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded transition-colors ${
                  viewMode === "list" ? "bg-notebook-active text-foreground" : "text-muted-foreground hover:text-foreground"
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
            <button className="notebook-btn bg-secondary text-foreground hover:bg-accent border border-border">
              <span className="text-lg">+</span>
              Create new
            </button>
          </div>
        </div>

        {/* Section Title */}
        <h2 className="text-xl font-medium text-foreground mb-4">My notebooks</h2>

        {/* Notebook Grid */}
        <div className={`grid gap-4 ${
          viewMode === "grid" 
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
            : "grid-cols-1"
        }`}>
          <CreateNotebookCard onClick={() => navigate("/notebook/new")} />
          
          {mockNotebooks.map((notebook) => (
            <NotebookCard
              key={notebook.id}
              id={notebook.id}
              title={notebook.title}
              date={notebook.date}
              sourceCount={notebook.sourceCount}
              icon={<NotebookIcon type={notebook.icon} />}
              isPublic={notebook.isPublic}
              onClick={() => navigate(`/notebook/${notebook.id}`)}
            />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
