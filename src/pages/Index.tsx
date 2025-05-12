
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
    <main className="min-h-screen bg-gradient-to-b from-background to-secondary/50 p-0">
      {activeTab === 'interview' && resumeData ? (
        <InterviewChat resumeData={resumeData} onReset={handleReset} />
      ) : (
        <div className="py-8 px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-4xl mx-auto">
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
        </TabsContent>
          </Tabs>
        </div>
      )}
    </main>
  );
};

export default Index;
