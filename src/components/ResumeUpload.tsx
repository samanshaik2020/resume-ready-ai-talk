
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { parseResumePDF, parseResumeText } from '@/utils/resumeParser';
import { useToast } from '@/components/ui/use-toast';

interface ResumeUploadProps {
  onResumeProcessed: (resumeData: any) => void;
}

const ResumeUpload: React.FC<ResumeUploadProps> = ({ onResumeProcessed }) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [uploadType, setUploadType] = useState<'file' | 'text'>('file');
  const { toast } = useToast();

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

      if (uploadType === 'file' && file) {
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          const resumeData = await parseResumePDF(file);
          onResumeProcessed(resumeData);
          toast({
            title: 'Resume Uploaded',
            description: 'Your resume has been successfully analyzed.',
          });
        } else {
          // Assume it's a text file
          const text = await file.text();
          const resumeData = await parseResumeText(text);
          onResumeProcessed(resumeData);
          toast({
            title: 'Resume Uploaded',
            description: 'Your resume has been successfully analyzed.',
          });
        }
      } else if (uploadType === 'text' && textInput.trim()) {
        const resumeData = await parseResumeText(textInput);
        onResumeProcessed(resumeData);
        toast({
          title: 'Resume Processed',
          description: 'Your resume text has been successfully analyzed.',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Please upload a file or enter resume text.',
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
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={isUploading || (uploadType === 'file' && !file) || (uploadType === 'text' && !textInput.trim())}
          className="w-full"
        >
          {isUploading ? "Processing..." : "Start Interview"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResumeUpload;
