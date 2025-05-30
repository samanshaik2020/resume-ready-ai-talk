import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Info } from 'lucide-react';
import interviewerAI from '@/utils/interviewerAI';
import VoiceControl from './VoiceControl';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface InterviewChatProps {
  resumeData: any;
  onReset: () => void;
}

const InterviewChat: React.FC<InterviewChatProps> = ({ resumeData, onReset }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize the interview with resume data
    interviewerAI.setResumeData(resumeData);
    startInterview();
  }, [resumeData]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startInterview = async () => {
    // Get the first message from the interviewer
    setIsProcessing(true);
    const response = await interviewerAI.sendMessage('');
    setIsProcessing(false);

    addMessage(response, 'assistant');
  };

  const addMessage = (content: string, role: 'user' | 'assistant') => {
    const newMessage = {
      id: Date.now().toString(),
      content,
      role,
      timestamp: new Date(),
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!input.trim() && !isListening) return;
    
    // Add user message to chat
    const userMessage = input.trim();
    addMessage(userMessage, 'user');
    setInput('');
    
    // Get response from AI
    setIsProcessing(true);
    const response = await interviewerAI.sendMessage(userMessage);
    setIsProcessing(false);

    // Add AI response
    addMessage(response, 'assistant');
  };

  const handleVoiceTranscript = (transcript: string) => {
    setInput(transcript);
    // Auto-submit after a brief pause to give user time to see what was transcribed
    setTimeout(() => {
      handleSubmit();
    }, 500);
  };

  return (
    <Card className="w-full h-screen fixed top-0 left-0 right-0 z-50 shadow-lg flex flex-col" style={{ height: '100vh' }}>
      <CardHeader className="px-4 py-3 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>AI</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">AI Job Candidate</CardTitle>
              <CardDescription className="text-xs">Answers based on resume data</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Info className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Ask interview questions and get human-like responses. Try questions about projects or skills.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="outline" size="sm" onClick={onReset}>
              New Interview
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-grow p-0 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`mb-4 ${message.role === 'assistant' ? 'mr-8' : 'ml-8'}`}
              >
                <div
                  className={`p-3 rounded-lg ${
                    message.role === 'assistant'
                      ? 'bg-muted text-foreground rounded-tl-none'
                      : 'bg-primary text-primary-foreground rounded-tr-none'
                  }`}
                >
                  {message.content}
                </div>
                <div
                  className={`text-xs mt-1 text-muted-foreground ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
            
            {isProcessing && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted text-foreground rounded-tl-none mr-8 animate-pulse">
                <div className="h-2 w-2 rounded-full bg-current"></div>
                <div className="h-2 w-2 rounded-full bg-current"></div>
                <div className="h-2 w-2 rounded-full bg-current"></div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>
      
      <CardFooter className="p-3 border-t sticky bottom-0 bg-background">
        <div className="flex flex-col w-full gap-3">
          <div className="flex justify-center items-center w-full">
            <VoiceControl
              onTranscript={handleVoiceTranscript}
              isListening={isListening}
              setIsListening={setIsListening}
            />
          </div>
          
          <form onSubmit={handleSubmit} className="flex gap-2 w-full">
            <Input
              placeholder="Type your interview question here..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isProcessing}
              className="flex-grow"
              autoFocus
            />
            <Button 
              type="submit" 
              size="icon" 
              disabled={(!input.trim() && !isListening) || isProcessing}
              className="bg-primary hover:bg-primary/90"
            >
              <Send size={18} />
            </Button>
          </form>
        </div>
      </CardFooter>
    </Card>
  );
};

export default InterviewChat;
