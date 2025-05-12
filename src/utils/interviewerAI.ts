
import type { ResumeData } from "./resumeParser";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export class InterviewerAI {
  private resumeData: ResumeData | null = null;
  private conversation: Message[] = [];
  private interviewState: 'introduction' | 'questions' | 'conclusion' = 'introduction';
  private questionIndex: number = 0;

  // Common interview questions
  private commonQuestions = [
    "Can you tell me about yourself?",
    "What are your greatest strengths?",
    "What do you consider to be your weaknesses?",
    "Why are you interested in this position?",
    "Where do you see yourself in 5 years?",
    "Can you describe a challenging situation you've faced at work and how you handled it?",
    "How do you handle pressure or stressful situations?",
    "Do you have any questions for me?"
  ];

  // Questions generated based on resume
  private resumeBasedQuestions: string[] = [];

  constructor() {
    this.resetConversation();
  }

  public setResumeData(data: ResumeData) {
    this.resumeData = data;
    this.generateResumeBasedQuestions();
    this.resetConversation();
  }

  private generateResumeBasedQuestions() {
    this.resumeBasedQuestions = [];
    
    // Add questions based on experience
    if (this.resumeData?.experience && this.resumeData.experience.length > 0) {
      this.resumeBasedQuestions.push(
        "Can you tell me more about your experience at your most recent job?",
        "What were your main responsibilities in your previous position?",
        "What's the most significant project you've worked on?"
      );
    }
    
    // Add questions based on skills
    if (this.resumeData?.skills && this.resumeData.skills.length > 0) {
      const randomSkill = this.resumeData.skills[Math.floor(Math.random() * this.resumeData.skills.length)];
      this.resumeBasedQuestions.push(`I see you have ${randomSkill} listed as a skill. Can you tell me about a time you used this skill effectively?`);
      this.resumeBasedQuestions.push("How do you stay updated with the latest developments in your field?");
    }
    
    // Add questions based on education
    if (this.resumeData?.education && this.resumeData.education.length > 0) {
      this.resumeBasedQuestions.push("How has your education prepared you for this career?");
    }
  }

  private resetConversation() {
    this.conversation = [];
    this.interviewState = 'introduction';
    this.questionIndex = 0;
  }

  public async sendMessage(message: string): Promise<string> {
    // Add user message
    this.conversation.push({ role: 'user', content: message });
    
    // Generate interviewer response
    const response = await this.generateResponse();
    
    // Add interviewer response
    this.conversation.push({ role: 'assistant', content: response });
    
    return response;
  }

  private async generateResponse(): Promise<string> {
    // In a real implementation, this would call an LLM API (like GPT-4)
    // Here we're using simple logic to generate somewhat natural responses
    
    if (this.interviewState === 'introduction') {
      this.interviewState = 'questions';
      return "Hello! Thanks for joining this interview simulation. I'll be asking you some questions based on the resume you've provided. Let's start with a common question: Can you tell me a little about yourself?";
    }
    
    if (this.interviewState === 'questions') {
      const lastUserMessage = this.conversation.filter(msg => msg.role === 'user').pop();
      
      // If the user asked a question, respond to it
      if (lastUserMessage?.content.trim().endsWith('?')) {
        return this.handleUserQuestion(lastUserMessage.content);
      }
      
      // Ask the next question
      this.questionIndex++;
      
      // Mix common and resume-based questions
      const allQuestions = [...this.commonQuestions, ...this.resumeBasedQuestions];
      
      if (this.questionIndex >= allQuestions.length) {
        this.interviewState = 'conclusion';
        return "We're coming to the end of our interview. Is there anything else you'd like to highlight or any questions you have for me?";
      }
      
      return `Thank you for that answer. ${allQuestions[this.questionIndex % allQuestions.length]}`;
    }
    
    if (this.interviewState === 'conclusion') {
      this.resetConversation();
      return "Thank you for participating in this interview simulation. You can upload a new resume or start a new interview anytime.";
    }
    
    return "I'm not sure how to respond to that.";
  }
  
  private handleUserQuestion(question: string): string {
    // Simple handling of user questions
    if (question.toLowerCase().includes('salary') || question.toLowerCase().includes('pay')) {
      return "That's a good question about compensation. The salary range for this position is competitive and depends on experience and qualifications. We can definitely discuss specific numbers as we move forward in the process.";
    }
    
    if (question.toLowerCase().includes('remote') || question.toLowerCase().includes('work from home')) {
      return "Regarding remote work, our company currently has a hybrid policy allowing for 2-3 days of remote work per week, though this can vary by team and department.";
    }
    
    if (question.toLowerCase().includes('benefits') || question.toLowerCase().includes('healthcare')) {
      return "We offer a comprehensive benefits package including health insurance, dental, vision, 401(k) matching, and professional development opportunities.";
    }
    
    // Generic response for other questions
    return "That's a great question. In a real interview, the employer would provide specific information about the company and position. For this simulation, let's continue with the interview questions.";
  }
}

export default new InterviewerAI();
