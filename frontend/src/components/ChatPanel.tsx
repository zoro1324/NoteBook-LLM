import { useState, useEffect, useRef } from "react";
import { SlidersHorizontal, MoreVertical, Copy, ThumbsUp, ThumbsDown, Send, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { conversationsApi, chatApi } from "@/lib/api";
import type { Message, Citation } from "@/types/api";
import { toast } from "@/components/ui/use-toast";

interface ChatPanelProps {
  notebookId: string;
  selectedDocuments: Set<number>;
}

const ChatPanel = ({ notebookId, selectedDocuments }: ChatPanelProps) => {
  const [inputValue, setInputValue] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant', content: string, citations?: Citation[] }>>([]);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations for this notebook
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', notebookId],
    queryFn: async () => {
      const response = await conversationsApi.list(notebookId);
      return response.data;
    },
  });

  // Use the first conversation if available
  useEffect(() => {
    if (conversations.length > 0 && !conversationId) {
      const conv = conversations[0];
      setConversationId(conv.id);
      // Load messages from conversation
      if (conv.messages) {
        setMessages(conv.messages.map(m => ({
          role: m.role,
          content: m.content,
          citations: m.citations
        })));
      }
    }
  }, [conversations, conversationId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await chatApi.send({
        conversation_id: conversationId || undefined,
        notebook_id: notebookId,
        message,
        document_ids: Array.from(selectedDocuments),
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Update conversation ID if it was created
      if (!conversationId) {
        setConversationId(data.conversation_id);
      }

      // Add assistant's response to messages
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message.content,
        citations: data.citations
      }]);

      // Invalidate conversations query
      queryClient.invalidateQueries({ queryKey: ['conversations', notebookId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!inputValue.trim() || sendMessageMutation.isPending) return;

    // Add user message to UI immediately
    setMessages(prev => [...prev, { role: 'user', content: inputValue }]);

    // Send to backend
    sendMessageMutation.mutate(inputValue);

    // Clear input
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderCitation = (index: number) => (
    <span className="text-muted-foreground">[{index}]</span>
  );

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
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p className="text-lg mb-2">Start a conversation</p>
            <p className="text-sm">Ask questions about your sources</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, index) => (
              <div key={index} className="space-y-3">
                {msg.role === 'user' ? (
                  <div className="bg-secondary rounded-lg p-4">
                    <p className="text-foreground">{msg.content}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {msg.citations.map((citation, idx) => renderCitation(idx + 1))}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
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
                  </div>
                )}
              </div>
            ))}

            {sendMessageMutation.isPending && (
              <div className="text-muted-foreground">
                <div className="animate-pulse">Thinking...</div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Start typing..."
            disabled={sendMessageMutation.isPending}
            className="w-full bg-background border border-border rounded-full px-4 py-3 pr-24 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{selectedDocuments.size} sources</span>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || sendMessageMutation.isPending}
              className="p-2 rounded-full bg-secondary hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
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
