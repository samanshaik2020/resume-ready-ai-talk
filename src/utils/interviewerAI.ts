
import type { ResumeData } from "./resumeParser";
import { toast } from "@/components/ui/use-toast";

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * This class provides AI-powered interview response functionality.
 * The USER acts as the interviewer asking questions, and the AI provides
 * human-like responses as if it's the interviewee/job candidate.
 */
export class InterviewerAI {
  private resumeData: ResumeData | null = null;
  private conversation: Message[] = [];
  private interviewState: 'waiting' | 'answering' = 'waiting';
  private apiKey: string = "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";

  // Sample skills and experience to use in responses if no resume data is available
  private fallbackSkills = [
    "JavaScript", "React", "Node.js", "TypeScript", "HTML/CSS", "Git", 
    "Problem Solving", "Team Collaboration", "Communication", "Project Management"
  ];
  
  private fallbackExperience = [
    {
      company: "Tech Solutions Inc.",
      role: "Software Developer",
      duration: "2 years",
      achievements: [
        "Developed responsive web applications using React and TypeScript",
        "Collaborated with cross-functional teams to deliver projects on time",
        "Implemented CI/CD pipelines to improve development workflow"
      ]
    }
  ];

  constructor() {
    this.resetConversation();
  }

  public setResumeData(data: ResumeData) {
    this.resumeData = data;
    this.resetConversation();
  }

  // Get available skills from resume or fallback
  private getSkills(): string[] {
    if (this.resumeData?.skills && this.resumeData.skills.length > 0) {
      return this.resumeData.skills;
    }
    return this.fallbackSkills;
  }
  
  // Get available experience from resume or fallback
  private getExperience(): any[] {
    if (this.resumeData?.experience && this.resumeData.experience.length > 0) {
      return this.resumeData.experience;
    }
    return this.fallbackExperience;
  }
  
  // Get education from resume or fallback
  private getEducation(): any[] {
    if (this.resumeData?.education && this.resumeData.education.length > 0) {
      return this.resumeData.education;
    }
    return [{ degree: "Bachelor's in Computer Science", school: "University of Technology", year: "2021" }];
  }

  private resetConversation() {
    this.conversation = [];
    this.interviewState = 'waiting';
  }

  public async sendMessage(message: string): Promise<string> {
    // Skip empty messages
    if (!message.trim()) {
      return "I'm ready for your interview questions. What would you like to ask me?";
    }
    
    // Add interviewer (user) message
    this.conversation.push({ role: 'user', content: message });
    this.interviewState = 'answering';
    
    // Generate candidate (AI) response
    const response = await this.generateResponse(message);
    
    // Add candidate (AI) response
    this.conversation.push({ role: 'assistant', content: response });
    this.interviewState = 'waiting';
    
    return response;
  }

