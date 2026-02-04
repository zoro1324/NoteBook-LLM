import { MoreVertical } from "lucide-react";

interface NotebookCardProps {
  id: string;
  title: string;
  date: string;
  sourceCount: number;
  icon: React.ReactNode;
  isPublic?: boolean;
  onClick?: () => void;
}

const NotebookCard = ({ title, date, sourceCount, icon, isPublic, onClick }: NotebookCardProps) => {
  return (
    <div 
      onClick={onClick}
      className="notebook-card p-4 cursor-pointer group relative min-h-[140px] flex flex-col"
    >
      <button 
        className="absolute top-3 right-3 p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-notebook-active transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <MoreVertical className="w-5 h-5 text-muted-foreground" />
      </button>

      <div className="mb-3">
        {icon}
      </div>

      <h3 className="text-foreground font-medium text-base leading-tight mb-2 line-clamp-2 pr-6">
        {title}
      </h3>

      <div className="mt-auto flex items-center gap-2 text-sm text-muted-foreground">
        <span>{date}</span>
        <span>•</span>
        <span>{sourceCount} source{sourceCount !== 1 ? 's' : ''}</span>
        {isPublic && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="ml-auto text-muted-foreground">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        )}
      </div>
    </div>
  );
};

export default NotebookCard;
