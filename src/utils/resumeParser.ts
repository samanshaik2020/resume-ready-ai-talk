
/**
 * Simple resume parser that extracts key information from text content
 */
export interface ResumeData {
  skills: string[];
  education: string[];
  experience: string[];
  rawText: string;
}

export async function parseResumeText(text: string): Promise<ResumeData> {
  // This is a simple parser - in a real app, you'd use NLP or more sophisticated parsing
  const skills = extractSkills(text);
  const education = extractEducation(text);
  const experience = extractExperience(text);

  return {
    skills,
    education,
    experience,
    rawText: text
  };
}

export async function parseResumePDF(file: File): Promise<ResumeData> {
  // In a real implementation, we would use a PDF parsing library
  // For now, we'll just read it as text
  const text = await file.text();
  return parseResumeText(text);
}

// Helper functions to extract information from resume text
function extractSkills(text: string): string[] {
  // Very basic extraction based on common resume sections
  const skillsSection = extractSection(text, ["skills", "technical skills", "core competencies"]);
  if (skillsSection) {
    return skillsSection
      .split(/[,|•]/)
      .map(skill => skill.trim())
      .filter(skill => skill.length > 0);
  }
  return [];
}

function extractEducation(text: string): string[] {
  const educationSection = extractSection(text, ["education", "academic background"]);
  if (educationSection) {
    return educationSection
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }
  return [];
}

function extractExperience(text: string): string[] {
  const experienceSection = extractSection(text, [
    "experience", 
    "professional experience", 
    "work experience",
    "employment history"
  ]);
  if (experienceSection) {
    return experienceSection
      .split(/\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);
  }
  return [];
}

function extractSection(text: string, sectionNames: string[]): string | null {
  const lowerText = text.toLowerCase();
  
  for (const sectionName of sectionNames) {
    const sectionIndex = lowerText.indexOf(sectionName.toLowerCase());
    if (sectionIndex !== -1) {
      // Find the next section to determine where this section ends
      let nextSectionIndex = text.length;
      const possibleNextSections = ["experience", "education", "skills", "projects", "certifications", "references"];
      
      for (const nextSection of possibleNextSections) {
        // Skip if we're looking for the current section
        if (sectionNames.includes(nextSection)) continue;
        
        const index = lowerText.indexOf(nextSection, sectionIndex + sectionName.length);
        if (index !== -1 && index < nextSectionIndex) {
          nextSectionIndex = index;
        }
      }
      
      return text.substring(sectionIndex + sectionName.length, nextSectionIndex).trim();
    }
  }
  
  return null;
}
