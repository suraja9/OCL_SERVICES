import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, X, Clock, User, MessageSquare, Package, CheckCircle2 } from 'lucide-react';
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

interface CourierComplaintChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  complaint: {
    _id: string;
    consignmentNumber: string;
    subject: string;
    category: string;
    priority: string;
    status: string;
    corporateInfo?: {
      companyName: string;
      email: string;
      contactNumber: string;
    };
    shipmentInfo?: {
      destination: string;
      courierName?: string;
    };
    messages?: ChatMessage[];
  };
  onStatusChange?: () => void;
}

const CourierComplaintChatModal: React.FC<CourierComplaintChatModalProps> = ({
  isOpen,
  onClose,
  complaint,
  onStatusChange
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(complaint?.messages || []);
  const [newMessage, setNewMessage] = useState('');
  const [newStatus, setNewStatus] = useState(complaint?.status || 'Open');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const API_BASE: string = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:5000';

  useEffect(() => {
    if (isOpen && complaint) {
      const complaintId = complaint._id || (complaint as any).id;
      if (complaintId) {
        setError(null);
        loadMessages();
        setNewStatus(complaint.status || 'Open');
      } else {
        setError('Invalid complaint: Missing ID');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, complaint?._id, complaint?.status]);

  useEffect(() => {
    if (complaint?.messages) {
      setMessages(complaint.messages);
    }
  }, [complaint?.messages]);

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
    const complaintId = complaint?._id || (complaint as any)?.id;
    if (!complaintId) {
      setError('Invalid complaint ID');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        setError('Please login as admin');
        return;
      }

      const response = await fetch(`${API_BASE}/api/admin/courier-complaints/${complaintId}/messages`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load messages: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setMessages(data.data?.messages || []);
      } else {
        throw new Error(data.error || 'Failed to load messages');
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
      setError(error instanceof Error ? error.message : 'Failed to load messages');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !complaint) return;
    
    const complaintId = complaint._id || (complaint as any)?.id;
    if (!complaintId) {
      toast({
        title: "Error",
        description: "Invalid complaint ID",
        variant: "destructive"
      });
      return;
    }

    setIsSending(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        throw new Error('Please login as admin');
      }

      const response = await fetch(`${API_BASE}/api/admin/courier-complaints/${complaintId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          message: newMessage.trim(),
          status: newStatus !== complaint.status ? newStatus : undefined
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success) {
        setMessages(data.data?.messages || []);
        setNewMessage('');
        if (newStatus !== complaint.status) {
          setNewStatus(newStatus);
          if (onStatusChange) onStatusChange();
        }
        toast({
          title: "Success",
          description: "Message sent successfully",
        });
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
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

  const complaintId = complaint?._id || (complaint as any)?.id;
  
  if (!complaint || !complaintId) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-red-600">Invalid complaint data. Please try again.</p>
            <Button onClick={onClose} className="mt-4">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-md h-[52vh] flex flex-col p-0 overflow-hidden",
        "bg-white/95 border-slate-200/60 backdrop-blur-sm"
      )}>
        <DialogHeader className={cn(
          "px-4 py-2.5 border-b shadow-sm",
          "bg-gradient-to-r from-white via-[#dbeafe] to-white border-blue-100/60"
        )}>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[160px]">
              <DialogTitle className="text-base font-normal text-slate-900">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg shadow-inner bg-blue-500/10">
                    <MessageSquare className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="truncate">Complaint Chat</span>
                </div>
              </DialogTitle>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end pr-8">
              <Badge 
                variant={newStatus === 'Resolved' ? 'default' : newStatus === 'Closed' ? 'secondary' : 'destructive'}
                className="text-[10px] font-normal px-1.5 py-0.5"
              >
                {newStatus}
              </Badge>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger className="h-7 px-2.5 text-[11px] font-normal w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Resolved">Resolved</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-600 flex items-center gap-2">
            <Package className="h-3 w-3" />
            <span className="font-mono">{complaint.consignmentNumber || 'N/A'}</span>
            <span className="text-gray-400">•</span>
            <span className="truncate">{complaint.corporateInfo?.companyName || 'N/A'}</span>
          </div>
        </DialogHeader>

        <ScrollArea className={cn(
          "flex-1 px-2.5 py-1.5",
          "bg-slate-50/30"
        )} ref={scrollAreaRef}>
          {error ? (
            <div className="flex flex-col items-center justify-center h-full text-red-600">
              <X className="h-12 w-12 mb-4 opacity-50" />
              <p className="text-center text-sm">{error}</p>
              <Button
                onClick={loadMessages}
                variant="outline"
                size="sm"
                className="mt-4"
              >
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Clock className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center bg-slate-100">
                <MessageSquare className="h-6 w-6 opacity-50 text-slate-400" />
              </div>
              <p className="text-xs font-normal">No messages yet</p>
              <p className="text-[11px] mt-1 opacity-75">Start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-2 py-0.5">
              {messages.map((msg, index) => {
                const isAdmin = msg.senderType === 'admin';
                const showDate = index === 0 || 
                  formatDate(msg.createdAt) !== formatDate(messages[index - 1].createdAt);

                return (
                  <div key={msg._id || index}>
                    {showDate && (
                      <div className="text-center text-[9px] py-1 font-normal text-slate-500">
                        {formatDate(msg.createdAt)}
                      </div>
                    )}
                    <div className={cn(
                      "flex gap-1.5 items-end",
                      isAdmin ? "justify-end" : "justify-start"
                    )}>
                      {!isAdmin && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 shadow bg-gradient-to-br from-blue-500 to-blue-600">
                          <User className="h-3.5 w-3.5 text-white" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[72%] rounded-xl px-2.5 py-1.5 shadow-sm",
                        isAdmin
                          ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                          : "bg-white text-slate-900 border border-slate-200/60 shadow-sm"
                      )}>
                        {!isAdmin && (
                          <div className="text-[9px] font-normal mb-0.5 text-blue-600">
                            {msg.senderName}
                          </div>
                        )}
                        <p className={cn(
                          "text-[11px] leading-snug whitespace-pre-wrap",
                          isAdmin ? "text-white" : ""
                        )} style={{ fontFamily: '"Value Serif Pro Regular", serif', fontWeight: 400 }}>{msg.message}</p>
                        <div className={cn(
                          "text-[9px] mt-0.5",
                          isAdmin
                            ? "text-blue-100/80"
                            : "text-slate-500"
                        )}>
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                      {isAdmin && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 shadow bg-gradient-to-br from-green-500 to-green-600">
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
          "bg-slate-50/80 border-slate-200/60"
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
                "bg-white text-slate-900 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
              )}
              disabled={isSending || newStatus === 'Closed'}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending || newStatus === 'Closed'}
              className={cn(
                "h-[32px] px-2.5 font-normal transition-all shadow-lg text-[11px]",
                "bg-gradient-to-br from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white shadow-orange-600/20 disabled:opacity-50"
              )}
            >
              {isSending ? (
                <Clock className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {newStatus === 'Closed' && (
            <div className="mt-1.5 p-1.5 rounded text-[10px] text-center bg-slate-100 text-slate-500 border border-slate-200">
              This complaint is closed. No further messages can be sent.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourierComplaintChatModal;

