import { Settings, Grid3X3, User } from "lucide-react";

interface HeaderProps {
  showBackToHome?: boolean;
  notebookTitle?: string;
  isPublic?: boolean;
}

const Header = ({ showBackToHome, notebookTitle, isPublic }: HeaderProps) => {
  return (
    <header className="h-16 px-4 flex items-center justify-between border-b border-border bg-background">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-notebook-teal to-notebook-blue flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-background">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
            </svg>
          </div>
          <span className="text-lg font-medium text-foreground">NotebookLM</span>
        </a>

        {notebookTitle && (
          <>
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium truncate max-w-[300px]">{notebookTitle}</span>
            {isPublic && (
              <span className="px-2 py-0.5 text-xs font-medium bg-notebook-green/20 text-notebook-green rounded-full flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                Public
              </span>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {notebookTitle && (
          <>
            <button className="notebook-btn-primary">
              <span className="text-lg">+</span>
              Create notebook
            </button>
            <button className="notebook-btn-ghost">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18"/>
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
              </svg>
              Analytics
            </button>
            <button className="notebook-btn-ghost">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                <polyline points="16 6 12 2 8 6"/>
                <line x1="12" y1="2" x2="12" y2="15"/>
              </svg>
              Share
            </button>
          </>
        )}
        
        <button className="notebook-btn-ghost">
          <Settings className="w-4 h-4" />
          Settings
        </button>
        
        <span className="px-2 py-1 text-xs font-medium bg-secondary text-secondary-foreground rounded">
          PRO
        </span>
        
        <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
          <Grid3X3 className="w-5 h-5 text-muted-foreground" />
        </button>
        
        <button className="w-8 h-8 rounded-full bg-gradient-to-br from-notebook-pink to-notebook-orange flex items-center justify-center">
          <User className="w-4 h-4 text-background" />
        </button>
      </div>
    </header>
  );
};

export default Header;