  private async generateResponse(question: string): Promise<string> {
    try {
      // Create a prompt based on the resume data and question
      const skills = this.getSkills();
      const experience = this.getExperience();
      const education = this.getEducation();
      
      let resumeContext = ``;
      if (this.resumeData) {
        resumeContext = `
My resume data includes:
Skills: ${skills.join(', ')}
`;
        
        if (experience.length > 0) {
          resumeContext += `Experience: \n`;
          experience.forEach((exp, index) => {
            resumeContext += `- ${exp.role || exp.title || 'Role'} at ${exp.company || exp.organization || 'Company'} ${exp.duration ? `for ${exp.duration}` : ''}`;
            if (exp.achievements && exp.achievements.length) {
              resumeContext += ` where I ${exp.achievements.join(', ')}`;
            }
            resumeContext += '\n';
          });
        }
        
        if (education.length > 0) {
          resumeContext += `Education: \n`;
          education.forEach((edu) => {
            resumeContext += `- ${edu.degree || 'Degree'} from ${edu.school || edu.university || 'School'} ${edu.year ? `(${edu.year})` : ''}`;
            resumeContext += '\n';
          });
        }
      }
      
      // Extract personal info and projects from resume data or use defaults if not available
      const extractResumeDetails = () => {
        // Default values
        const defaults = {
          name: 'Candidate',
          location: 'Hyderabad, Telangana',
          college: 'XYZ College',
          degree: 'B.Tech in Computer Science',
          family: 'We are four members. My father is a government employee, my mother is a homemaker, and I have a younger sister who is currently studying.',
          projects: [
            {
              name: 'Online Placement Management System',
              description: 'developed a web-based platform to help students register and apply for campus placements efficiently',
              technologies: ['HTML', 'CSS', 'JavaScript', 'PHP', 'MySQL']
            },
            {
              name: 'Student Info System',
              description: 'developed a user-friendly interface for managing student information',
              technologies: ['HTML', 'CSS', 'JavaScript']
            }
          ],
          certifications: ['Python Programming', 'AWS Cloud Fundamentals', 'Web Development']
        };
        
        if (!this.resumeData) return defaults;
        
        // Try to extract name, location from raw text
        const rawText = this.resumeData.rawText || '';
        
        // Extract name - look for common patterns at the beginning of resume
        let name = defaults.name;
        const nameMatch = rawText.match(/^([A-Z][a-z]+(\s[A-Z][a-z]+){1,3})/m);
        if (nameMatch && nameMatch[0]) {
          name = nameMatch[0].trim();
        }
        
        // Extract location - look for common location patterns
        let location = defaults.location;
        const locationRegex = /([A-Z][a-z]+(\s[A-Z][a-z]+)?(,\s)?[A-Z][A-Za-z\s]+)/;
        const locationMatch = rawText.match(
          /(location|address|city|based in|residing at|from):?\s*([A-Z][a-z]+(\s[A-Z][a-z]+)?(,\s)?[A-Za-z\s]+)/i
        );
        if (locationMatch && locationMatch[2]) {
          location = locationMatch[2].trim();
        }
        
        // Get college from education data
        let college = education.length > 0 
          ? (education[0].school || education[0].university || defaults.college)
          : defaults.college;
        
        // Get degree from education data
        let degree = education.length > 0
          ? (education[0].degree || defaults.degree)
          : defaults.degree;
        
        // Extract family info - use default if not found
        let family = defaults.family;
        // Look for family section
        const familyMatch = rawText.match(
          /(family|personal details|about me)([\s\S]*?)(\n\n|$)/i
        );
        if (familyMatch && familyMatch[2] && familyMatch[2].length < 200) {
          family = familyMatch[2].trim();
        }
        
        // Extract projects
        const projects = [];
        
        // Look for project section in raw text
        const projectSectionMatch = rawText.match(
          /(projects|project experience|academic projects|key projects)([\s\S]*?)(\n\n\w|$)/i
        );
        
        if (projectSectionMatch && projectSectionMatch[2]) {
          const projectsText = projectSectionMatch[2];
          
          // Look for project titles and descriptions
          const projectMatches = projectsText.match(/([A-Z][\w\s-]+)\s*[-–:]\s*([^\n]+)/g);
          
          if (projectMatches) {
            projectMatches.forEach(match => {
              const parts = match.split(/[-–:]/);
              if (parts.length >= 2) {
                const projectName = parts[0].trim();
                const projectDesc = parts[1].trim();
                
                // Extract technologies from description
                const techMatch = projectDesc.match(/using\s+([\w,\s/+]+)/i);
                let technologies = [];
                
                if (techMatch && techMatch[1]) {
                  technologies = techMatch[1].split(/[,/]/).map(t => t.trim()).filter(t => t.length > 0);
                } else {
                  // Try to extract tech keywords
                  const techKeywords = ['HTML', 'CSS', 'JavaScript', 'React', 'Angular', 'Vue', 'Node', 'Express', 
                                       'MongoDB', 'SQL', 'MySQL', 'PostgreSQL', 'PHP', 'Python', 'Java', 'C#', 
                                       'ASP.NET', 'AWS', 'Azure', 'Firebase', 'Docker', 'Kubernetes'];
                  
                  technologies = techKeywords.filter(keyword => 
                    projectDesc.includes(keyword) || 
                    rawText.toLowerCase().includes(keyword.toLowerCase())
                  );
                  
                  // If no specific techs found, add some from skills
                  if (technologies.length === 0 && skills.length > 0) {
                    technologies = skills.slice(0, 3);
                  }
                }
                
                projects.push({
                  name: projectName,
                  description: projectDesc,
                  technologies
                });
              }
            });
          }
        }
        
        // If no projects found from regex, try to find from achievements in experience
        if (projects.length === 0 && experience.length > 0) {
          for (const exp of experience) {
            if (exp.achievements && exp.achievements.length > 0) {
              for (const achievement of exp.achievements) {
                if (achievement.toLowerCase().includes('project') || 
                    achievement.toLowerCase().includes('develop') ||
                    achievement.toLowerCase().includes('built') ||
                    achievement.toLowerCase().includes('created')) {
                  
                  const projectName = 'Project at ' + (exp.company || 'previous company');
                  projects.push({
                    name: projectName,
                    description: achievement,
                    technologies: skills.slice(0, 3)
                  });
                  break;
                }
              }
            }
          }
        }
        
        // If still no projects, use defaults
        if (projects.length === 0) {
          projects.push(...defaults.projects);
        }
        
        // Extract certifications
        let certifications = [];
        const certSectionMatch = rawText.match(
          /(certifications|certificates|qualifications)([\s\S]*?)(\n\n\w|$)/i
        );
        
        if (certSectionMatch && certSectionMatch[2]) {
          const certText = certSectionMatch[2];
          // Extract certification names
          const certLines = certText.split('\n').filter(line => line.trim().length > 0);
          certifications = certLines.map(line => line.trim());
        }
        
        // If no certifications found, use some from skills or default
        if (certifications.length === 0) {
          if (skills.length > 0) {
            certifications = skills.slice(0, 3).map(skill => skill + ' Certification');
          } else {
            certifications = defaults.certifications;
          }
        }
        
        return { 
          name, 
          location, 
          college, 
          degree, 
          family,
          projects,
          certifications
        };
      };
      
      // Get resume details from the parsed resume
      const resumeDetails = extractResumeDetails();
      
      // Special formatting for specific questions
      let specialInstructions = '';
      
      // Handle project-specific questions
      if (question.toLowerCase().includes('project') || 
          question.toLowerCase().includes('what have you made') || 
          question.toLowerCase().includes('what have you built') || 
          question.toLowerCase().includes('what have you developed') ||
          question.toLowerCase().includes('tell me about your project')) {
        
        // Prepare the project details for the prompt
        const projectsList = resumeDetails.projects.map((proj, index) => {
          const techList = proj.technologies && proj.technologies.length > 0 
            ? proj.technologies.join(', ') 
            : skills.slice(0, 3).join(', ');
          
          return `Project ${index + 1}: ${proj.name}\n${proj.description}\nTechnologies used: ${techList}`;
        }).join('\n\n');
        
        specialInstructions = `
Important: You should only talk about the projects from my resume in a conversational way. Here are my projects:

${projectsList}

Your response should be conversational and human-like, answering only the specific question asked.`;
      }
      
      // Build the prompt for the API
      const prompt = `You are a job candidate named ${resumeDetails.name} from ${resumeDetails.location} in an interview.

IMPORTANT INSTRUCTIONS:
1. Answer the specific question asked in a continuous, flowing manner
2. Be conversational and human-like - avoid robotic, overly formal language
3. Use natural speech patterns, transitional phrases and occasional fillers like "um", "well", "you know" 
4. Speak as if you're in a real interview - continue your thoughts naturally without sounding scripted
5. Base your answers on the resume information only
6. Don't start with phrases like "Based on my resume" or "According to my experience"
7. If appropriate, briefly connect your answer to previous points you made to maintain continuity

Resume information:
${resumeContext}

${specialInstructions}

The interviewer asks: "${question}"

Your response:`;
      
      // Call the API to get a human-like response
      const response = await this.callAI(prompt);
      
      // Post-process to ensure formatting
      let formattedResponse = response;
      
      // Ensure there are line breaks if response doesn't have them already
      if (!formattedResponse.includes('\n') && formattedResponse.length > 100) {
        // Split into sentences and add line breaks every 2-3 sentences
        const sentences = formattedResponse.match(/[^.!?]+[.!?]+/g) || [];
        if (sentences.length > 3) {
          formattedResponse = '';
          for (let i = 0; i < sentences.length; i++) {
            formattedResponse += sentences[i].trim() + ' ';
            if ((i + 1) % 2 === 0 && i < sentences.length - 1) {
              formattedResponse += '\n\n';
            }
          }
        }
      }
      
      return formattedResponse;
    } catch (error) {
      console.error("Error generating AI response:", error);
      toast({
        title: "Error",
        description: "Failed to generate response. Using fallback.",
        variant: "destructive"
      });
      
      return this.getFallbackResponse(question);
    }
  }
  
