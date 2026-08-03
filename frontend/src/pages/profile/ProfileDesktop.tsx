import React, { useState, useEffect } from 'react';
import { 
  User, Mail, BookOpen, GraduationCap, Phone, MapPin, 
  Globe, Lock, Camera, Trash2, Award, Sparkles, CheckCircle, 
  Plus, X, Briefcase, FileCode, CheckSquare, Settings
} from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useUserStore } from '../../store/userStore';
import { adminService } from '../../services/admin';

interface PlacementReadinessResponse {
  readiness_score: number;
  status: string;
  completion_rate: number;
  ats_score: number;
  verification_status: string;
  suggestions: string;
}

export const ProfileDesktop: React.FC = () => {
  const { user, setUser, token } = useUserStore();
  const [activeTab, setActiveTab] = useState<'general' | 'placement'>('general');
  
  // Profile fields state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Male');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [skills, setSkills] = useState('');
  const [languages, setLanguages] = useState('');
  const [objective, setObjective] = useState('');
  const [photo, setPhoto] = useState('');

  // Placement Profile Specific Fields
  const [city, setCity] = useState('');
  const [stateField, setStateField] = useState('');
  const [country, setCountry] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [course, setCourse] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [cgpa, setCgpa] = useState('');
  const [currentBacklogs, setCurrentBacklogs] = useState('0');
  const [tenthPercentage, setTenthPercentage] = useState('');
  const [twelfthPercentage, setTwelfthPercentage] = useState('');
  const [diplomaPercentage, setDiplomaPercentage] = useState('');
  
  // Detail skills
  const [technicalSkills, setTechnicalSkills] = useState('');
  const [softSkills, setSoftSkills] = useState('');
  const [frameworks, setFrameworks] = useState('');
  const [databases, setDatabases] = useState('');
  const [tools, setTools] = useState('');

  // Career Preferences
  const [preferredRole, setPreferredRole] = useState('');
  const [preferredLocation, setPreferredLocation] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [willingToRelocate, setWillingToRelocate] = useState('Yes');
  const [preferredCompanyType, setPreferredCompanyType] = useState('');

  // Coding Profiles
  const [leetCode, setLeetCode] = useState('');
  const [hackerRank, setHackerRank] = useState('');
  const [codeChef, setCodeChef] = useState('');

  // Arrays (Projects, Certificates, Experience)
  const [projects, setProjects] = useState<Array<{ title: string; description: string; technologies: string; github: string }>>([]);
  const [experience, setExperience] = useState<Array<{ title: string; company: string; description: string; duration: string }>>([]);
  const [certifications, setCertifications] = useState<string[]>([]);

  // Array Add Fields State
  const [newProject, setNewProject] = useState({ title: '', description: '', technologies: '', github: '' });
  const [newExp, setNewExp] = useState({ title: '', company: '', description: '', duration: '' });
  const [newCert, setNewCert] = useState('');

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status indicators
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Readiness state
  const [readiness, setReadiness] = useState<PlacementReadinessResponse | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);

  // Sync state with store on load
  useEffect(() => {
    if (user) {
      setName(user.student_name || '');
      setPhone(user.phone || '');
      setGender((user as any).gender || 'Male');
      setDob(user.dob || '');
      setAddress((user as any).address || '');
      setBio((user as any).bio || '');
      setLinkedin((user as any).linkedin || '');
      setGithub((user as any).github || '');
      setPortfolio((user as any).portfolio_website || '');
      setSkills(user.skills || '');
      setLanguages((user as any).languages || '');
      setObjective((user as any).career_objective || '');
      setPhoto((user as any).profile_photo || '');

      // Placement details
      setCity((user as any).city || '');
      setStateField((user as any).state || '');
      setCountry((user as any).country || '');
      setCollegeName((user as any).college_name || '');
      setCourse((user as any).course || '');
      setGraduationYear((user as any).graduation_year || '');
      setCgpa((user as any).cgpa || '');
      setCurrentBacklogs(String((user as any).current_backlogs || 0));
      setTenthPercentage((user as any).tenth_percentage || '');
      setTwelfthPercentage((user as any).twelfth_percentage || '');
      setDiplomaPercentage((user as any).diploma_percentage || '');
      
      setTechnicalSkills((user as any).technical_skills || '');
      setSoftSkills((user as any).soft_skills || '');
      setFrameworks((user as any).frameworks || '');
      setDatabases((user as any).databases || '');
      setTools((user as any).tools || '');

      setPreferredRole((user as any).preferred_role || '');
      setPreferredLocation((user as any).preferred_location || '');
      setExpectedSalary((user as any).expected_salary || '');
      setWillingToRelocate((user as any).willing_to_relocate || 'Yes');
      setPreferredCompanyType((user as any).preferred_company_type || '');

      setLeetCode((user as any).leet_code || '');
      setHackerRank((user as any).hacker_rank || '');
      setCodeChef((user as any).code_chef || '');

      setProjects((user as any).projects || []);
      setExperience((user as any).experience || []);
      setCertifications((user as any).certifications || []);
    }
  }, [user]);

  const fetchReadiness = async () => {
    try {
      setReadinessLoading(true);
      const res = await adminService.apiClient.get<PlacementReadinessResponse>('/api/auth/profile/readiness');
      setReadiness(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setReadinessLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'placement') {
      fetchReadiness();
    }
  }, [activeTab]);

  const completeness = (() => {
    const fields = [
      name, phone, gender, dob, address, 
      bio, linkedin, github, portfolio, 
      skills, languages, objective, photo
    ];
    const completed = fields.filter(f => f && f.trim() !== '').length;
    return Math.round((completed / fields.length) * 100);
  })();

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: 'File size must be under 2MB', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setPhoto(base64String);
      try {
        await adminService.apiClient.post('/api/auth/profile/upload-photo', { photo: base64String });
        if (user && token) {
          setUser({ ...user, profile_photo: base64String } as any, token);
        }
        setMessage({ text: 'Profile photo uploaded successfully!', type: 'success' });
      } catch (err) {
        setMessage({ text: 'Failed to upload photo.', type: 'error' });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeletePhoto = async () => {
    try {
      await adminService.apiClient.post('/api/auth/profile/upload-photo', { photo: '' });
      setPhoto('');
      if (user && token) {
        setUser({ ...user, profile_photo: '' } as any, token);
      }
      setMessage({ text: 'Profile photo removed!', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to remove photo.', type: 'error' });
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload = {
      student_name: name,
      phone,
      gender,
      address,
      bio,
      linkedin,
      github,
      portfolio_website: portfolio,
      skills,
      languages,
      career_objective: objective,
      // Placement profiles
      city,
      state: stateField,
      country,
      college_name: collegeName,
      course,
      graduation_year: graduationYear,
      cgpa: cgpa ? parseFloat(cgpa) : null,
      current_backlogs: currentBacklogs ? parseInt(currentBacklogs) : 0,
      tenth_percentage: tenthPercentage ? parseFloat(tenthPercentage) : null,
      twelfth_percentage: twelfthPercentage ? parseFloat(twelfthPercentage) : null,
      diploma_percentage: diplomaPercentage ? parseFloat(diplomaPercentage) : null,
      technical_skills: technicalSkills,
      soft_skills: softSkills,
      frameworks,
      databases,
      tools,
      preferred_role: preferredRole,
      preferred_location: preferredLocation,
      expected_salary: expectedSalary,
      willing_to_relocate: willingToRelocate,
      preferred_company_type: preferredCompanyType,
      leet_code: leetCode,
      hacker_rank: hackerRank,
      code_chef: codeChef,
      projects,
      experience,
      certifications
    };

    try {
      await adminService.apiClient.put('/api/auth/profile/update', payload);
      if (user && token) {
        setUser({ ...user, ...payload } as any, token);
      }
      setMessage({ text: 'Profile details saved successfully!', type: 'success' });
      if (activeTab === 'placement') {
        fetchReadiness();
      }
    } catch (err) {
      setMessage({ text: 'Failed to update profile details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      await adminService.apiClient.post('/api/auth/profile/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      setMessage({ text: 'Password updated successfully!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage({ text: 'Incorrect current password or update failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full text-left font-sans animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Student Profile</h2>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
            Manage your personal profile and job placement readiness
          </p>
        </div>

        <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'general' ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            General Profile
          </button>
          <button
            onClick={() => setActiveTab('placement')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'placement' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles size={12} /> Placement Profile
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border text-xs font-semibold ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* LEFT COLUMN: AVATAR & COMPLETENESS */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card className="flex flex-col items-center p-6 text-center">
            <div className="relative group">
              {photo ? (
                <img src={photo} alt="Profile" className="w-28 h-28 rounded-full object-cover border border-slate-200 shadow-md" />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-slate-750 to-slate-850 flex items-center justify-center text-white text-4xl font-extrabold shadow-md">
                  {name.charAt(0).toUpperCase() || 'S'}
                </div>
              )}

              <div className="absolute inset-0 bg-slate-900/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <label className="cursor-pointer text-white hover:text-emerald-400 p-1">
                  <Camera size={18} />
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                {photo && (
                  <button onClick={handleDeletePhoto} className="text-white hover:text-rose-400 p-1">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            <h3 className="text-base font-extrabold text-slate-855 dark:text-white mt-4">{name || 'Enter Full Name'}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{user?.personal_email}</p>

            <div className="w-full border-t border-slate-100 dark:border-white/5 mt-6 pt-6 flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Profile Completion</span>
                <span className="text-slate-800 dark:text-white font-extrabold">{completeness}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-600 h-full rounded-full transition-all duration-300" style={{ width: `${completeness}%` }} />
              </div>
            </div>
          </Card>

          {/* Change Password Card */}
          <Card className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
              <Lock size={16} className="text-slate-700 dark:text-slate-350" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Change Password</h4>
            </div>

            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <Input type="password" label="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
              <Input type="password" label="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              <Input type="password" label="Confirm New Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              
              <Button type="submit" variant="secondary" size="sm" className="font-bold border-slate-200 mt-1" disabled={loading}>
                Update Password
              </Button>
            </form>
          </Card>
        </div>

        {/* RIGHT COLUMN: CORE DETAILS */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {activeTab === 'general' ? (
            <Card className="p-6 flex flex-col gap-6">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
                <User size={16} className="text-slate-700 dark:text-slate-350" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Personal & Academic Details</h4>
              </div>

              <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
                  <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Gender</label>
                    <select 
                      value={gender} 
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-750 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <Input label="Roll Number" value={user?.roll_number || ''} disabled />
                  <Input label="Email" value={user?.personal_email || ''} disabled />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Department" value={user?.department || ''} disabled />
                  <Input label="Semester" value={user?.semester ? `Semester ${user.semester}` : ''} disabled />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Bio / About Me</label>
                  <textarea 
                    value={bio} 
                    onChange={(e) => setBio(e.target.value)} 
                    rows={3} 
                    placeholder="Tell recruiters about yourself..."
                    className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Permanent / Present Address</label>
                  <textarea 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    rows={2}
                    className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-750 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="border-t border-slate-100 dark:border-white/5 pt-4 mt-2">
                  <h5 className="text-xs font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Globe size={14} className="text-slate-500" /> Social Links & Websites
                  </h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="LinkedIn Link" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="linkedin.com/in/username" />
                    <Input label="GitHub Link" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="github.com/username" />
                    <Input label="Portfolio Website" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="username.dev" />
                  </div>
                </div>

                <div className="border-t border-slate-100 dark:border-white/5 pt-4">
                  <h5 className="text-xs font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Award size={14} className="text-slate-500" /> Skills & Career Objectives
                  </h5>
                  <div className="flex flex-col gap-4">
                    <Input label="Core Technical Skills (Comma-separated)" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Python, AWS" />
                    <Input label="Languages Spoken" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="English, Kannada, Hindi" />
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Career Objective</label>
                      <textarea 
                        value={objective} 
                        onChange={(e) => setObjective(e.target.value)} 
                        rows={3} 
                        placeholder="Seeking a challenging position to leverage software development capabilities..."
                        className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-750 dark:text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-3">
                  <Button type="submit" variant="primary" size="md" className="w-48" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Profile Details'}
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            // PLACEMENT PROFILE TAB
            <div className="flex flex-col gap-6 w-full text-left">
              {/* Readiness Score Card */}
              {readinessLoading ? (
                <Card className="flex flex-col items-center py-10 justify-center">
                  <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-slate-450 mt-3">Evaluating placement readiness...</span>
                </Card>
              ) : readiness && (
                <Card className="border border-emerald-500/20 bg-emerald-500/5 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-6">
                  <div className="relative shrink-0 flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full border-4 border-emerald-100 flex flex-col items-center justify-center bg-white dark:bg-slate-900 shadow-md">
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{readiness.readiness_score}%</span>
                      <span className="text-[7.5px] uppercase font-black text-slate-400 tracking-wider">Score</span>
                    </div>
                  </div>

                  <div className="flex-grow text-xs leading-relaxed">
                    <h5 className="font-extrabold text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5 text-xs mb-1 uppercase tracking-wide">
                      <Sparkles size={13} /> {readiness.status}
                    </h5>
                    <div className="text-slate-750 dark:text-slate-250 font-semibold mb-3">
                      Resume Verification: <strong className="text-emerald-600">{readiness.verification_status}</strong> • ATS Match Score: <strong>{readiness.ats_score}%</strong>
                    </div>
                    
                    <div className="bg-white/60 dark:bg-slate-900/40 p-3 rounded-xl border border-emerald-500/10">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-1">AI Improvement Suggestions</span>
                      <p className="whitespace-pre-line text-slate-650 dark:text-slate-350">{readiness.suggestions}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* Placement Form Details */}
              <Card className="p-6 flex flex-col gap-6">
                <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/5 pb-3">
                  <GraduationCap size={16} className="text-slate-700 dark:text-slate-350" />
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Placement Profile Data</h4>
                </div>

                <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
                  {/* College Location */}
                  <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-slate-50 pb-1">1. College & Location Info</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="College Name" value={collegeName} onChange={(e) => setCollegeName(e.target.value)} placeholder="e.g. Bimba Institute of Technology" />
                    <Input label="Course" value={course} onChange={(e) => setCourse(e.target.value)} placeholder="e.g. B.Tech" />
                    <Input label="Graduation Year" value={graduationYear} onChange={(e) => setGraduationYear(e.target.value)} placeholder="e.g. 2026" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />
                    <Input label="State" value={stateField} onChange={(e) => setStateField(e.target.value)} />
                    <Input label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
                  </div>

                  {/* Academics */}
                  <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-slate-50 pb-1 mt-2">2. Academic Performance</h5>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <Input label="Current CGPA" value={cgpa} onChange={(e) => setCgpa(e.target.value)} placeholder="e.g. 8.45" />
                    <Input label="Active Backlogs" value={currentBacklogs} onChange={(e) => setCurrentBacklogs(e.target.value)} placeholder="e.g. 0" />
                    <Input label="10th Percentage (%)" value={tenthPercentage} onChange={(e) => setTenthPercentage(e.target.value)} placeholder="e.g. 92.5" />
                    <Input label="12th Percentage (%)" value={twelfthPercentage} onChange={(e) => setTwelfthPercentage(e.target.value)} placeholder="e.g. 88.0" />
                    <Input label="Diploma % (Optional)" value={diplomaPercentage} onChange={(e) => setDiplomaPercentage(e.target.value)} placeholder="e.g. 85.0" />
                  </div>

                  {/* Detailed Skills breakdown */}
                  <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-slate-50 pb-1 mt-2">3. Detailed Technical Skills</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input label="Technical Skills" value={technicalSkills} onChange={(e) => setTechnicalSkills(e.target.value)} placeholder="e.g. Web Development, Cloud Arch" />
                    <Input label="Soft Skills" value={softSkills} onChange={(e) => setSoftSkills(e.target.value)} placeholder="e.g. Communication, Leadership" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Frameworks" value={frameworks} onChange={(e) => setFrameworks(e.target.value)} placeholder="e.g. React, Express, Django" />
                    <Input label="Databases" value={databases} onChange={(e) => setDatabases(e.target.value)} placeholder="e.g. MongoDB, PostgreSQL" />
                    <Input label="Tools" value={tools} onChange={(e) => setTools(e.target.value)} placeholder="e.g. Git, Docker, Kubernetes" />
                  </div>

                  {/* Career Preferences */}
                  <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-slate-50 pb-1 mt-2">4. Career & Relocation Preferences</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="Preferred Job Role" value={preferredRole} onChange={(e) => setPreferredRole(e.target.value)} placeholder="e.g. Backend SDE" />
                    <Input label="Preferred Location" value={preferredLocation} onChange={(e) => setPreferredLocation(e.target.value)} placeholder="e.g. Bangalore, Remote" />
                    <Input label="Expected CTC" value={expectedSalary} onChange={(e) => setExpectedSalary(e.target.value)} placeholder="e.g. 8-10 LPA" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Willing to Relocate</label>
                      <select 
                        value={willingToRelocate} 
                        onChange={(e) => setWillingToRelocate(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-750 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                    <Input label="Preferred Company Type" value={preferredCompanyType} onChange={(e) => setPreferredCompanyType(e.target.value)} placeholder="e.g. Product Startup, MNC" />
                  </div>

                  {/* Social Profiles */}
                  <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-slate-50 pb-1 mt-2">5. Coding Platform Handles</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Input label="LeetCode Handle" value={leetCode} onChange={(e) => setLeetCode(e.target.value)} placeholder="username" />
                    <Input label="HackerRank Handle" value={hackerRank} onChange={(e) => setHackerRank(e.target.value)} placeholder="username" />
                    <Input label="CodeChef Handle" value={codeChef} onChange={(e) => setCodeChef(e.target.value)} placeholder="username" />
                  </div>

                  {/* Projects Add List */}
                  <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-slate-50 pb-1 mt-2">6. Projects ({projects.length})</h5>
                  <div className="flex flex-col gap-3">
                    {projects.map((p, idx) => (
                      <div key={idx} className="p-3 border border-slate-100 dark:border-white/5 rounded-xl flex items-center justify-between bg-slate-50/50 dark:bg-white/2">
                        <div className="text-xs">
                          <p className="font-bold text-slate-900 dark:text-white">{p.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{p.technologies}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setProjects(projects.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-600 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50/20 dark:bg-white/2 p-3.5 rounded-xl border border-slate-100 dark:border-white/5">
                      <Input label="Project Title" value={newProject.title} onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} />
                      <Input label="Technologies" value={newProject.technologies} onChange={(e) => setNewProject({ ...newProject, technologies: e.target.value })} />
                      <Input label="Github Link" value={newProject.github} onChange={(e) => setNewProject({ ...newProject, github: e.target.value })} />
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (newProject.title) {
                              setProjects([...projects, newProject]);
                              setNewProject({ title: '', description: '', technologies: '', github: '' });
                            }
                          }}
                          className="w-full py-2 bg-slate-100 dark:bg-white/5 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 rounded-xl text-xs font-bold transition-all border border-slate-200/50 dark:border-white/5 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Plus size={13} /> Add Project
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Internships & Experience */}
                  <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-slate-50 pb-1 mt-2">7. Internships & Experience ({experience.length})</h5>
                  <div className="flex flex-col gap-3">
                    {experience.map((e, idx) => (
                      <div key={idx} className="p-3 border border-slate-100 dark:border-white/5 rounded-xl flex items-center justify-between bg-slate-50/50 dark:bg-white/2">
                        <div className="text-xs">
                          <p className="font-bold text-slate-900 dark:text-white">{e.title} - {e.company}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{e.duration}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setExperience(experience.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-600 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50/20 dark:bg-white/2 p-3.5 rounded-xl border border-slate-100 dark:border-white/5">
                      <Input label="Job Title" value={newExp.title} onChange={(e) => setNewExp({ ...newExp, title: e.target.value })} />
                      <Input label="Company" value={newExp.company} onChange={(e) => setNewExp({ ...newExp, company: e.target.value })} />
                      <Input label="Duration / Time" value={newExp.duration} onChange={(e) => setNewExp({ ...newExp, duration: e.target.value })} />
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (newExp.title && newExp.company) {
                              setExperience([...experience, newExp]);
                              setNewExp({ title: '', company: '', description: '', duration: '' });
                            }
                          }}
                          className="w-full py-2 bg-slate-100 dark:bg-white/5 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 rounded-xl text-xs font-bold transition-all border border-slate-200/50 dark:border-white/5 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Plus size={13} /> Add Experience
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Certifications */}
                  <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest border-b border-slate-50 pb-1 mt-2">8. Professional Certifications ({certifications.length})</h5>
                  <div className="flex flex-col gap-3">
                    {certifications.map((c, idx) => (
                      <div key={idx} className="p-3 border border-slate-100 dark:border-white/5 rounded-xl flex items-center justify-between bg-slate-50/50 dark:bg-white/2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{c}</span>
                        <button
                          type="button"
                          onClick={() => setCertifications(certifications.filter((_, i) => i !== idx))}
                          className="text-rose-500 hover:text-rose-600 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-3 bg-slate-50/20 dark:bg-white/2 p-3.5 rounded-xl border border-slate-100 dark:border-white/5">
                      <div className="flex-grow">
                        <Input label="Certification Title / Name" value={newCert} onChange={(e) => setNewCert(e.target.value)} />
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (newCert) {
                              setCertifications([...certifications, newCert]);
                              setNewCert('');
                            }
                          }}
                          className="px-6 py-2 bg-slate-100 dark:bg-white/5 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10 dark:hover:text-emerald-400 rounded-xl text-xs font-bold transition-all border border-slate-200/50 dark:border-white/5 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Plus size={13} /> Add Certificate
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-white/5">
                    <Button type="submit" variant="primary" size="md" className="w-48" disabled={loading}>
                      {loading ? 'Saving...' : 'Save Placement Data'}
                    </Button>
                  </div>
                </form>
              </Card>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProfileDesktop;
