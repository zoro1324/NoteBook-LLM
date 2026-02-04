import { useState } from "react";
import { SlidersHorizontal, MoreVertical, Copy, ThumbsUp, ThumbsDown, Send, Save } from "lucide-react";

interface Message {
  id: string;
  content: React.ReactNode;
  timestamp?: string;
}

const ChatPanel = () => {
  const [inputValue, setInputValue] = useState("");

  const chatContent: Message = {
    id: "1",
    content: (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-medium text-foreground mb-4">4. Interleaved DMA</h2>
          <ul className="list-disc pl-6 space-y-2 text-foreground">
            <li>
              <span className="font-medium">Operation:</span> Interleaved DMA functions by reading data from{" "}
              <span className="text-notebook-teal cursor-pointer hover:underline">one memory address</span> and
              writing data to{" "}
              <span className="text-notebook-teal cursor-pointer hover:underline">another memory address</span>{" "}
              <span className="text-muted-foreground">[2]</span>.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-medium text-foreground mb-4">Context within DMA</h2>
          <div className="space-y-4 text-foreground leading-relaxed">
            <p>
              DMA generally functions to speed up memory operations and data transfer, helping to reduce the
              load on the CPU{" "}
              <span className="text-muted-foreground">[3]</span>. The various types of DMA represent different ways this high-speed data
              transfer can be orchestrated between{" "}
              <span className="text-notebook-teal cursor-pointer hover:underline">I/O devices</span> and{" "}
              <span className="text-notebook-teal cursor-pointer hover:underline">main memory</span>, depending on the complexity
              and scope of the memory addressing required{" "}
              <span className="text-muted-foreground">[1, 4]</span>.
            </p>
            <p>
              For instance, while a Single Ended DMA handles transfers involving just one specific memory
              address, the more advanced types, such as Dual Ended and Arbitrated Ended DMA, allow for
              simultaneous interaction with multiple memory locations, increasing the complexity and efficiency of
              data movement when multiple sources or destinations are involved{" "}
              <span className="text-muted-foreground">[1, 2]</span>.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <button className="notebook-btn-primary text-sm">
            <Save className="w-4 h-4" />
            Save to note
          </button>
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <Copy className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ThumbsUp className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ThumbsDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="text-right text-sm text-muted-foreground">
          Today • 23:07
        </div>
      </div>
    ),
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-notebook-surface rounded-xl border border-border mx-2">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg font-medium text-foreground">Chat</h2>
        <div className="flex items-center gap-1">
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
          </button>
          <button className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <MoreVertical className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {chatContent.content}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Start typing..."
            className="w-full bg-background border border-border rounded-full px-4 py-3 pr-24 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">1 source</span>
            <button className="p-2 rounded-full bg-secondary hover:bg-accent transition-colors">
              <Send className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-muted-foreground pb-3 px-4">
        NotebookLM can be inaccurate; please double-check its responses.
      </div>
    </div>
  );
};

export default ChatPanel;
