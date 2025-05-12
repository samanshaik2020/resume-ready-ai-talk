
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { parseResumePDF, parseResumeText } from '@/utils/resumeParser';
import { useToast } from '@/components/ui/use-toast';
import { initPDFJS } from '@/utils/pdfParser';
import { Progress } from '@/components/ui/progress';

interface ResumeUploadProps {
  onResumeProcessed: (resumeData: any) => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onResumeProcessed }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [textInput, setTextInput] = useState('');
  const [uploadType, setUploadType] = useState<'file' | 'text'>('file');
  const { toast } = useToast();
  
  // Initialize PDF.js when component mounts
  useEffect(() => {
    initPDFJS();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTextInput(e.target.value);
  };

  const handleSubmit = async () => {
    try {
      setIsUploading(true);
      setProgress(10);

      if (uploadType === 'file' && file) {
        // Show parsing progress
        setProgress(30);
        
        try {
          let resumeData;
          
          if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            // Process PDF
            setProgress(50);
            resumeData = await parseResumePDF(file);
          } else {
            // Process text file
            setProgress(50);
            const text = await file.text();
            resumeData = await parseResumeText(text);
          }
          
          // Text extraction complete
          setProgress(70);
          
          // Log the extracted data for debugging
          console.log('Extracted resume data:', resumeData);
          
          // Processing complete
          setProgress(100);
          
          // Pass the extracted data to the parent component
          onResumeProcessed(resumeData);
          
          toast({
            title: 'Resume Uploaded',
            description: 'Your resume has been successfully analyzed and loaded into the AI.',
          });
        } catch (error) {
          console.error('Error parsing file:', error);
          toast({
            title: 'Parsing Error',
            description: 'Error parsing your resume. Please try a different file or paste the text directly.',
            variant: 'destructive',
          });
        }
      } else if (uploadType === 'text' && textInput.trim()) {
        // Process pasted text
        setProgress(30);
        
        // Format the pasted text to ensure consistent spacing
        let formattedText = textInput;
        
        // Handle example resume format with special characters
        formattedText = formattedText.replace(/◇/g, ' | '); // Replace diamond with pipe
        
        // Make sure bullet points are consistent
        formattedText = formattedText.replace(/•/g, '•'); // Standardize bullets
        
        setProgress(50);
        const resumeData = await parseResumeText(formattedText);
        
        // Show projects in console for debugging
        console.log('Extracted Projects:', resumeData.projects);
        
        setProgress(100);
        onResumeProcessed(resumeData);
        
        toast({
          title: 'Resume Processed',
          description: `Your resume has been analyzed. Found ${resumeData.projects.length} projects and ${resumeData.skills.length} skills.`,
        });
      } else {
        toast({
          title: 'Input Required',
          description: 'Please upload a file or enter resume text to continue.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error processing resume:', error);
      toast({
        title: 'Processing Error',
        description: 'There was an error processing your resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      // Reset progress after a short delay to show completion
      setTimeout(() => setProgress(0), 1000);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto animate-fade-in">
      <CardHeader>
        <CardTitle>Upload Your Resume</CardTitle>
        <CardDescription>
          Upload your resume to start the interview simulation.
          We'll analyze it to create a personalized interview experience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-4">
          <Button
            variant={uploadType === 'file' ? 'default' : 'outline'}
            onClick={() => setUploadType('file')}
            className="flex-1"
          >
            Upload File
          </Button>
          <Button
            variant={uploadType === 'text' ? 'default' : 'outline'}
            onClick={() => setUploadType('text')}
            className="flex-1"
          >
            Paste Text
          </Button>
        </div>

        {uploadType === 'file' ? (
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded-lg p-8">
            <input
              type="file"
              id="resume-upload"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.txt,.doc,.docx"
            />
            <label
              htmlFor="resume-upload"
              className="cursor-pointer text-center flex flex-col items-center gap-2"
            >
              <div className="rounded-full bg-primary/10 p-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <div className="text-sm font-medium">
                Click to upload or drag and drop
              </div>
              <p className="text-xs text-muted-foreground">PDF, TXT, DOC, DOCX (Max 5MB)</p>
            </label>
            {file && (
              <div className="mt-4 text-sm">
                Selected file: <span className="font-medium">{file.name}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label htmlFor="resume-text" className="text-sm font-medium">
              Paste your resume text
            </label>
            <textarea
              id="resume-text"
              className="min-h-[200px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Copy and paste your resume text here..."
              value={textInput}
              onChange={handleTextChange}
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        {progress > 0 && (
          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Analyzing resume...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isUploading || (uploadType === 'file' && !file) || (uploadType === 'text' && !textInput.trim())}
          className="w-full"
        >
          {isUploading ? "Processing Resume..." : "Start Interview"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResumeUpload;
