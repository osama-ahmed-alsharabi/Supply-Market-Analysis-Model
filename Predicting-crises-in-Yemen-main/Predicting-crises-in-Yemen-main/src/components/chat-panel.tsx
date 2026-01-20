'use client';

import * as React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Send, User, Paperclip, Mic, Eraser, Maximize2, Sparkles, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';

export type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
};

type ChatPanelProps = {
    messages: ChatMessage[];
    onSendMessage: (message: string) => void;
    isSending: boolean;
    isChatEnabled: boolean;
};

export function ChatPanel({ messages, onSendMessage, isSending, isChatEnabled }: ChatPanelProps) {
    const [input, setInput] = React.useState('');
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    React.useEffect(() => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTo({
                top: scrollAreaRef.current.scrollHeight,
                behavior: 'smooth',
            });
        }
    }, [messages, isSending]);

    const handleSendMessage = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (input.trim() && !isSending && isChatEnabled) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const clearChat = () => {
        // In a real app, this would probably be a prop or context action
        // For now, we'll just show it visually as disabled/action
    };

    return (
        <Card className="flex flex-col h-full border-muted/40 shadow-xl overflow-hidden bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <CardHeader className="border-b px-6 py-4 bg-muted/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold">AI Assistant</CardTitle>
                            <CardDescription className="text-xs">Always here to explain results</CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-grow flex flex-col p-0 overflow-hidden relative">
                <ScrollArea className="flex-grow px-4 py-4" viewportRef={scrollAreaRef}>
                    <div className="space-y-6 pb-4">
                        {!isChatEnabled && messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 text-muted-foreground opacity-60">
                                <Bot className="h-12 w-12 mb-2" />
                                <p>Run a prediction to start analyzing.</p>
                            </div>
                        )}

                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={cn('flex items-start gap-3 group', message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                            >
                                <Avatar className="h-8 w-8 mt-1 border shadow-sm shrink-0">
                                    {message.role === 'assistant' ? (
                                        <AvatarFallback className="bg-primary/10 text-primary">
                                            <Bot className="h-4 w-4" />
                                        </AvatarFallback>
                                    ) : (
                                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                                            <User className="h-4 w-4" />
                                        </AvatarFallback>
                                    )}
                                </Avatar>

                                <div
                                    className={cn(
                                        'max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm leading-relaxed',
                                        message.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                                            : 'bg-muted/50 border border-muted-foreground/10 rounded-tl-none'
                                    )}
                                >
                                    {message.content}
                                </div>
                            </div>
                        ))}

                        {isSending && (
                            <div className="flex items-start gap-3">
                                <Avatar className="h-8 w-8 mt-1 border shadow-sm shrink-0">
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        <Bot className="h-4 w-4" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="bg-muted/50 border border-muted-foreground/10 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1.5 h-[46px]">
                                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce" />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 bg-background border-t">
                    <div className={cn(
                        "relative rounded-xl border bg-muted/30 focus-within:bg-background focus-within:ring-2 focus-within:ring-primary/20 transition-all",
                        !isChatEnabled && "opacity-50 cursor-not-allowed"
                    )}>
                        <Textarea
                            ref={textareaRef}
                            placeholder={isChatEnabled ? "Ask a follow-up question..." : "Prediction required first..."}
                            value={input}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={!isChatEnabled || isSending}
                            className="w-full min-h-[60px] max-h-[120px] p-3 pr-12 bg-transparent border-0 focus-visible:ring-0 resize-none placeholder:text-muted-foreground/70"
                        />

                        {/* Toolbar */}
                        <div className="flex items-center justify-between px-2 pb-2 h-10">
                            <div className="flex items-center gap-1">
                                <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" disabled>
                                                <Paperclip className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">Attach file (Coming Soon)</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" disabled>
                                                <Mic className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">Voice Input (Coming Soon)</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setInput('')}>
                                                <Eraser className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">Clear Input</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>

                                <TooltipProvider delayDuration={0}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                onClick={() => setInput('Please provide a summary of the key insights and important metrics from the current data.')}
                                            >
                                                <FileText className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top">Generate Summary</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>

                            <Button
                                size="sm"
                                onClick={() => handleSendMessage()}
                                disabled={!isChatEnabled || isSending || !input.trim()}
                                className={cn("h-8 px-3 transition-all", input.trim() ? "w-auto" : "w-8 px-0")}
                            >
                                <Send className={cn("h-4 w-4", input.trim() && "mr-2")} />
                                {input.trim() && <span className="sr-only sm:not-sr-only sm:inline">Send</span>}
                            </Button>
                        </div>
                    </div>
                    <div className="text-center mt-2 pb-1">
                        <p className="text-[10px] text-muted-foreground/60">
                            AI may generate inaccurate information.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
