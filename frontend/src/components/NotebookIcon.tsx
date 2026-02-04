interface NotebookIconProps {
  type: 'computer' | 'ruler' | 'traffic' | 'warning' | 'globe' | 'chip' | 'document' | 'pattern';
  className?: string;
}

const NotebookIcon = ({ type, className = "w-12 h-12" }: NotebookIconProps) => {
  const icons: Record<string, React.ReactNode> = {
    computer: (
      <svg viewBox="0 0 48 48" fill="none" className={className}>
        <rect x="8" y="8" width="32" height="24" rx="2" fill="#4FC3F7"/>
        <rect x="12" y="12" width="24" height="16" fill="#29B6F6"/>
        <rect x="4" y="32" width="40" height="4" rx="1" fill="#4FC3F7"/>
        <rect x="16" y="14" width="8" height="6" fill="#81D4FA"/>
        <rect x="26" y="14" width="6" height="4" fill="#81D4FA"/>
      </svg>
    ),
    ruler: (
      <svg viewBox="0 0 48 48" fill="none" className={className}>
        <rect x="6" y="18" width="36" height="12" rx="1" fill="#90A4AE" transform="rotate(-45 24 24)"/>
        <path d="M12 28L16 24M18 30L22 26M24 32L28 28M30 34L34 30" stroke="#CFD8DC" strokeWidth="2"/>
      </svg>
    ),
    traffic: (
      <svg viewBox="0 0 48 48" fill="none" className={className}>
        <rect x="16" y="4" width="16" height="40" rx="4" fill="#424242"/>
        <circle cx="24" cy="14" r="5" fill="#EF5350"/>
        <circle cx="24" cy="24" r="5" fill="#FFCA28"/>
        <circle cx="24" cy="34" r="5" fill="#66BB6A"/>
      </svg>
    ),
    warning: (
      <svg viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M24 4L44 40H4L24 4Z" fill="#FFC107"/>
        <rect x="22" y="16" width="4" height="12" rx="2" fill="#5D4037"/>
        <circle cx="24" cy="34" r="2" fill="#5D4037"/>
      </svg>
    ),
    globe: (
      <svg viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="24" cy="24" r="18" fill="#4FC3F7"/>
        <ellipse cx="24" cy="24" rx="8" ry="18" stroke="#29B6F6" strokeWidth="2" fill="none"/>
        <line x1="6" y1="24" x2="42" y2="24" stroke="#29B6F6" strokeWidth="2"/>
        <ellipse cx="24" cy="16" rx="14" ry="4" stroke="#29B6F6" strokeWidth="1" fill="none"/>
        <ellipse cx="24" cy="32" rx="14" ry="4" stroke="#29B6F6" strokeWidth="1" fill="none"/>
      </svg>
    ),
    chip: (
      <svg viewBox="0 0 48 48" fill="none" className={className}>
        <rect x="12" y="12" width="24" height="24" rx="2" fill="#7C4DFF"/>
        <rect x="16" y="16" width="16" height="16" fill="#B388FF"/>
        <rect x="20" y="20" width="8" height="8" fill="#7C4DFF"/>
        <rect x="8" y="18" width="4" height="4" fill="#B388FF"/>
        <rect x="8" y="26" width="4" height="4" fill="#B388FF"/>
        <rect x="36" y="18" width="4" height="4" fill="#B388FF"/>
        <rect x="36" y="26" width="4" height="4" fill="#B388FF"/>
        <rect x="18" y="8" width="4" height="4" fill="#B388FF"/>
        <rect x="26" y="8" width="4" height="4" fill="#B388FF"/>
        <rect x="18" y="36" width="4" height="4" fill="#B388FF"/>
        <rect x="26" y="36" width="4" height="4" fill="#B388FF"/>
      </svg>
    ),
    document: (
      <svg viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M12 6H30L38 14V42H12V6Z" fill="#4FC3F7"/>
        <path d="M30 6V14H38" fill="#29B6F6"/>
        <rect x="16" y="20" width="16" height="2" rx="1" fill="#E1F5FE"/>
        <rect x="16" y="26" width="12" height="2" rx="1" fill="#E1F5FE"/>
        <rect x="16" y="32" width="14" height="2" rx="1" fill="#E1F5FE"/>
      </svg>
    ),
    pattern: (
      <svg viewBox="0 0 48 48" fill="none" className={className}>
        <rect x="4" y="4" width="40" height="40" rx="4" fill="#7C4DFF"/>
        <circle cx="14" cy="14" r="4" fill="#E040FB"/>
        <circle cx="34" cy="14" r="4" fill="#E040FB"/>
        <circle cx="14" cy="34" r="4" fill="#E040FB"/>
        <circle cx="34" cy="34" r="4" fill="#E040FB"/>
        <circle cx="24" cy="24" r="6" fill="#E040FB"/>
        <path d="M14 14L24 24M34 14L24 24M14 34L24 24M34 34L24 24" stroke="#B388FF" strokeWidth="2"/>
      </svg>
    ),
  };

  return <>{icons[type] || icons.document}</>;
};

export default NotebookIcon;
