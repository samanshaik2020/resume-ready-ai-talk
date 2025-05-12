import { extractTextFromPDF } from './pdfParser';

/**
 * Resume data structure containing extracted information
 */
export interface ResumeData {
  rawText: string;
  skills: string[];
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  certifications: string[];
  personalInfo: PersonalInfo;
}

export interface PersonalInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  summary?: string;
  linkedin?: string;
}

export interface EducationEntry {
  degree?: string;
  school?: string;
  university?: string;
  year?: string;
  gpa?: string;
  description?: string;
}

export interface ExperienceEntry {
  title?: string;
  company?: string;
  duration?: string;
  achievements?: string[];
  role?: string;
  description?: string;
}

export interface ProjectEntry {
  name: string;
  duration?: string;
  description: string;
  technologies: string[];
  link?: string;
}

export async function parseResumeText(text: string): Promise<ResumeData> {
  // Base result structure
  const result: ResumeData = {
    rawText: text,
    skills: [],
    education: [],
    experience: [],
    projects: [],
    certifications: [],
    personalInfo: {}
  };

  // Extract personal information
  const lines = text.split('\n');
  const firstLineMatch = lines[0]?.match(/^([A-Z][A-Z\s]+)/);
  if (firstLineMatch) {
    result.personalInfo.name = firstLineMatch[0].trim();
  }
  
  // Extract email and phone
  const contactLine = text.match(/([\d-+()]{10,})\s*[◇|•]\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (contactLine) {
    result.personalInfo.phone = contactLine[1];
    result.personalInfo.email = contactLine[2];
  }
  
  // Extract location
  const locationMatch = text.match(/◇([^◇]+)(, [A-Za-z ]+)?(, [A-Za-z ]+)?◇/);
  if (locationMatch) {
    result.personalInfo.location = locationMatch[0].replace(/◇/g, '').trim();
  }
  
  // Extract LinkedIn
  const linkedinMatch = text.match(/LinkedIn|linkedin\.com\/in\/[\w-]+/);
  if (linkedinMatch) {
    result.personalInfo.linkedin = linkedinMatch[0];
  }
  
  // Extract summary
  const summaryMatch = text.match(/SUMMARY\s*([\s\S]*?)(?=\n\s*\n|\n\s*[A-Z]{2,}|$)/i);
  if (summaryMatch && summaryMatch[1]) {
    result.personalInfo.summary = summaryMatch[1].trim();
  }

  // Extract skills
  const skillsMatch = text.match(/SKILLS\s*([\s\S]*?)(?=\n\s*\n|\n\s*[A-Z]{2,}|$)/i);
  if (skillsMatch && skillsMatch[1]) {
    const skillsText = skillsMatch[1].trim();
    
    // Split skills by category
    const skillCategories = skillsText.split(/\n(?=[A-Za-z]+:)/);
    
    for (const category of skillCategories) {
      const categorySkills = category
        .replace(/^[A-Za-z\s]+:/, '') // Remove category name
        .split(/[,:]/) // Split by commas or colons
        .map(skill => skill.trim())
        .filter(skill => skill.length > 0);
      
      result.skills.push(...categorySkills);
    }
  }

  // Extract projects
  const projectsMatch = text.match(/PROJECTS\s*([\s\S]*?)(?=\n\s*\n|\n\s*[A-Z]{2,}|$)/i);
  if (projectsMatch && projectsMatch[1]) {
    const projectsText = projectsMatch[1].trim();
    
    // Split by project entries (looking for project name followed by date/link pattern)
    const projectEntries = projectsText.split(/\n(?=[A-Za-z][^\n]+, [^\n]+Link)/);
    
    for (const entry of projectEntries) {
      if (entry.trim().length === 0) continue;
      
      const project: ProjectEntry = {
        name: '',
        description: '',
        technologies: []
      };
      
      // Extract project name and duration
      const nameMatch = entry.match(/([^,\n]+),\s*([^\n]+)\s*Link/);
      if (nameMatch) {
        project.name = nameMatch[1].trim();
        project.duration = nameMatch[2].trim();
        project.link = 'Link';
      } else {
        // Try alternative pattern
        const altNameMatch = entry.match(/([^\n]+)/);
        if (altNameMatch) {
          project.name = altNameMatch[1].trim();
        }
      }
      
      // Extract description (bullet points)
      const descLines = entry.split('\n')
        .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
        .map(line => line.replace(/^[•\-]\s*/, '').trim());
      
      if (descLines.length > 0) {
        project.description = descLines.join('. ');
      }
      
      // Extract technologies
      const techMatch = entry.match(/Technologies:\s*([^\n]+)/);
      if (techMatch && techMatch[1]) {
        project.technologies = techMatch[1]
          .split(/[,]/) // Split by commas
          .map(tech => tech.trim())
          .filter(tech => tech.length > 0);
      } else {
        // Try to extract technologies from the description
        const knownTechs = ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Node.js', 'Python', 'Java', 
                           'AWS', 'Docker', 'Next.js', 'MongoDB', 'SQL', 'REST API', 'Bootstrap', 'Tailwind'];
        
        project.technologies = knownTechs.filter(tech => 
          entry.includes(tech) || 
          entry.includes(tech.toLowerCase())
        );
      }
      
      result.projects.push(project);
    }
  }

  // Extract education
  const educationMatch = text.match(/EDUCATION\s*([\s\S]*?)(?=\n\s*\n|\n\s*[A-Z]{2,}|$)/i);
  if (educationMatch && educationMatch[1]) {
    const educationText = educationMatch[1].trim();
    
    // Split education entries by line breaks and new education entry pattern
    const educationEntries = educationText.split(/\n(?=[A-Za-z][^\n]+, [^\n]+\(GPA)/);
    
    for (const entry of educationEntries) {
      if (entry.trim().length === 0) continue;
      
      const education: EducationEntry = {};
      
      // Extract degree and school
      const degreeMatch = entry.match(/([^,\n]+),\s*([^\n]+)\s*\(GPA:\s*(\d+\.\d+)\)/);
      if (degreeMatch) {
        education.degree = degreeMatch[1].trim();
        education.school = degreeMatch[2].trim();
        education.gpa = degreeMatch[3];
      } else {
        // Try alternative pattern
        const altMatch = entry.match(/([^\n]+)/);
        if (altMatch) {
          education.degree = altMatch[1].trim();
        }
      }
      
      // Extract year
      const yearMatch = entry.match(/(\w+\s+|)(19|20)\d{2}\s*[-—]\s*(\w+\s+|)(19|20)\d{2}|\b(19|20)\d{2}\b/g);
      if (yearMatch) {
        education.year = yearMatch[0].trim();
      }
      
      // Extract description
      const descLines = entry.split('\n').slice(1).filter(line => line.trim().length > 0);
      if (descLines.length > 0) {
        education.description = descLines.join(' ');
      }
      
      result.education.push(education);
    }
  }

  // Extract certifications
  const certMatch = text.match(/CERTIFICATIONS\s*([\s\S]*?)(?=\n\s*\n|\n\s*[A-Z]{2,}|$)/i);
  if (certMatch && certMatch[1]) {
    const certText = certMatch[1].trim();
    
    // Split by line breaks and extract certification names and dates
    const certLines = certText.split('\n');
    for (const line of certLines) {
      const cert = line.split(',')[0].trim();
      if (cert.length > 0) {
        result.certifications.push(cert);
      }
    }
  }

  // Return the parsed data
  return result;
}

export async function parseResumePDF(file: File): Promise<ResumeData> {
  try {
    // Use the PDF.js implementation to extract text
    let text;
    if (file.type === 'application/pdf') {
      try {
        text = await extractTextFromPDF(file);
      } catch (error) {
        console.error('Error extracting text with PDF.js:', error);
        // Fallback to basic text extraction
        text = await file.text();
      }
    } else {
      // For non-PDF files, just get the text
      text = await file.text();
    }
    
    return parseResumeText(text);
  } catch (error) {
    console.error('Error parsing resume PDF:', error);
    throw error;
  }
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

function extractEducation(text: string): EducationEntry[] {
  const educationSection = extractSection(text, ["education", "academic background", "qualifications"]);
  if (!educationSection) return [];
  
  // More sophisticated parsing to extract structured education data
  const eduLines = educationSection
    .split(/\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  // Try to detect degree, school, and year patterns
  const educationEntries: EducationEntry[] = [];
  let currentEntry: EducationEntry = {};
  
  for (const line of eduLines) {
    // Look for degree patterns
    const degreeMatch = line.match(/(?:bachelor|master|ph\.?d|b\.?s|m\.?s|b\.?a|m\.?a|mba)/i);
    // Look for years
    const yearMatch = line.match(/(19|20)\d{2}(\s*-\s*(19|20)\d{2}|\s*to\s*(present|ongoing|current|now)|)/i);
    
    if (degreeMatch || (yearMatch && Object.keys(currentEntry).length > 0)) {
      // If we've collected some data and found a new entry, save the current entry
      if (Object.keys(currentEntry).length > 0 && (degreeMatch || yearMatch)) {
        educationEntries.push(currentEntry);
        currentEntry = {};
      }
      
      if (degreeMatch) {
        currentEntry.degree = line;
      }
      
      if (yearMatch) {
        currentEntry.year = yearMatch[0];
      }
      
      // If line has university/college/school, add it
      if (/university|college|school|institute/i.test(line)) {
        currentEntry.school = line;
      }
    } else if (Object.keys(currentEntry).length > 0) {
      // Add additional info to current entry
      if (!currentEntry.school && /university|college|school|institute/i.test(line)) {
        currentEntry.school = line;
      } else {
        currentEntry.description = currentEntry.description ? `${currentEntry.description}\n${line}` : line;
      }
    }
  }
  
  // Add the last education entry if it exists
  if (Object.keys(currentEntry).length > 0) {
    educationEntries.push(currentEntry);
  }
  
  return educationEntries.length > 0 ? educationEntries : eduLines.map(line => ({ degree: line }) as EducationEntry);
}

function extractExperience(text: string): ExperienceEntry[] {
  const experienceSection = extractSection(text, [
    "experience", 
    "professional experience", 
    "work experience",
    "employment history",
    "work history"
  ]);
  if (!experienceSection) return [];
  
  // More sophisticated parsing to extract structured experience data
  const expLines = experienceSection
    .split(/\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  // Try to detect job title, company, and date patterns
  const expEntries: ExperienceEntry[] = [];
  let currentEntry: ExperienceEntry = {};
  let achievements: string[] = [];
  
  for (const line of expLines) {
    // Look for date ranges that typically start work experiences
    const dateMatch = line.match(/(19|20)\d{2}(\s*-\s*(19|20)\d{2}|\s*to\s*(present|ongoing|current|now)|)/i);
    // Look for bullet points that typically indicate achievements
    const bulletMatch = line.match(/^[•\-\*]\s*/i);
    
    if (dateMatch && !bulletMatch) {
      // If we've collected some data and found a new entry, save the current entry
      if (Object.keys(currentEntry).length > 0) {
        if (achievements.length > 0) {
          currentEntry.achievements = achievements;
        }
        expEntries.push(currentEntry);
        currentEntry = {};
        achievements = [];
      }
      
      currentEntry.duration = dateMatch[0];
      
      // Try to extract company and role from the line
      const remainingText = line.replace(dateMatch[0], '').trim();
      if (remainingText) {
        if (remainingText.includes('|') || remainingText.includes('-') || remainingText.includes(',')) {
          const parts = remainingText.split(/[|\-,]/).map(p => p.trim());
          if (parts.length >= 2) {
            currentEntry.company = parts[0];
            currentEntry.role = parts[1];
          } else {
            currentEntry.company = remainingText;
          }
        } else {
          currentEntry.company = remainingText;
        }
      }
    } else if (bulletMatch) {
      // Collect achievements (bullet points)
      const achievement = line.replace(/^[•\-\*]\s*/i, '').trim();
      if (achievement) {
        achievements.push(achievement);
      }
    } else if (Object.keys(currentEntry).length > 0) {
      // Add additional info to current entry
      if (!currentEntry.role && line.length < 50) {
        currentEntry.role = line;
      } else if (!currentEntry.company && /inc\.|corp\.|ltd\.|llc|company|corporation/i.test(line)) {
        currentEntry.company = line;
      } else {
        // Add as general description if not a clear role or company
        currentEntry.description = currentEntry.description ? `${currentEntry.description}\n${line}` : line;
      }
    } else if (line.length > 0) {
      // Start a new entry if we don't have one yet but found a significant line
      currentEntry.description = line;
    }
  }
  
  // Add the last experience entry if it exists
  if (Object.keys(currentEntry).length > 0) {
    if (achievements.length > 0) {
      currentEntry.achievements = achievements;
    }
    expEntries.push(currentEntry);
  }
  
  return expEntries.length > 0 ? expEntries : expLines.map(line => ({ description: line }) as ExperienceEntry);
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
