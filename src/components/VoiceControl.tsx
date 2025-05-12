import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [isPressHolding, setIsPressHolding] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Check browser support for speech recognition
  useEffect(() => {
    // Check if browser supports SpeechRecognition
    const isSupported = ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
    
    if (!isSupported) {
      setError("Your browser doesn't support speech recognition. Try Chrome or Edge.");
      return;
    }
    
    // Request microphone permission
    const requestMicPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.error("Error requesting microphone permission:", e);
        setError("Please allow microphone access to use voice recognition.");
      }
    };
    
    requestMicPermission();
    
    // Cleanup function
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
  }, []);
  
  // Function to start listening
  const startListening = () => {
    try {
      // Create a new recognition instance each time
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      // Configure it
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      // Set up handlers
      recognition.onstart = () => {
        console.log('Speech recognition started');
      };
      
      recognition.onresult = (event: any) => {
        const results = event.results;
        if (results && results.length > 0) {
          const transcript = results[0][0].transcript;
          console.log("Speech recognition result:", transcript);
          setCurrentTranscript(transcript);
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setError(`Error: ${event.error}`);
        }
      };
      
      recognition.onend = () => {
        console.log('Speech recognition ended');
        setIsListening(false);
      };
      
      // Store the recognition instance
      recognitionRef.current = recognition;
      
      // Reset state
      setError(null);
      setCurrentTranscript('');
      setIsPressHolding(true);
      setIsListening(true);
      
      // Start recognition
      recognition.start();
      console.log("Voice recognition started");
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
      setError("Failed to start speech recognition. Please try again.");
      setIsPressHolding(false);
      setIsListening(false);
    }
  };
  
  // Function to stop listening
  const stopListening = () => {
    // Get the final transcript
    const finalTranscript = currentTranscript.trim();
    
    // Stop recognition if it exists
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        console.log("Recognition stopped successfully");
      } catch (e) {
        console.error("Error stopping recognition:", e);
      }
      
      // Clear the reference
      recognitionRef.current = null;
    }
    
    // Reset UI state
    setIsPressHolding(false);
    setIsListening(false);
    
    // Submit the transcript
    if (finalTranscript) {
      console.log("Submitting transcript on release:", finalTranscript);
      onTranscript(finalTranscript);
    }
  };
  
  // Toggle function for the small button
  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="voice-control flex flex-col items-center justify-center">
      {/* Small Button for toggle mode */}
      <Button 
        onClick={toggleListening}
        variant={isListening ? "destructive" : "default"}
        size="sm"
        className="rounded-full w-10 h-10 flex items-center justify-center mb-2"
        aria-label={isListening ? "Stop listening" : "Start listening"}
        disabled={!!error || isPressHolding}
      >
        {isListening && !isPressHolding ? <MicOff size={18} /> : <Mic size={18} />}
      </Button>
      
      {/* Large button for press-and-hold */}
      <Button
        ref={buttonRef}
        variant="outline"
        size="lg"
        className={cn(
          "rounded-full w-20 h-20 flex items-center justify-center transition-all",
          isPressHolding && "bg-red-100 shadow-lg scale-110"
        )}
        onMouseDown={startListening}
        onMouseUp={stopListening}
        onMouseLeave={stopListening}
        onTouchStart={startListening}
        onTouchEnd={stopListening}
        onTouchCancel={stopListening}
        disabled={!!error}
      >
        <div className="flex flex-col items-center">
          <Mic size={isPressHolding ? 36 : 28} className={cn(
            "transition-all",
            isPressHolding && "text-red-600"
          )} />
          <span className="text-xs mt-1">{isPressHolding ? "Release" : "Hold"}</span>
        </div>
      </Button>
      
      {isListening && (
        <p className="text-sm mt-2 text-muted-foreground animate-pulse font-medium">Listening...</p>
      )}
      
      {error && (
        <p className="text-destructive text-sm mt-2">{error}</p>
      )}
    </div>
  );
};

export default VoiceControl;