import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, CheckCircle2, X, Clock, User, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ChatMessage {
  _id?: string;
  message: string;
  senderType: 'corporate' | 'admin';
  senderId: string;
  senderName: string;
  createdAt: string | Date;
}

interface ComplaintChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaintId: string;
  complaintStatus: string;
  initialMessages?: ChatMessage[];
  onStatusChange?: (newStatus: string) => void;
  onMarkResolved?: () => void;
  onMarkComplete?: () => void;
  isDarkMode?: boolean;
}

const ComplaintChatModal: React.FC<ComplaintChatModalProps> = ({
  isOpen,
  onClose,
  complaintId,
  complaintStatus,
  initialMessages = [],
  onStatusChange,
  onMarkResolved,
  onMarkComplete,
  isDarkMode = false
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && complaintId) {
      loadMessages();
    }
  }, [isOpen, complaintId]);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('corporateToken');
      if (!token) {
        console.error('No token found');
        return;
      }

      const response = await fetch(`/api/courier-complaints/${complaintId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.complaint) {
        setMessages(data.complaint.messages || []);
      } else {
        console.error('Failed to load messages:', data.error);
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      const token = localStorage.getItem('corporateToken');
      if (!token) {
        throw new Error('Please login to send messages');
      }

      const response = await fetch(`/api/courier-complaints/${complaintId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: newMessage.trim() })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to add message' }));
        throw new Error(errorData.error || `Failed to send message: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.complaint) {
        setMessages(data.complaint.messages || []);
        setNewMessage('');
        toast({
          title: "Success",
          description: "Message sent successfully",
        });
        // Reload messages to ensure we have the latest
        loadMessages();
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (date: string | Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: string | Date) => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-md h-[52vh] flex flex-col p-0 overflow-hidden",
        isDarkMode 
          ? "bg-slate-900/95 border-slate-800/60 backdrop-blur-sm" 
          : "bg-white/95 border-slate-200/60 backdrop-blur-sm"
      )}>
        <DialogHeader className={cn(
          "px-4 py-2.5 border-b shadow-sm",
          isDarkMode 
            ? "bg-gradient-to-r from-[#0f172a] via-[#1d4ed8]/40 to-[#0f172a] border-slate-700/60" 
            : "bg-gradient-to-r from-white via-[#dbeafe] to-white border-blue-100/60"
        )}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[160px]">
              <DialogTitle className={cn(
                "text-base font-normal",
                isDarkMode ? "text-slate-100" : "text-slate-900"
              )}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-1.5 rounded-lg shadow-inner",
                    isDarkMode ? "bg-blue-500/30" : "bg-blue-500/10"
                  )}>
                    <MessageSquare className={cn(
                      "h-4 w-4",
                      isDarkMode ? "text-blue-200" : "text-blue-600"
                    )} />
                  </div>
                  <span className="truncate">Complaint Chat</span>
                </div>
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end pr-8">
              <Badge 
                variant={complaintStatus === 'Resolved' ? 'default' : complaintStatus === 'Closed' ? 'secondary' : 'destructive'}
                className={cn(
                  "text-[10px] font-normal px-1.5 py-0.5",
                  isDarkMode && complaintStatus === 'Resolved' && "bg-green-900/30 text-green-300 border-green-700/50",
                  isDarkMode && complaintStatus === 'Closed' && "bg-slate-700/50 text-slate-300 border-slate-600/50"
                )}
              >
                {complaintStatus}
              </Badge>
              {(complaintStatus === 'Open' || complaintStatus === 'In Progress') && onMarkResolved && (
                <Button
                  onClick={onMarkResolved}
                  size="sm"
                    className={cn(
                    "h-7 px-2.5 text-[11px] font-normal transition-all whitespace-nowrap",
                    isDarkMode
                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-md"
                  )}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Resolve
                </Button>
              )}
              {complaintStatus === 'Resolved' && onMarkComplete && (
                <Button
                  onClick={onMarkComplete}
                  size="sm"
                    className={cn(
                    "h-7 px-2.5 text-[11px] font-normal transition-all whitespace-nowrap",
                    isDarkMode
                      ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20"
                      : "bg-green-600 hover:bg-green-700 text-white shadow-md"
                  )}
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Close
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className={cn(
          "flex-1 px-2.5 py-1.5",
          isDarkMode ? "bg-slate-900/40" : "bg-slate-50/30"
        )} ref={scrollAreaRef}>
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Clock className={cn(
                "h-5 w-5 animate-spin",
                isDarkMode ? "text-slate-400" : "text-slate-400"
              )} />
            </div>
          ) : messages.length === 0 ? (
            <div className={cn(
              "text-center py-8",
              isDarkMode ? "text-slate-400" : "text-slate-500"
            )}>
              <div className={cn(
                "w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center",
                isDarkMode ? "bg-slate-800/60" : "bg-slate-100"
              )}>
                <MessageSquare className={cn(
                  "h-6 w-6 opacity-50",
                  isDarkMode ? "text-slate-400" : "text-slate-400"
                )} />
              </div>
              <p className="text-xs font-normal">No messages yet</p>
              <p className="text-[11px] mt-1 opacity-75">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-2 py-0.5">
              {messages.map((msg, index) => {
                const isCorporate = msg.senderType === 'corporate';
                const showDate = index === 0 || 
                  formatDate(msg.createdAt) !== formatDate(messages[index - 1].createdAt);

                return (
                  <div key={msg._id || index}>
                    {showDate && (
                      <div className={cn(
                        "text-center text-[9px] py-1 font-normal",
                        isDarkMode ? "text-slate-500" : "text-slate-500"
                      )}>
                        {formatDate(msg.createdAt)}
                      </div>
                    )}
                    <div className={cn(
                      "flex gap-1.5 items-end",
                      isCorporate ? "justify-end" : "justify-start"
                    )}>
                      {!isCorporate && (
                        <div className={cn(
                          "w-5.5 h-5.5 rounded-full flex items-center justify-center flex-shrink-0 shadow",
                          isDarkMode 
                            ? "bg-gradient-to-br from-blue-600 to-blue-700" 
                            : "bg-gradient-to-br from-blue-500 to-blue-600"
                        )}>
                          <User className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[72%] rounded-xl px-2.5 py-1.5 shadow-sm",
                        isCorporate
                          ? isDarkMode
                            ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white"
                            : "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                          : isDarkMode
                            ? "bg-slate-800/60 text-slate-100 border border-slate-700/50"
                            : "bg-white text-slate-900 border border-slate-200/60 shadow-sm"
                      )}>
                        {!isCorporate && (
                          <div className={cn(
                            "text-[9px] font-normal mb-0.5",
                            isDarkMode ? "text-blue-300" : "text-blue-600"
                          )}>
                            {msg.senderName}
                          </div>
                        )}
                        <p className={cn(
                          "text-[11px] leading-snug whitespace-pre-wrap",
                          isCorporate ? "text-white" : ""
                        )} style={{ fontFamily: '"Value Serif Pro Regular", serif', fontWeight: 400 }}>{msg.message}</p>
                        <div className={cn(
                          "text-[9px] mt-0.5",
                          isCorporate
                            ? "text-blue-100/80"
                            : isDarkMode
                              ? "text-slate-400"
                              : "text-slate-500"
                        )}>
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                      {isCorporate && (
                        <div className={cn(
                          "w-5.5 h-5.5 rounded-full flex items-center justify-center flex-shrink-0 shadow",
                          isDarkMode 
                            ? "bg-gradient-to-br from-green-600 to-green-700" 
                            : "bg-gradient-to-br from-green-500 to-green-600"
                        )}>
                          <User className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className={cn(
          "px-2.5 py-1.5 border-t",
          isDarkMode 
            ? "bg-slate-800/60 border-slate-700/50" 
            : "bg-slate-50/80 border-slate-200/60"
        )}>
          <div className="flex gap-1.5">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your message..."
              className={cn(
                "min-h-[15px] max-h-[35px] resize-none text-[12px] border-0",
                isDarkMode
                  ? "bg-slate-700/60 text-slate-100 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
                  : "bg-white text-slate-900 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
              )}
              disabled={isSending || complaintStatus === 'Closed'}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending || complaintStatus === 'Closed'}
              className={cn(
                "h-[32px] px-2.5 font-normal transition-all shadow-lg text-[11px]",
                isDarkMode
                  ? "bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-orange-600/30 disabled:opacity-50"
                  : "bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-orange-600/20 disabled:opacity-50"
              )}
            >
              {isSending ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {complaintStatus === 'Closed' && (
            <div className={cn(
              "mt-1.5 p-1.5 rounded text-[10px] text-center",
              isDarkMode 
                ? "bg-slate-700/30 text-slate-400 border border-slate-600/30" 
                : "bg-slate-100 text-slate-500 border border-slate-200"
            )}>
              This complaint is closed. No further messages can be sent.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComplaintChatModal;

