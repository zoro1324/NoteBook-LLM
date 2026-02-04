import { Plus } from "lucide-react";

interface CreateNotebookCardProps {
  onClick?: () => void;
}

const CreateNotebookCard = ({ onClick }: CreateNotebookCardProps) => {
  return (
    <div 
      onClick={onClick}
      className="notebook-card p-4 cursor-pointer flex flex-col items-center justify-center min-h-[140px] border-dashed"
    >
      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
        <Plus className="w-6 h-6 text-foreground" />
      </div>
      <span className="text-foreground font-medium">Create new notebook</span>
    </div>
  );
};

export default CreateNotebookCard;
