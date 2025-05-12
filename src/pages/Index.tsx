
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import ResumeUpload from '@/components/ResumeUpload';
import InterviewChat from '@/components/InterviewChat';

const Index = () => {
  const [resumeData, setResumeData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('upload');

  const handleResumeProcessed = (data: any) => {
    setResumeData(data);
    setActiveTab('interview');
  };

  const handleReset = () => {
    setResumeData(null);
    setActiveTab('upload');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            AI Interview Simulator
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload your resume and practice your interview skills with our AI interviewer.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="upload">Upload Resume</TabsTrigger>
            <TabsTrigger value="interview" disabled={!resumeData}>
              Interview
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-6">
            <ResumeUpload onResumeProcessed={handleResumeProcessed} />
          </TabsContent>
          
          <TabsContent value="interview" className="mt-6">
            {resumeData ? (
              <InterviewChat resumeData={resumeData} onReset={handleReset} />
            ) : (
              <Card className="w-full max-w-xl mx-auto">
                <CardHeader>
                  <CardTitle>Upload Your Resume First</CardTitle>
                  <CardDescription>
                    Please upload your resume to start the interview simulation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <button 
                    onClick={() => setActiveTab('upload')}
                    className="text-primary hover:underline"
                  >
                    Go to Resume Upload
                  </button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            This AI Interview Simulator analyzes your resume to create a personalized interview experience.
            Practice your interview skills with voice or text responses.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
