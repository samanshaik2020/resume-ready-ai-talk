
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';

interface VoiceControlProps {
  onTranscript: (text: string) => void;
  isListening: boolean;
  setIsListening: (isListening: boolean) => void;
}

const VoiceControl: React.FC<VoiceControlProps> = ({
  onTranscript,
  isListening,
  setIsListening,
}) => {
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if browser supports SpeechRecognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError("Your browser doesn't support speech recognition. Try Chrome or Edge.");
      return;
    }

    // Initialize speech recognition
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();
    
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
        
      // Only send final results, indicated by isFinal property
      if (event.results[event.results.length - 1].isFinal) {
        onTranscript(transcript);
      }
    };
    
    recognition.onerror = (event) => {
      if (event.error === 'no-speech') {
        // This is a common error that we don't need to show to users
        return;
      }
      setError(`Error: ${event.error}`);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      // Only set isListening to false if we're not supposed to be listening
      if (isListening) {
        // Restart recognition (to make it continuous)
        recognition.start();
      } else {
        setIsListening(false);
      }
    };
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript, isListening, setIsListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        // Handle possible errors when starting recognition
        console.error("Error starting speech recognition:", e);
        setError("Could not start speech recognition. Please try again.");
        setIsListening(false);
      }
    }
  };

  return (
    <div className="voice-control">
      <Button 
        onClick={toggleListening}
        variant={isListening ? "destructive" : "default"}
        size="sm"
        className="rounded-full w-10 h-10 flex items-center justify-center"
        aria-label={isListening ? "Stop listening" : "Start listening"}
        disabled={!!error}
      >
        {isListening ? <MicOff size={18} /> : <Mic size={18} />}
      </Button>
      
      {error && (
        <p className="text-destructive text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default VoiceControl;
