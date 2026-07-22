import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ChevronLeft, Eye, Download, Plus, Trash2, Sparkles, CheckCircle2, 
  ArrowLeft, ArrowRight, Lock, Globe, Search, Award, Briefcase, 
  GraduationCap, Wrench, Terminal, QrCode, Printer, Share2, History,
  ArrowUpRight, AlertCircle, Check, ZoomIn, ZoomOut, CheckSquare, Square, RefreshCw
} from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { adminService } from '../services/admin';
import { useUserStore } from '../store/userStore';
import { API_BASE_URL } from '../services/api';


// Static categories for searchable skills
const PRESET_SKILLS = [
  { category: "Programming", name: "Java" },
  { category: "Programming", name: "Python" },
  { category: "Programming", name: "C" },
  { category: "Programming", name: "C++" },
  { category: "Programming", name: "PHP" },
  { category: "Programming", name: "JavaScript" },
  { category: "Programming", name: "C#" },
  { category: "Web", name: "HTML" },
  { category: "Web", name: "CSS" },
  { category: "Web", name: "React" },
  { category: "Web", name: "Angular" },
  { category: "Web", name: "Vue" },
  { category: "Web", name: "Node" },
  { category: "Web", name: "Express" },
  { category: "Databases", name: "MySQL" },
  { category: "Databases", name: "PostgreSQL" },
  { category: "Databases", name: "MongoDB" },
  { category: "Databases", name: "SQLite" },
  { category: "Cloud", name: "AWS" },
  { category: "Cloud", name: "Azure" },
  { category: "Cloud", name: "Google Cloud" },
  { category: "Tools", name: "Git" },
  { category: "Tools", name: "GitHub" },
  { category: "Tools", name: "VS Code" },
  { category: "Tools", name: "Docker" },
  { category: "Tools", name: "Linux" },
  { category: "AI", name: "Machine Learning" },
  { category: "AI", name: "TensorFlow" },
  { category: "AI", name: "PyTorch" },
  { category: "AI", name: "OpenCV" },
];

