"use client";

import React from 'react';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export const VoiceAssistant: React.FC = () => {
    const {
        isListening,
        isProcessing,
        isSpeaking,
        messages,
        startListening,
        stopListening
    } = useVoiceAssistant();

    const [isOpen, setIsOpen] = React.useState(false);

    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            setIsOpen(true);
            startListening();
        }
    };

    if (!isOpen && messages.length === 0 && !isListening) {
        return (
            <Button
                onClick={toggleListening}
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-xl z-50 bg-primary hover:bg-primary/90 transition-all duration-300"
            >
                <Mic className="h-6 w-6 text-white" />
            </Button>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
            {isOpen && (
                <Card className="w-80 shadow-2xl border-primary/20 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Agenda.ai Assistant</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-6 w-6 p-0">
                            &times;
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 max-h-60 overflow-y-auto mb-4 text-sm">
                            {messages.length === 0 && (
                                <p className="text-muted-foreground text-center py-4">
                                    Como posso ajudar você hoje?
                                </p>
                            )}
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                                        }`}
                                >
                                    <div
                                        className={`rounded-lg px-3 py-2 max-w-[85%] ${msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-muted'
                                            }`}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isProcessing && (
                                <div className="flex justify-start">
                                    <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2 text-muted-foreground">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        Processando...
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center">
                            <Button
                                size="lg"
                                variant={isListening ? "destructive" : "default"}
                                className={`rounded-full h-16 w-16 shadow-lg transition-all duration-300 ${isListening ? "animate-pulse scale-110" : ""
                                    }`}
                                onClick={toggleListening}
                                disabled={isProcessing || isSpeaking}
                            >
                                {isListening ? (
                                    <MicOff className="h-8 w-8" />
                                ) : isSpeaking ? (
                                    <Volume2 className="h-8 w-8 animate-bounce" />
                                ) : (
                                    <Mic className="h-8 w-8" />
                                )}
                            </Button>
                        </div>
                        <p className="text-center text-xs text-muted-foreground mt-2">
                            {isListening
                                ? "Ouvindo..."
                                : isProcessing
                                    ? "Pensando..."
                                    : isSpeaking
                                        ? "Falando..."
                                        : "Toque para falar"}
                        </p>
                    </CardContent>
                </Card>
            )}

            {!isOpen && (
                <Button
                    onClick={() => setIsOpen(true)}
                    className="h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90"
                >
                    <Mic className="h-6 w-6 text-white" />
                </Button>
            )}
        </div>
    );
};