  private async callAI(prompt: string): Promise<string> {
    try {
      console.log("Calling OpenRouter API");
      
      // Using OpenRouter API which supports multiple models including Together AI models
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "HTTP-Referer": window.location.href,
          "X-Title": "AI Interview Simulator"
        },
        body: JSON.stringify({
          model: "openai/gpt-3.5-turbo", // Fallback to a reliable model
          messages: [
            { 
              role: "system", 
              content: "You are a job candidate in a real interview. Speak naturally and conversationally as if you're having a flowing conversation. Use transitional phrases and speak in a continuous manner."
            },
            { 
              role: "user", 
              content: prompt 
            }
          ],
          max_tokens: 800,
          temperature: 0.9 // Higher temperature for more flowing, natural responses
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log("API Response received");
      
      // Standard OpenAI/OpenRouter format
      if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
        return data.choices[0].message.content.trim();
      } else {
        console.error("Unexpected API response format", data);
        return this.getFallbackResponse("Tell me about yourself");
      }
    } catch (error) {
      console.error("Error calling AI API:", error);
      return this.getFallbackResponse("Tell me about yourself");
    }
  }
  
  /**
   * Provides a fallback response when the API call fails
   * @param question The interview question asked
   * @returns A human-like response to the question
   */
  private getFallbackResponse(question: string): string {
    // Provide fallback responses based on common interview questions
    if (question.toLowerCase().includes('tell me about yourself') || question.toLowerCase().includes('introduce yourself')) {
      return "Hi, I'm a software developer with a strong background in web development. I've worked on various projects using React, TypeScript, and Node.js. I enjoy solving complex problems and working in collaborative environments. In my previous role at Tech Solutions, I helped develop several successful web applications that improved business processes by 30%.";
    }
    
    if (question.toLowerCase().includes('strength') || question.toLowerCase().includes('good at')) {
      return "I believe my greatest strength is my ability to learn quickly and adapt to new technologies. For example, in my last project, I needed to learn a new framework in a short time frame. I created a structured learning plan and was able to contribute code within a week. I also pride myself on being a team player who communicates effectively with colleagues across different departments.";
    }
    
    if (question.toLowerCase().includes('weakness') || question.toLowerCase().includes('improve')) {
      return "I sometimes tend to get caught up in the details, wanting to make everything perfect. I've been working on this by setting clear deadlines for myself and focusing on delivering working solutions before refining them. I've also started using the Pomodoro technique to manage my time better and ensure I make consistent progress on tasks.";
    }
    
    if (question.toLowerCase().includes('challenge') || question.toLowerCase().includes('difficult')) {
      return "In my previous job, we faced a significant challenge when our main application started experiencing performance issues with growing user numbers. I took the initiative to analyze the bottlenecks and proposed implementing server-side caching and optimizing our database queries. After implementing these changes, we saw a 60% improvement in response times. This taught me the importance of proactive problem-solving and performance optimization.";
    }
    
    // Generic response for other questions
    return "That's an interesting question. Based on my experience, I would approach this by analyzing the requirements, breaking down the problem into manageable parts, and implementing a solution iteratively while getting feedback from stakeholders. I've found this approach works well for most challenges in the software development field.";
  }
}

export default new InterviewerAI();