export const ResumeBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');
  const { user } = useUserStore();

  // Mode state: 'wizard' | 'studio'
  const [builderMode, setBuilderMode] = useState<'wizard' | 'studio'>('wizard');
  const [currentStep, setCurrentStep] = useState(1);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Draft saved');
  
  // Wizard creation ID
  const [resumeId, setResumeId] = useState<number | null>(null);
  
  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };


  // --- STATE MODELS ---
  const [masterForm, setMasterForm] = useState({
    name: 'My SDE Resume',
    resume_type: 'Fresher',
    target_role: 'Frontend Engineer',
    career_objective: 'Targeting entry-level roles in React and Frontend engineering.',
    preferred_industry: 'Technology',
    language: 'English',
    expected_salary: '8 LPA',
    visibility: 'Private',
    template_id: 'modern',
    color_theme: 'blue'
  });

  const [personalInfo, setPersonalInfo] = useState({
    name: 'Bharath Kulal',
    roll_number: 'BCA25008',
    email: 'bharathkulal2007@gmail.com',
    department: 'CS',
    semester: 3,
    course: 'BCA',
    college_name: 'Bimba University',
    expected_graduation: '2026',
    phone: '+91 98765 43210',
    address: 'Mangalore, Karnataka',
    linkedin: 'linkedin.com/in/bharathkulal',
    github: 'github.com/bharathkulal',
    portfolio: 'bharathkulal.dev',
    website: '',
    profile_photo: '',
    summary: 'Detail-oriented computer applications student interested in scalable software development.'
  });

  const [educationList, setEducationList] = useState<any[]>([
    { id: 1, institution: 'Bimba University', degree: 'BCA', passing_year: 2026, cgpa: 9.1, achievements: 'Top 5% of class' }
  ]);
  const [experienceList, setExperienceList] = useState<any[]>([]);
  const [projectList, setProjectList] = useState<any[]>([
    { id: 1, name: 'Bimba AI Resume Builder', description: 'Interactive AI-powered ATS optimizer software.', tech_stack: 'React, Node, SQLite', role: 'Lead', duration: '2 months', github_link: '' }
  ]);
  const [skillList, setSkillList] = useState<any[]>([
    { category: 'Programming', name: 'Java', level: 4 },
    { category: 'Web', name: 'React', level: 4 }
  ]);
  const [certificateList, setCertificateList] = useState<any[]>([]);
  const [achievements, setAchievements] = useState({
    hackathons: 'Winner at Smart India Hackathon 2025',
    awards: 'Merit Scholarship holder',
    soft_skills: 'Leadership, Team Collaboration',
    extracurricular: 'Tech Club coordinator'
  });

  // MOCK DATA AND SETTINGS FOR PREVIEW
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeStudioTab, setActiveStudioTab] = useState<'editor' | 'templates' | 'ats' | 'readiness' | 'versions' | 'export'>('editor');
  const [templates, setTemplates] = useState<any[]>([]);
  
  // Section layout visibility
  const [sectionVisibility, setSectionVisibility] = useState({
    experience: true,
    projects: true,
    skills: true,
    certificates: true,
    achievements: true
  });

  // Version history & ATS Score
  const [versions, setVersions] = useState<any[]>([]);
  const [atsScorecard, setAtsScorecard] = useState<any>({
    overall_score: 74,
    formatting_score: 75,
    keyword_match: 68,
    grammar_score: 80,
    readability_score: 70,
    recruiter_score: 68,
    missing_keywords: 'Docker, AWS Cloud, System Design',
    suggestions: 'Add more tech-stack elements in project descriptions. Complete security certificate.'
  });
  const [readinessReport, setReadinessReport] = useState<any>({
    readiness_score: 80,
    job_readiness: 'Ready',
    skill_gap: 'AWS, Docker, Microservices',
    recommended_certifications: 'AWS Cloud Practitioner, Certified Kubernetes Admin',
    recommended_courses: 'Udemy: Docker & Kubernetes Masterclass',
    interview_readiness: 78,
    learning_roadmap: '1. Master cloud deployment fundamentals.\n2. Complete AWS practitioner certificate.\n3. Implement CI/CD pipelines.'
  });

  // AI Loaders
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const generationSteps = [
    "Analyzing Student Profile...",
    "Reading Projects details...",
    "Analyzing Technical Skills metrics...",
    "Generating Professional Summary bio...",
    "Writing Experience bullet points...",
    "Optimizing ATS keywords compliance...",
    "Generating PDF Cache preview..."
  ];

  // Forms inputs helpers
  const [newEdu, setNewEdu] = useState({ institution: '', degree: '', passing_year: 2025, cgpa: 8.5, achievements: '' });
  const [newExp, setNewExp] = useState({ company: '', position: '', duration: '3 Months', description: '', achievements: '' });
  const [newProj, setNewProj] = useState({ name: '', description: '', tech_stack: '', role: 'Developer', duration: '1 Month', github_link: '', live_demo: '', achievements: '' });
  const [newCert, setNewCert] = useState({ name: '', organization: '', issue_date: '', credential_id: '', credential_url: '' });
  const [skillSearch, setSkillSearch] = useState('');

  // Fetch templates and current resume details if editing
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const res = await adminService.apiClient.get('/api/resume-studio/templates');
        setTemplates(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTemplates();
  }, []);

  useEffect(() => {
    const loadResumeDetail = async () => {
      if (!queryId) {
        // Pre-populate student details from user store
        if (user) {
          setPersonalInfo(prev => ({
            ...prev,
            roll_number: user.roll_number || prev.roll_number,
            email: user.personal_email || prev.email,
            department: user.department || prev.department,
            semester: user.semester || prev.semester,
          }));
        }
        return;
      }
      try {
        const rId = parseInt(queryId);
        setResumeId(rId);
        const res = await adminService.apiClient.get(`/api/resume-studio/${rId}`);
        const data = res.data;
        if (data.master) {
          setMasterForm(data.master);
          setPersonalInfo({
            name: data.master.name || '',
            roll_number: user?.roll_number || '',
            email: user?.personal_email || '',
            department: user?.department || '',
            semester: user?.semester || 1,
            course: 'BCA',
            college_name: 'Bimba University',
            expected_graduation: '2026',
            phone: data.master.phone || '',
            address: data.master.address || '',

            linkedin: data.master.linkedin || '',
            github: data.master.github || '',
            portfolio: data.master.portfolio || '',
            website: data.master.website || '',
            profile_photo: data.master.profile_photo || '',
            summary: data.master.summary || ''
          });
          if (data.master.achievements_list) {
            try {
              setAchievements(JSON.parse(data.master.achievements_list));
            } catch (e) {
              console.error("Error parsing achievements:", e);
            }
          }
          setBuilderMode('studio');
        }
        if (data.education) setEducationList(data.education);
        if (data.experience) setExperienceList(data.experience);
        if (data.projects) setProjectList(data.projects);
        if (data.skills) setSkillList(data.skills);
        if (data.certificates) setCertificateList(data.certificates);
        if (data.ats) setAtsScorecard(data.ats);
        if (data.career_readiness) setReadinessReport(data.career_readiness);
      } catch (err) {
        console.error("Failed to load resume details:", err);
      }
    };
    loadResumeDetail();
  }, [queryId, user]);


  // Auto-Save Effect (Every 30 seconds when in Studio Mode)
  useEffect(() => {
    if (builderMode !== 'studio' || !resumeId) return;
    const interval = setInterval(async () => {
      setIsAutoSaving(true);
      setSaveStatus('Saving changes...');
      try {
        await adminService.apiClient.put(`/api/resume-studio/${resumeId}/update`, masterForm);
        setSaveStatus('Draft saved');
      } catch (err) {
        setSaveStatus('Save failed');
      } finally {
        setIsAutoSaving(false);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [builderMode, resumeId, masterForm]);

  // Load versions list
  const loadVersions = async () => {
    if (!resumeId) return;
    try {
      const res = await adminService.apiClient.get(`/api/resume-studio/${resumeId}/versions`);
      setVersions(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeStudioTab === 'versions') {
      loadVersions();
    }
  }, [activeStudioTab]);

  // Duplication/Restore version helpers
  const handleSaveVersion = async () => {
    if (!resumeId) return;
    const vName = prompt("Enter version name (e.g. SDE Version 2):");
    if (!vName) return;
    try {
      await adminService.apiClient.post(`/api/resume-studio/${resumeId}/versions/save?name=${encodeURIComponent(vName)}`);
      alert("Version saved successfully!");
      loadVersions();
    } catch (err) {
      alert("Failed to save version.");
    }
  };

  const handleRestoreVersion = async (vId: number) => {
    if (!confirm("Overwrite current data with this version?")) return;
    try {
      await adminService.apiClient.post(`/api/resume-studio/versions/${vId}/restore`);
      alert("Version restored successfully!");
      // Reload details
      const detail = await adminService.apiClient.get(`/api/resume-studio/${resumeId}`);
      setMasterForm(detail.data.master);
      setEducationList(detail.data.education);
      setExperienceList(detail.data.experience);
      setProjectList(detail.data.projects);
      setSkillList(detail.data.skills);
      setCertificateList(detail.data.certificates);
      loadVersions();
    } catch (err) {
      alert("Failed to restore version.");
    }
  };

  // --- WORKFLOW GENERATION BUTTON ---
  const handleGenerateResume = async () => {
    setIsGenerating(true);
    setGenerationStep(0);
    
    // Simulate animated generation steps
    for (let i = 0; i < generationSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setGenerationStep(i + 1);
    }

    try {
      // Merge master form with personalInfo and achievements
      const payload = {
        ...masterForm,
        phone: personalInfo.phone,
        address: personalInfo.address,
        linkedin: personalInfo.linkedin,
        github: personalInfo.github,
        portfolio: personalInfo.portfolio,
        website: personalInfo.website,
        profile_photo: personalInfo.profile_photo,
        summary: personalInfo.summary,
        achievements_list: JSON.stringify(achievements)
      };

      // Commit Master Form to database
      const createRes = await adminService.apiClient.post('/api/resume-studio/create', payload);
      const newId = createRes.data.id;
      setResumeId(newId);

      // Post all items sequentially to backend child endpoints
      for (const edu of educationList) {
        await adminService.apiClient.post(`/api/resume-studio/${newId}/education`, {
          institution: edu.institution,
          degree: edu.degree,
          passing_year: edu.passing_year,
          cgpa: edu.cgpa,
          achievements: edu.achievements
        });
      }
      for (const exp of experienceList) {
        await adminService.apiClient.post(`/api/resume-studio/${newId}/experience`, {
          company: exp.company,
          position: exp.position,
          duration: exp.duration,
          description: exp.description,
          achievements: exp.achievements
        });
      }
      for (const proj of projectList) {
        await adminService.apiClient.post(`/api/resume-studio/${newId}/project`, {
          name: proj.name,
          description: proj.description,
          tech_stack: proj.tech_stack,
          role: proj.role,
          duration: proj.duration,
          github_link: proj.github_link,
          live_demo: proj.live_demo,
          achievements: proj.achievements
        });
      }
      for (const skill of skillList) {
        await adminService.apiClient.post(`/api/resume-studio/${newId}/skill`, {
          category: skill.category,
          name: skill.name,
          level: skill.level
        });
      }
      for (const cert of certificateList) {
        await adminService.apiClient.post(`/api/resume-studio/${newId}/certificate`, {
          name: cert.name,
          organization: cert.organization,
          issue_date: cert.issue_date,
          credential_id: cert.credential_id,
          credential_url: cert.credential_url
        });
      }

      // Add default records in UI state
      await reloadResumeDetails(newId);


      setIsGenerating(false);
      setBuilderMode('studio');
    } catch (err) {
      alert("Failed to generate resume. Try again.");
      setIsGenerating(false);
    }
  };

  // AI Feature Handlers
  const handleAIEnhanceSummary = async () => {
    if (!resumeId) return;
    try {
      const skills = skillList.map(s => s.name);
      const res = await adminService.apiClient.post(`/api/resume-studio/${resumeId}/ai/generate-summary`, {
        role: masterForm.target_role,
        skills
      });
      setPersonalInfo({ ...personalInfo, summary: res.data.summary });
    } catch (err) {
      alert("AI Summary generation failed.");
    }
  };

  const handleAIRewriteObjective = async () => {
    if (!resumeId) return;
    try {
      const res = await adminService.apiClient.post(`/api/resume-studio/${resumeId}/ai/rewrite`, {
        text: masterForm.career_objective,
        target_role: masterForm.target_role
      });
      setMasterForm({ ...masterForm, career_objective: res.data.rewritten });
    } catch (err) {
      alert("AI Rewrite failed.");
    }
  };

  const handleAIRewriteProject = async (pId: number) => {
    if (!resumeId) return;
    const proj = projectList.find(p => p.id === pId);
    if (!proj) return;
    try {
      const res = await adminService.apiClient.post(`/api/resume-studio/${resumeId}/ai/rewrite`, {
        text: proj.description,
        target_role: masterForm.target_role
      });
      const updated = projectList.map(p => p.id === pId ? { ...p, description: res.data.rewritten } : p);
      setProjectList(updated);
    } catch (err) {
      alert("AI rewrite failed.");
    }
  };

  const handleAIEnhanceExperience = async (eId: number) => {
    if (!resumeId) return;
    const exp = experienceList.find(e => e.id === eId);
    if (!exp) return;
    try {
      const res = await adminService.apiClient.post(`/api/resume-studio/${resumeId}/ai/rewrite`, {
        text: exp.description,
        target_role: masterForm.target_role
      });
      const updated = experienceList.map(e => e.id === eId ? { ...e, description: res.data.rewritten } : e);
      setExperienceList(updated);
    } catch (err) {
      alert("AI experience boost failed.");
    }
  };

  const handleAITriggerRoadmap = async () => {
    if (!resumeId) return;
    try {
      const skills = skillList.map(s => s.name);
      const res = await adminService.apiClient.post(`/api/resume-studio/${resumeId}/ai/roadmap`, {
        role: masterForm.target_role,
        skills
      });
      setReadinessReport({
        readiness_score: res.data.readiness_score,
        job_readiness: res.data.job_readiness,
        skill_gap: res.data.skills_gap,
        recommended_certifications: res.data.recommended_certifications,
        recommended_courses: res.data.recommended_courses,
        learning_roadmap: res.data.roadmap,
        interview_readiness: res.data.interview_prep
      });
      alert("Career Roadmap generated!");
    } catch (err) {
      alert("Failed to build roadmap.");
    }
  };

  const handleATSAutoFix = async () => {
    // Mock auto-fix by injecting missing keywords into skills list
    if (atsScorecard.missing_keywords) {
      const keywords = atsScorecard.missing_keywords.split(", ");
      const updatedSkills = [...skillList];
      keywords.forEach((kw: string) => {
        if (!updatedSkills.some(s => s.name.toLowerCase() === kw.toLowerCase())) {
          updatedSkills.push({ category: "Tools", name: kw, level: 3 });
        }
      });
      setSkillList(updatedSkills);
      setAtsScorecard({
        ...atsScorecard,
        overall_score: 94,
        keyword_match: 95,
        missing_keywords: ''
      });
      alert("ATS Auto-Fix applied! Injected missing skills keywords.");
    }
  };

  // Helper to reload details from database
  const reloadResumeDetails = async (id: number) => {
    try {
      const detail = await adminService.apiClient.get(`/api/resume-studio/${id}`);
      setMasterForm(detail.data.master);
      setEducationList(detail.data.education);
      setExperienceList(detail.data.experience);
      setProjectList(detail.data.projects);
      setSkillList(detail.data.skills);
      setCertificateList(detail.data.certificates);
      if (detail.data.ats) setAtsScorecard(detail.data.ats);
      if (detail.data.career_readiness) setReadinessReport(detail.data.career_readiness);
    } catch (err) {
      console.error("Failed to reload details:", err);
    }
  };

  // Add Item Triggers
  const addEducationItem = async () => {
    if (!newEdu.institution) return;
    try {
      if (resumeId) {
        await adminService.apiClient.post(`/api/resume-studio/${resumeId}/education`, newEdu);
        await reloadResumeDetails(resumeId);
      } else {
        setEducationList([...educationList, { ...newEdu, id: Date.now() }]);
      }
      setNewEdu({ institution: '', degree: '', passing_year: 2025, cgpa: 8.5, achievements: '' });
    } catch (err) {
      alert("Failed to add education record.");
    }
  };

  const deleteEducationItem = async (eduId: number) => {
    try {
      if (resumeId) {
        await adminService.apiClient.delete(`/api/resume-studio/education/${eduId}`);
        await reloadResumeDetails(resumeId);
      } else {
        setEducationList(educationList.filter(e => e.id !== eduId));
      }
    } catch (err) {
      alert("Failed to delete education record.");
    }
  };

  const addExperienceItem = async () => {
    if (!newExp.company) return;
    try {
      if (resumeId) {
        await adminService.apiClient.post(`/api/resume-studio/${resumeId}/experience`, newExp);
        await reloadResumeDetails(resumeId);
      } else {
        setExperienceList([...experienceList, { ...newExp, id: Date.now() }]);
      }
      setNewExp({ company: '', position: '', duration: '3 Months', description: '', achievements: '' });
    } catch (err) {
      alert("Failed to add experience record.");
    }
  };

  const deleteExperienceItem = async (expId: number) => {
    try {
      if (resumeId) {
        await adminService.apiClient.delete(`/api/resume-studio/experience/${expId}`);
        await reloadResumeDetails(resumeId);
      } else {
        setExperienceList(experienceList.filter(e => e.id !== expId));
      }
    } catch (err) {
      alert("Failed to delete experience record.");
    }
  };

  const addProjectItem = async () => {
    if (!newProj.name) return;
    try {
      if (resumeId) {
        await adminService.apiClient.post(`/api/resume-studio/${resumeId}/project`, newProj);
        await reloadResumeDetails(resumeId);
      } else {
        setProjectList([...projectList, { ...newProj, id: Date.now() }]);
      }
      setNewProj({ name: '', description: '', tech_stack: '', role: 'Developer', duration: '1 Month', github_link: '', live_demo: '', achievements: '' });
    } catch (err) {
      alert("Failed to add project.");
    }
  };

  const deleteProjectItem = async (projId: number) => {
    try {
      if (resumeId) {
        await adminService.apiClient.delete(`/api/resume-studio/project/${projId}`);
        await reloadResumeDetails(resumeId);
      } else {
        setProjectList(projectList.filter(p => p.id !== projId));
      }
    } catch (err) {
      alert("Failed to delete project.");
    }
  };

  const addCertificateItem = async () => {
    if (!newCert.name) return;
    try {
      if (resumeId) {
        await adminService.apiClient.post(`/api/resume-studio/${resumeId}/certificate`, newCert);
        await reloadResumeDetails(resumeId);
      } else {
        setCertificateList([...certificateList, { ...newCert, id: Date.now() }]);
      }
      setNewCert({ name: '', organization: '', issue_date: '', credential_id: '', credential_url: '' });
    } catch (err) {
      alert("Failed to add certificate.");
    }
  };

  const deleteCertificateItem = async (certId: number) => {
    try {
      if (resumeId) {
        await adminService.apiClient.delete(`/api/resume-studio/certificate/${certId}`);
        await reloadResumeDetails(resumeId);
      } else {
        setCertificateList(certificateList.filter(c => c.id !== certId));
      }
    } catch (err) {
      alert("Failed to delete certificate.");
    }
  };

  const handleToggleSkill = async (s: any) => {
    const isAdded = skillList.some(sk => sk.name.toLowerCase() === s.name.toLowerCase());
    try {
      if (isAdded) {
        const target = skillList.find(sk => sk.name.toLowerCase() === s.name.toLowerCase());
        if (target) {
          if (resumeId && target.id) {
            await adminService.apiClient.delete(`/api/resume-studio/skill/${target.id}`);
            await reloadResumeDetails(resumeId);
          } else {
            setSkillList(skillList.filter(sk => sk.name.toLowerCase() !== s.name.toLowerCase()));
          }
        }
      } else {
        const newSkill = { category: s.category, name: s.name, level: 3 };
        if (resumeId) {
          await adminService.apiClient.post(`/api/resume-studio/${resumeId}/skill`, newSkill);
          await reloadResumeDetails(resumeId);
        } else {
          setSkillList([...skillList, { ...newSkill, id: Date.now() }]);
        }
      }
    } catch (err) {
      alert("Failed to update skill.");
    }
  };

  const handleRateSkill = async (skillName: string, level: number) => {
    const target = skillList.find(s => s.name === skillName);
    if (!target) return;
    try {
      if (resumeId) {
        await adminService.apiClient.post(`/api/resume-studio/${resumeId}/skill`, {
          category: target.category,
          name: target.name,
          level: level
        });
        await reloadResumeDetails(resumeId);
      } else {
        setSkillList(skillList.map(s => s.name === skillName ? { ...s, level } : s));
      }
    } catch (err) {
      alert("Failed to rate skill.");
    }
  };


  return (
    <div className="flex flex-col gap-6 min-h-screen text-left">
      
      {/* 1. CREATION WIZARD SCREEN */}
      {builderMode === 'wizard' && (
        <div className="w-full max-w-3xl mx-auto bg-white border border-slate-200/60 rounded-3xl p-6 md:p-8 shadow-xl animate-fadeIn">
          
          {/* Header Progress Track */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <Button onClick={() => navigate('/dashboard')} variant="ghost" size="sm" className="p-2">
                <ChevronLeft size={20} />
              </Button>
              <div>
                <h2 className="text-lg font-black text-slate-800 tracking-tight">{masterForm.name}</h2>
                <p className="text-[10px] text-slate-450 font-semibold uppercase mt-0.5 tracking-wider">
                  Step {currentStep} of 9: {
                    currentStep === 1 ? 'Details' :
                    currentStep === 2 ? 'Personal Info' :
                    currentStep === 3 ? 'Education' :
                    currentStep === 4 ? 'Technical Skills' :
                    currentStep === 5 ? 'Projects' :
                    currentStep === 6 ? 'Experience' :
                    currentStep === 7 ? 'Certificates' :
                    currentStep === 8 ? 'Achievements' : 'Template Preview'
                  }
                </p>
              </div>
            </div>
            
            {/* Progress line */}
            <div className="flex gap-1.5 items-center">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className={`h-1.5 w-6 rounded-full transition-all ${currentStep >= i + 1 ? 'bg-blue-600' : 'bg-slate-100'}`} />
              ))}
            </div>
          </div>

          {/* STEP 1: RESUME DETAILS */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-5">
              <Input label="Resume Name" value={masterForm.name} onChange={(e) => setMasterForm({ ...masterForm, name: e.target.value })} required />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Resume Type</label>
                  <select value={masterForm.resume_type} onChange={(e) => setMasterForm({ ...masterForm, resume_type: e.target.value })} className="w-full pl-3 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                    <option value="Fresher">Fresher (Student/Entry-level)</option>
                    <option value="Internship">Internship</option>
                    <option value="Experienced">Experienced Professional</option>
                  </select>
                </div>
                <Input label="Target Job Role" value={masterForm.target_role} onChange={(e) => setMasterForm({ ...masterForm, target_role: e.target.value })} placeholder="e.g. SDE-1 Frontend" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Preferred Industry" value={masterForm.preferred_industry} onChange={(e) => setMasterForm({ ...masterForm, preferred_industry: e.target.value })} />
                <Input label="Language" value={masterForm.language} onChange={(e) => setMasterForm({ ...masterForm, language: e.target.value })} />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Career Objective</label>
                <textarea value={masterForm.career_objective} onChange={(e) => setMasterForm({ ...masterForm, career_objective: e.target.value })} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none" rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input label="Expected Salary (Optional)" value={masterForm.expected_salary || ''} onChange={(e) => setMasterForm({ ...masterForm, expected_salary: e.target.value })} />
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Visibility</label>
                  <select value={masterForm.visibility} onChange={(e) => setMasterForm({ ...masterForm, visibility: e.target.value })} className="w-full pl-3 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                    <option value="Private">🔒 Private (Only Me)</option>
                    <option value="Public">🌐 Public (Shareable Link)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PERSONAL INFORMATION */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Name</span>
                  <span className="font-bold text-slate-700 mt-1 block">{personalInfo.name}</span>
                </div>
                <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Roll Number</span>
                  <span className="font-bold text-slate-700 mt-1 block">{personalInfo.roll_number}</span>
                </div>
                <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">College Email</span>
                  <span className="font-bold text-slate-700 mt-1 block">{personalInfo.email}</span>
                </div>
                <div className="bg-slate-50 border border-slate-150 p-3 rounded-2xl">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Dept / Semester</span>
                  <span className="font-bold text-slate-700 mt-1 block">{personalInfo.department} (Sem {personalInfo.semester})</span>
                </div>
              </div>

              <hr className="border-slate-100" />

              <div className="grid grid-cols-2 gap-4">
                <Input label="Phone Number" value={personalInfo.phone} onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })} />
                <Input label="Location Address" value={personalInfo.address} onChange={(e) => setPersonalInfo({ ...personalInfo, address: e.target.value })} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Input label="LinkedIn URL" value={personalInfo.linkedin} onChange={(e) => setPersonalInfo({ ...personalInfo, linkedin: e.target.value })} />
                <Input label="GitHub Link" value={personalInfo.github} onChange={(e) => setPersonalInfo({ ...personalInfo, github: e.target.value })} />
                <Input label="Portfolio Website" value={personalInfo.portfolio} onChange={(e) => setPersonalInfo({ ...personalInfo, portfolio: e.target.value })} />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Personal Summary</label>
                <textarea value={personalInfo.summary} onChange={(e) => setPersonalInfo({ ...personalInfo, summary: e.target.value })} className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none" rows={3} />
              </div>
            </div>
          )}

          {/* STEP 3: EDUCATION */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-6">
              <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl">
                <h4 className="font-extrabold text-xs text-slate-800 mb-2">College Details (Auto-fetched)</h4>
                <div className="grid grid-cols-3 gap-4 text-xs font-semibold text-slate-650">
                  <div>College: {personalInfo.college_name}</div>
                  <div>Course: {personalInfo.course} ({personalInfo.department})</div>
                  <div>Graduation: {personalInfo.expected_graduation}</div>
                </div>
              </div>

              {/* Add other education */}
              <div className="border border-slate-200/60 p-5 rounded-3xl flex flex-col gap-4">
                <h4 className="font-bold text-xs text-slate-800">Add 10th / 12th / Diploma / Degrees</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Institution Name" value={newEdu.institution} onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })} />
                  <Input label="Degree / Board" value={newEdu.degree} onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })} placeholder="e.g. CBSE 12th" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Input label="Passing Year" type="number" value={newEdu.passing_year} onChange={(e) => setNewEdu({ ...newEdu, passing_year: parseInt(e.target.value) })} />
                  <Input label="Percentage / CGPA" type="number" step="0.01" value={newEdu.cgpa} onChange={(e) => setNewEdu({ ...newEdu, cgpa: parseFloat(e.target.value) })} />
                  <Input label="Achievements" value={newEdu.achievements} onChange={(e) => setNewEdu({ ...newEdu, achievements: e.target.value })} placeholder="Distinction" />
                </div>

                <Button onClick={addEducationItem} variant="outline" size="sm" className="w-40 font-bold border-slate-200 hover:bg-slate-50">
                  + Add Record
                </Button>
              </div>

              {/* Listed Educations */}
              <div className="flex flex-col gap-2.5">
                {educationList.map((edu, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold">
                    <div>
                      <h5 className="font-bold text-slate-800">{edu.institution}</h5>
                      <p className="text-[10px] text-slate-450 mt-0.5">{edu.degree} • Passed: {edu.passing_year} • Grade: {edu.cgpa}% / CGPA</p>
                    </div>
                    <button onClick={() => deleteEducationItem(edu.id)} className="text-red-650 hover:bg-red-50 p-1.5 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: TECHNICAL SKILLS */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-5">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Search and multi-select technologies..." 
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none text-xs text-slate-700 font-medium"
                />
              </div>

              {/* Categorised skill presets matches */}
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-1 no-scrollbar">
                {PRESET_SKILLS
                  .filter(s => s.name.toLowerCase().includes(skillSearch.toLowerCase()))
                  .map((s) => {
                    const isAdded = skillList.some(sk => sk.name.toLowerCase() === s.name.toLowerCase());
                    return (
                      <button 
                        key={s.name}
                        onClick={() => handleToggleSkill(s)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-smooth ${
                          isAdded 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                            : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100'
                        }`}
                      >
                        {s.name} ({s.category}) {isAdded ? '✓' : '+'}
                      </button>
                    );
                  })
                }
              </div>

              {/* Selected skills rating registry */}
              <div className="border border-slate-200/60 p-5 rounded-3xl flex flex-col gap-4">
                <h4 className="font-bold text-xs text-slate-800">Rate Added Skills (1-5 Stars)</h4>
                
                <div className="flex flex-col gap-3">
                  {skillList.map((sk) => (
                    <div key={sk.name} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                      <span className="text-xs font-bold text-slate-700">{sk.name} ({sk.category})</span>
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleRateSkill(sk.name, idx + 1)}
                            className={`w-3.5 h-3.5 rounded ${idx + 1 <= sk.level ? 'bg-amber-400' : 'bg-slate-200'}`}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: PROJECTS */}
          {currentStep === 5 && (
            <div className="flex flex-col gap-6">
              {/* Add manual project */}
              <div className="border border-slate-200/60 p-5 rounded-3xl flex flex-col gap-4">
                <h4 className="font-bold text-xs text-slate-800">Add Academic / Personal Projects</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Project Name" value={newProj.name} onChange={(e) => setNewProj({ ...newProj, name: e.target.value })} />
                  <Input label="Tech Stack" value={newProj.tech_stack} onChange={(e) => setNewProj({ ...newProj, tech_stack: e.target.value })} placeholder="React, Node, SQLite" />
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Project Description</label>
                  <textarea value={newProj.description} onChange={(e) => setNewProj({ ...newProj, description: e.target.value })} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none" rows={3} placeholder="Describe goals, challenges, metrics..." />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Input label="Duration" value={newProj.duration || ''} onChange={(e) => setNewProj({ ...newProj, duration: e.target.value })} />
                  <Input label="GitHub URL" value={newProj.github_link || ''} onChange={(e) => setNewProj({ ...newProj, github_link: e.target.value })} />
                  <Input label="Demo Link" value={newProj.live_demo || ''} onChange={(e) => setNewProj({ ...newProj, live_demo: e.target.value })} />
                </div>

                <Button onClick={addProjectItem} variant="outline" size="sm" className="w-40 font-bold border-slate-200 hover:bg-slate-50">
                  + Add Project
                </Button>
              </div>

              {/* Project list preview */}
              <div className="flex flex-col gap-3">
                {projectList.map((p, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-2 relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-xs text-slate-800">{p.name}</h5>
                        <span className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 block">Tech: {p.tech_stack}</span>
                      </div>
                      <button onClick={() => deleteProjectItem(p.id)} className="text-red-650 hover:bg-red-50 p-1.5 rounded-lg">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-slate-650 leading-relaxed mt-1">{p.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: EXPERIENCE */}
          {currentStep === 6 && (
            <div className="flex flex-col gap-6">
              {masterForm.resume_type === 'Fresher' ? (
                <div className="p-6 bg-slate-50 border border-slate-150 rounded-2xl text-center flex flex-col items-center gap-3">
                  <AlertCircle className="text-slate-400" size={32} />
                  <h4 className="font-bold text-sm text-slate-800">Freshers Experience Skip</h4>
                  <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                    You selected "Fresher" type in step 1. Professional experience fields are hidden. You can click Next to continue or add volunteer/internship listings if available.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200/60 p-5 rounded-3xl flex flex-col gap-4">
                  <h4 className="font-bold text-xs text-slate-800">Add Professional Experience / Internship</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Company Name" value={newExp.company} onChange={(e) => setNewExp({ ...newExp, company: e.target.value })} />
                    <Input label="Position" value={newExp.position} onChange={(e) => setNewExp({ ...newExp, position: e.target.value })} placeholder="Intern / Developer" />
                  </div>

                  <Input label="Duration" value={newExp.duration} onChange={(e) => setNewExp({ ...newExp, duration: e.target.value })} placeholder="June 2025 - August 2025" />
                  
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Responsibilities / Description</label>
                    <textarea value={newExp.description} onChange={(e) => setNewExp({ ...newExp, description: e.target.value })} className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none" rows={3} />
                  </div>

                  <Button onClick={addExperienceItem} variant="outline" size="sm" className="w-40 font-bold border-slate-200 hover:bg-slate-50">
                    + Add Experience
                  </Button>
                </div>
              )}

              {/* Experience list */}
              {experienceList.map((e, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h5 className="font-bold text-xs text-slate-800">{e.position} at {e.company}</h5>
                      <span className="text-[10px] text-slate-450">{e.duration}</span>
                    </div>
                    <button onClick={() => deleteExperienceItem(e.id)} className="text-red-650 p-1 rounded-lg">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{e.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* STEP 7: CERTIFICATES */}
          {currentStep === 7 && (
            <div className="flex flex-col gap-6">
              <div className="border border-slate-200/60 p-5 rounded-3xl flex flex-col gap-4">
                <h4 className="font-bold text-xs text-slate-800">Add Professional Certifications</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Certificate Name" value={newCert.name} onChange={(e) => setNewCert({ ...newCert, name: e.target.value })} />
                  <Input label="Issuing Organization" value={newCert.organization} onChange={(e) => setNewCert({ ...newCert, organization: e.target.value })} placeholder="e.g. AWS, Oracle" />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Input label="Issue Date" value={newCert.issue_date} onChange={(e) => setNewCert({ ...newCert, issue_date: e.target.value })} placeholder="MM-YYYY" />
                  <Input label="Credential ID" value={newCert.credential_id} onChange={(e) => setNewCert({ ...newCert, credential_id: e.target.value })} />
                  <Input label="Verification URL" value={newCert.credential_url} onChange={(e) => setNewCert({ ...newCert, credential_url: e.target.value })} />
                </div>

                <Button onClick={addCertificateItem} variant="outline" size="sm" className="w-40 font-bold border-slate-200 hover:bg-slate-50">
                  + Add Certificate
                </Button>
              </div>

              {/* Certificate list */}
              {certificateList.map((c, idx) => (
                <div key={idx} className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold">
                  <div>
                    <h5 className="font-bold text-slate-800">{c.name}</h5>
                    <p className="text-[10px] text-slate-450 mt-0.5">{c.organization} • ID: {c.credential_id || 'N/A'} • {c.issue_date}</p>
                  </div>
                  <button onClick={() => deleteCertificateItem(c.id)} className="text-red-650 p-1 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* STEP 8: ACHIEVEMENTS */}
          {currentStep === 8 && (
            <div className="flex flex-col gap-5">
              <Input label="Hackathons & Competitions" value={achievements.hackathons} onChange={(e) => setAchievements({ ...achievements, hackathons: e.target.value })} />
              <Input label="Awards & Scholarships" value={achievements.awards} onChange={(e) => setAchievements({ ...achievements, awards: e.target.value })} />
              <Input label="Soft Skills" value={achievements.soft_skills} onChange={(e) => setAchievements({ ...achievements, soft_skills: e.target.value })} />
              <Input label="Extra Curricular Activities" value={achievements.extracurricular} onChange={(e) => setAchievements({ ...achievements, extracurricular: e.target.value })} />
            </div>
          )}

          {/* STEP 9: CHOOSE TEMPLATE & FINALIZE */}
          {currentStep === 9 && (
            <div className="flex flex-col gap-6 text-center">
              <h3 className="font-extrabold text-slate-800 text-sm mb-2 text-left">Select a Design Template</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {templates.map((tpl) => (
                  <div 
                    key={tpl.slug} 
                    onClick={() => setMasterForm({ ...masterForm, template_id: tpl.slug, color_theme: tpl.color_theme })}
                    className={`bg-white border rounded-3xl p-4.5 cursor-pointer flex flex-col justify-between h-48 shadow-sm transition-all duration-200 ${
                      masterForm.template_id === tpl.slug ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200/60 hover:border-slate-400'
                    }`}
                  >
                    <div className="text-left">
                      <h4 className="font-extrabold text-sm text-slate-800">{tpl.name}</h4>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 block">{tpl.category} Layout</span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 pt-3 border-t border-slate-100 uppercase">
                      <span>ATS compliance: {tpl.ats_rating}%</span>
                      <span>Color: {tpl.color_theme}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom Navigation */}
          <div className="flex justify-between items-center border-t border-slate-100 pt-5 mt-8">
            <button 
              onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
              disabled={currentStep === 1}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              Previous
            </button>

            {currentStep < 9 ? (
              <Button onClick={() => setCurrentStep(currentStep + 1)} variant="primary" size="sm" className="bg-slate-800 hover:bg-slate-900 font-bold gap-1.5">
                Next <ArrowRight size={14} />
              </Button>
            ) : (
              <Button onClick={handleGenerateResume} variant="primary" size="sm" className="bg-blue-600 hover:bg-blue-700 font-bold gap-1.5 shadow-md shadow-blue-500/10">
                Generate Resume <Sparkles size={14} />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 2. LIVE STUDIO SCREEN */}
      {builderMode === 'studio' && (
        <div className="flex flex-col gap-6 h-[calc(100vh-64px)] w-full">
          {/* Header Title bar */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <Button onClick={() => navigate('/dashboard')} variant="ghost" size="sm" className="p-2">
                <ChevronLeft size={20} />
              </Button>
              <div>
                <h1 className="text-xl font-black text-slate-850 tracking-tight">{masterForm.name}</h1>
                <p className="text-[10px] text-slate-450 font-semibold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {saveStatus}
                </p>
              </div>
            </div>

            {/* Top Toolbar Tabs */}
            <div className="flex gap-1.5">
              {[
                { id: 'editor', label: 'Resume Editor' },
                { id: 'templates', label: 'Design Layouts' },
                { id: 'ats', label: 'ATS Scorecard' },
                { id: 'readiness', label: 'Roadmap recommendations' },
                { id: 'versions', label: 'Backup Versions' },
                { id: 'export', label: 'Export files' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveStudioTab(tab.id as any)}
                  className={`px-3 py-1.8 rounded-xl text-[10px] font-bold transition-smooth ${
                    activeStudioTab === tab.id 
                      ? 'bg-slate-800 text-white shadow' 
                      : 'bg-white border border-slate-200/60 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Core Panel Content */}
          <div className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden h-full pb-6">
            
            {/* LEFT TABBED CONTROLS */}
            <div className="flex flex-col gap-6 overflow-y-auto no-scrollbar pr-2 text-left">
              
              {activeStudioTab === 'editor' && (
                <div className="flex flex-col gap-6">
                  {/* Personal summary summary */}
                  <Card className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-extrabold text-slate-800 text-sm">Personal Summary</h3>
                      <button onClick={handleAIEnhanceSummary} className="text-[10px] text-blue-600 font-extrabold flex items-center gap-1 hover:underline">
                        <Sparkles size={12} /> AI Optimize Summary
                      </button>
                    </div>
                    <textarea 
                      value={personalInfo.summary}
                      onChange={(e) => setPersonalInfo({ ...personalInfo, summary: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none"
                      rows={3}
                    />
                  </Card>

                  {/* Objective objective */}
                  <Card className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-extrabold text-slate-800 text-sm">Career Objective</h3>
                      <button onClick={handleAIRewriteObjective} className="text-[10px] text-blue-600 font-extrabold flex items-center gap-1 hover:underline">
                        <Sparkles size={12} /> AI Improve Objective
                      </button>
                    </div>
                    <textarea 
                      value={masterForm.career_objective}
                      onChange={(e) => setMasterForm({ ...masterForm, career_objective: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 text-xs rounded-xl focus:outline-none"
                      rows={3}
                    />
                  </Card>

                  {/* Projects manager list */}
                  <Card className="flex flex-col gap-4">
                    <h3 className="font-extrabold text-slate-800 text-sm">Projects Catalogue</h3>
                    <div className="flex flex-col gap-4">
                      {projectList.map((p) => (
                        <div key={p.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-800">{p.name}</span>
                            <button onClick={() => handleAIRewriteProject(p.id)} className="text-[9px] text-blue-600 font-bold flex items-center gap-1 hover:underline">
                              <Sparkles size={10} /> AI Improve Bullets
                            </button>
                          </div>
                          <textarea 
                            value={p.description}
                            onChange={(e) => {
                              const updated = projectList.map(pr => pr.id === p.id ? { ...pr, description: e.target.value } : pr);
                              setProjectList(updated);
                            }}
                            className="w-full p-2.5 bg-white border border-slate-200 text-xs rounded-xl"
                            rows={3}
                          />
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Section Drag / Hide configuration */}
                  <Card className="flex flex-col gap-4">
                    <h3 className="font-extrabold text-slate-800 text-sm">Manage Document Layout Sections</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(sectionVisibility).map(([key, isShown]) => (
                        <button
                          key={key}
                          onClick={() => setSectionVisibility({ ...sectionVisibility, [key]: !isShown })}
                          className={`flex items-center gap-2 p-2.5 border rounded-2xl transition-smooth text-[10px] font-bold ${
                            isShown ? 'border-blue-200 bg-blue-50/20 text-blue-600' : 'border-slate-200 text-slate-450 bg-slate-50/50'
                          }`}
                        >
                          {isShown ? <CheckSquare size={14} /> : <Square size={14} />}
                          <span className="capitalize">{key}</span>
                        </button>
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* DESIGN TEMPLATE TAB */}
              {activeStudioTab === 'templates' && (
                <div className="grid grid-cols-2 gap-5">
                  {templates.map((tpl) => (
                    <div 
                      key={tpl.slug}
                      onClick={() => setMasterForm({ ...masterForm, template_id: tpl.slug, color_theme: tpl.color_theme })}
                      className={`bg-white border rounded-3xl p-5 cursor-pointer flex flex-col justify-between h-44 shadow-sm hover:shadow transition-all duration-200 ${
                        masterForm.template_id === tpl.slug ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-200/60'
                      }`}
                    >
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-800">{tpl.name}</h4>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5 block">{tpl.category} style</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-450 pt-3 border-t border-slate-100 uppercase">
                        <span>ATS Score: {tpl.ats_rating}%</span>
                        <span className="capitalize">Theme: {tpl.color_theme}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ATS SCORECARD TAB */}
              {activeStudioTab === 'ats' && (
                <div className="flex flex-col gap-6 text-left">
                  <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
                      <h3 className="font-extrabold text-sm text-slate-800">ATS Analyzer scorecard</h3>
                      <button onClick={handleATSAutoFix} className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-600 px-3 py-1.5 rounded-xl font-bold hover:bg-emerald-100 transition-smooth">
                        One-Click Auto Fix
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[
                        { label: 'Overall Score', score: atsScorecard.overall_score },
                        { label: 'Formatting Audit', score: atsScorecard.formatting_score },
                        { label: 'Keyword Compliance', score: atsScorecard.keyword_match },
                        { label: 'Grammar Accuracy', score: atsScorecard.grammar_score },
                        { label: 'Readability Score', score: atsScorecard.readability_score },
                        { label: 'Recruiter Score', score: atsScorecard.recruiter_score }
                      ].map((item) => (
                        <div key={item.label} className="p-3 bg-slate-50 border border-slate-150 rounded-2xl text-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">{item.label}</span>
                          <h4 className="text-xl font-black text-slate-800 mt-1.5">{item.score}%</h4>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 bg-rose-50/50 border border-rose-100 rounded-2xl p-4 flex flex-col gap-2">
                      <span className="text-[10px] text-rose-500 font-black uppercase tracking-wider block">Missing Keywords suggestions</span>
                      <p className="text-xs font-semibold text-slate-700 leading-relaxed">
                        {atsScorecard.missing_keywords || 'No missing keywords identified. Your resume matches perfectly!'}
                      </p>
                    </div>

                    <div className="mt-4 bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col gap-2">
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Formatting Suggestions</span>
                      <p className="text-xs font-semibold text-slate-650 leading-relaxed">
                        {atsScorecard.suggestions}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* CAREER READINESS TAB */}
              {activeStudioTab === 'readiness' && (
                <div className="flex flex-col gap-6 text-left">
                  <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
                      <h3 className="font-extrabold text-sm text-slate-800">Career Readiness Scorecard</h3>
                      <button onClick={handleAITriggerRoadmap} className="text-[10px] bg-blue-50 border border-blue-200 text-blue-600 px-3 py-1.5 rounded-xl font-bold hover:bg-blue-100 transition-smooth">
                        Refresh AI Audit
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-center">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Job Readiness Status</span>
                        <h4 className="text-lg font-black text-emerald-600 mt-1">{readinessReport.job_readiness}</h4>
                      </div>
                      <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-center">
                        <span className="text-[9px] text-slate-400 font-bold uppercase block">Interview Score</span>
                        <h4 className="text-lg font-black text-slate-800 mt-1">{readinessReport.interview_readiness}%</h4>
                      </div>
                    </div>

                    <div className="mt-5 bg-slate-50 border border-slate-150 rounded-2xl p-4.5">
                      <span className="text-[9px] text-slate-400 font-black uppercase block mb-1">Skills Gaps Identified</span>
                      <p className="text-xs font-bold text-slate-700">{readinessReport.skill_gap}</p>
                    </div>

                    <div className="mt-4 bg-slate-50 border border-slate-150 rounded-2xl p-4.5">
                      <span className="text-[9px] text-slate-400 font-black uppercase block mb-1">Recommended Certifications & Courses</span>
                      <p className="text-xs font-bold text-slate-700">{readinessReport.recommended_certifications}</p>
                      <p className="text-xs text-slate-500 mt-2 font-medium">{readinessReport.recommended_courses}</p>
                    </div>

                    <div className="mt-4 bg-blue-50/20 border border-blue-100 rounded-2xl p-4.5">
                      <span className="text-[9px] text-blue-600 font-black uppercase block mb-1">Learning Roadmap Plan</span>
                      <p className="text-xs font-semibold text-slate-650 leading-relaxed whitespace-pre-line">{readinessReport.learning_roadmap}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* BACKUP VERSION HISTORY TAB */}
              {activeStudioTab === 'versions' && (
                <div className="flex flex-col gap-6 text-left">
                  <div className="bg-white border border-slate-200/60 rounded-3xl p-5 shadow-sm">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-5">
                      <h3 className="font-extrabold text-sm text-slate-800">State Versions History</h3>
                      <button onClick={handleSaveVersion} className="text-[10px] bg-blue-50 border border-blue-200 text-blue-600 px-3 py-1.5 rounded-xl font-bold hover:bg-blue-100 transition-smooth">
                        Save Current State
                      </button>
                    </div>

                    <div className="flex flex-col gap-3">
                      {versions.map((ver) => (
                        <div key={ver.id} className="flex justify-between items-center p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold">
                          <div>
                            <h4 className="font-bold text-slate-800">Version {ver.version_number}: {ver.name}</h4>
                            <p className="text-[9px] text-slate-400 mt-0.5">ATS compliance: {ver.ats_score}% • {new Date(ver.created_at).toLocaleString()}</p>
                          </div>
                          <button onClick={() => handleRestoreVersion(ver.id)} className="text-[10px] text-blue-600 font-bold hover:underline">
                            Restore State
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* EXPORTS TAB */}
              {activeStudioTab === 'export' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                  {[
                    { type: 'pdf', title: 'Download PDF file', desc: 'Secure cached PDF compilation. Optimised format.' },
                    { type: 'docx', title: 'Download DOCX document', desc: 'Editable Microsoft Word format.' },
                    { type: 'print', title: 'Send to Print', desc: 'Open print setup overlay.' }
                  ].map((exp) => (
                    <div key={exp.type} className="bg-white border border-slate-200/60 rounded-3xl p-5 flex flex-col justify-between min-h-48 shadow-sm">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-800">{exp.title}</h4>
                        <p className="text-xs text-slate-500 mt-2 bg-slate-50 border border-slate-100 p-2.5 rounded-xl leading-relaxed">{exp.desc}</p>
                      </div>
                      <div className="pt-3 border-t border-slate-100">
                        <Button 
                          onClick={async () => {
                            if (exp.type === 'print') {
                              const token = localStorage.getItem('auth_token');
                              const url = `${API_BASE_URL}/api/resume-studio/${resumeId}/pdf${token ? `?token=${token}` : ''}`;
                              window.open(url, '_blank');
                              return;
                            }
                            
                            try {
                              const response = await adminService.apiClient.get(
                                `/api/resume-studio/${resumeId}/${exp.type}`,
                                { responseType: 'blob' }
                              );
                              
                              const blob = new Blob([response.data], { 
                                type: exp.type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
                              });
                              const downloadUrl = window.URL.createObjectURL(blob);
                              
                              const a = document.createElement('a');
                              a.href = downloadUrl;
                              const formattedName = personalInfo.name.trim().replace(/\s+/g, '_');
                              a.download = `${formattedName}_Resume.${exp.type}`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                              window.URL.revokeObjectURL(downloadUrl);
                              
                              showToast("Resume downloaded successfully.", "success");
                            } catch (err) {
                              console.error(err);
                              showToast("Unable to generate resume.", "error");
                            }
                          }} 
                          variant="primary" 
                          size="sm" 
                          className="bg-blue-600 font-bold w-full justify-center"
                        >
                          Generate File
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT LIVE DOCUMENT PREVIEW CONTAINER */}
            <div className="hidden lg:flex flex-col bg-slate-100 border border-slate-200/60 rounded-3xl p-6 overflow-y-auto relative items-center justify-between no-scrollbar">
              
              {/* Toolbar Zoom overlays */}
              <div className="absolute top-4 right-4 flex gap-1.5 z-20">
                <button onClick={() => setZoomLevel(zoomLevel + 0.1)} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-650 hover:bg-slate-50 shadow-sm">
                  <ZoomIn size={14} />
                </button>
                <button onClick={() => setZoomLevel(Math.max(0.6, zoomLevel - 0.1))} className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-650 hover:bg-slate-50 shadow-sm">
                  <ZoomOut size={14} />
                </button>
              </div>

              {/* Dynamic Theme classes based on color_theme */}
              <div 
                className="w-full max-w-[540px] bg-white rounded shadow-2xl p-8 aspect-[1/1.4] flex flex-col gap-4 border border-slate-200/40 transform origin-top transition-transform duration-250 select-text text-left"
                style={{ transform: `scale(${zoomLevel})` }}
              >
                {/* Header Title block */}
                <div className={`text-center pb-4 border-b ${
                  masterForm.color_theme === 'blue' ? 'border-blue-100' :
                  masterForm.color_theme === 'indigo' ? 'border-indigo-100' : 'border-slate-200'
                }`}>
                  <h2 className={`text-2xl font-black ${
                    masterForm.color_theme === 'blue' ? 'text-blue-650' :
                    masterForm.color_theme === 'indigo' ? 'text-indigo-650' : 'text-slate-800'
                  }`}>{personalInfo.name}</h2>
                  
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">
                    {personalInfo.email} • {personalInfo.phone} • {personalInfo.address}
                  </p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                    LinkedIn: {personalInfo.linkedin} | GitHub: {personalInfo.github}
                  </p>
                </div>

                {/* Profile Summary section */}
                <div className="flex flex-col gap-1">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Professional Summary</h4>
                  <p className="text-[10px] text-slate-600 leading-relaxed font-medium">{personalInfo.summary}</p>
                </div>

                {/* Education section */}
                <div className="flex flex-col gap-1.5">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Education Details</h4>
                  <hr className="border-slate-100" />
                  {educationList.map((edu, idx) => (
                    <div key={idx} className="flex justify-between items-start text-[10px]">
                      <div>
                        <strong className="text-slate-800">{edu.institution}</strong> — <span>{edu.degree}</span>
                        {edu.achievements && <p className="text-[9px] text-slate-500 font-medium">{edu.achievements}</p>}
                      </div>
                      <span className="font-bold text-slate-450 shrink-0">{edu.passing_year}</span>
                    </div>
                  ))}
                </div>

                {/* Skills section */}
                {sectionVisibility.skills && skillList.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Technical Skills</h4>
                    <hr className="border-slate-100" />
                    <div className="flex flex-wrap gap-1.5">
                      {skillList.map((sk) => (
                        <span key={sk.name} className="px-2 py-0.5 bg-slate-50 border border-slate-200/60 rounded text-[9px] font-bold text-slate-650">
                          {sk.name} (Lvl {sk.level})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects section */}
                {sectionVisibility.projects && projectList.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Academic Projects</h4>
                    <hr className="border-slate-100" />
                    {projectList.map((p, idx) => (
                      <div key={idx} className="flex flex-col gap-0.5 text-[10px] leading-relaxed">
                        <div className="flex justify-between items-center">
                          <strong className="text-slate-850">{p.name}</strong>
                          <span className="text-[9px] text-slate-400 font-semibold">{p.duration || '2 Months'}</span>
                        </div>
                        <p className="text-[9px] text-slate-450 font-bold">Tech: {p.tech_stack}</p>
                        <p className="text-[9px] text-slate-600 font-medium">{p.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Experience section */}
                {sectionVisibility.experience && experienceList.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500">Experience</h4>
                    <hr className="border-slate-100" />
                    {experienceList.map((e, idx) => (
                      <div key={idx} className="flex flex-col gap-0.5 text-[10px] leading-relaxed">
                        <div className="flex justify-between items-center">
                          <strong className="text-slate-850">{e.position} @ {e.company}</strong>
                          <span className="text-[9px] text-slate-400 font-semibold">{e.duration}</span>
                        </div>
                        <p className="text-[9px] text-slate-600 font-medium">{e.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-8">
                Canvas Template: {masterForm.template_id} ({masterForm.color_theme})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. AI LOADER OVERLAY */}
      {isGenerating && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn text-center">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 w-full max-w-sm shadow-2xl flex flex-col items-center gap-5">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <div>
              <h4 className="text-base font-extrabold text-slate-800">Generating AI Resume Studio</h4>
              <p className="text-xs text-slate-550 mt-2 font-medium animate-pulse">
                {generationStep < generationSteps.length ? generationSteps[generationStep] : 'Finalizing components...'}
              </p>
            </div>
            
            {/* Steps checklists */}
            <div className="w-full border-t border-slate-100 pt-4 flex flex-col gap-1.5 text-left text-[10px] font-bold text-slate-400">
              {generationSteps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-black ${
                    generationStep > idx 
                      ? 'bg-emerald-50 border border-emerald-250 text-emerald-600' 
                      : generationStep === idx ? 'bg-blue-50 border border-blue-200 text-blue-600' : 'bg-slate-50 border border-slate-200'
                  }`}>
                    {generationStep > idx ? '✓' : '○'}
                  </div>
                  <span className={generationStep === idx ? 'text-slate-800' : ''}>{step.replace('...', '')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4.5 py-3 rounded-2xl shadow-lg border text-xs font-bold animate-fadeIn transition-all duration-300 ${
          toast.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-rose-50 border-rose-200 text-rose-700'
        }`}>
          {toast.type === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
};
export default ResumeBuilder;
