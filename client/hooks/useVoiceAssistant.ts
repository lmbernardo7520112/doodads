"use client";

import { useState, useRef, useCallback } from 'react';
import axios from 'axios';

interface VoiceResponse {
    text: string;
    intent: any;
    transcription: string;
}

export const useVoiceAssistant = () => {
    const [isListening, setIsListening] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const startListening = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await processAudio(audioBlob);
            };

            mediaRecorder.start();
            setIsListening(true);
        } catch (error) {
            console.error("Error accessing microphone:", error);
            alert("Could not access microphone. Please check permissions.");
        }
    }, []);

    const stopListening = useCallback(() => {
        if (mediaRecorderRef.current && isListening) {
            mediaRecorderRef.current.stop();
            setIsListening(false);
            setIsProcessing(true);
            // Stop all tracks to release microphone
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
    }, [isListening]);

    const processAudio = async (audioBlob: Blob) => {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'command.webm');

        // Robustly construct URL to avoid /api/api/ duplication
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        // Remove trailing slash and optional /api suffix to get the pure host
        const host = baseUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
        const apiUrl = `${host}/api/voice/command`;

        console.log("🎤 Sending audio to:", apiUrl);

        try {
            const response = await axios.post<VoiceResponse>(
                apiUrl,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            const { text, transcription } = response.data;

            setMessages(prev => [
                ...prev,
                { role: 'user', content: transcription },
                { role: 'assistant', content: text }
            ]);

            speakResponse(text);

        } catch (error) {
            console.error("Error processing voice command:", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Desculpe, não consegui entender. Pode repetir?" }]);
            speakResponse("Desculpe, não consegui entender. Pode repetir?");
        } finally {
            setIsProcessing(false);
        }
    };

    const speakResponse = (text: string) => {
        if (!window.speechSynthesis) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';

        // Improve voice selection
        const voices = window.speechSynthesis.getVoices();

        // Priority list for male/neutral voices
        const preferredVoices = [
            'Microsoft Antonio Online (Natural) - Portuguese (Brazil)',
            'Google Português do Brasil', // Often gender-neutral or male-sounding depending on OS
            'Luciana' // Fallback
        ];

        const selectedVoice = voices.find(voice =>
            preferredVoices.some(preferred => voice.name.includes(preferred))
        ) || voices.find(voice => voice.lang === 'pt-BR');

        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        // Adjust parameters for more natural sound
        utterance.pitch = 1.0; // Normal pitch
        utterance.rate = 0.9;  // Slower for better clarity (requested "less bit fast")
        utterance.volume = 1.0;

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
            console.error("TTS Error:", e);
            setIsSpeaking(false);
        };

        window.speechSynthesis.speak(utterance);
    };

    return {
        isListening,
        isProcessing,
        isSpeaking,
        messages,
        startListening,
        stopListening
    };
};
