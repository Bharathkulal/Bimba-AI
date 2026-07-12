import React, { useState, useEffect } from 'react';
import { 
  User, Mail, BookOpen, GraduationCap, Phone, MapPin, 
  Globe, Lock, Camera, Trash2, Award 
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useUserStore } from '../store/userStore';
import { adminService } from '../services/admin';

export const Profile: React.FC = () => {
  const { user, setUser, token } = useUserStore();
  
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

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status indicators
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Sync state with store on load
  useEffect(() => {
    if (user) {
      setName(user.student_name || '');
      setPhone(user.phone || '');
      setGender(user.gender || 'Male');
      setDob(user.dob || '');
      setAddress(user.address || '');
      setBio(user.bio || '');
      setLinkedin(user.linkedin || '');
      setGithub(user.github || '');
      setPortfolio(user.portfolio_website || '');
      setSkills(user.skills || '');
      setLanguages(user.languages || '');
      setObjective(user.career_objective || '');
      setPhoto(user.profile_photo || '');
    }
  }, [user]);

  // Compute profile completion percentage dynamically
  const getCompletionPercentage = () => {
    const fields = [
      name, phone, gender, dob, address, 
      bio, linkedin, github, portfolio, 
      skills, languages, objective, photo
    ];
    const completed = fields.filter(f => f && f.trim() !== '').length;
    return Math.round((completed / fields.length) * 100);
  };

  // Convert uploaded image to base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ text: 'File size must be under 2MB', type: 'error' });
      return;
    }

    // Validate format
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setMessage({ text: 'Supported formats: JPEG, PNG, WEBP', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setPhoto(base64String);
      try {
        await adminService.apiClient.post('/api/auth/profile/upload-photo', { photo: base64String });
        if (user && token) {
          setUser({ ...user, profile_photo: base64String }, token);
        }
        setMessage({ text: 'Profile photo uploaded successfully!', type: 'success' });
      } catch (err) {
        setMessage({ text: 'Failed to upload photo.', type: 'error' });
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete profile picture
  const handleDeletePhoto = async () => {
    try {
      await adminService.apiClient.post('/api/auth/profile/upload-photo', { photo: '' });
      setPhoto('');
      if (user && token) {
        setUser({ ...user, profile_photo: '' }, token);
      }
      setMessage({ text: 'Profile photo removed!', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to remove photo.', type: 'error' });
    }
  };

  // Save profile updates
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      await adminService.apiClient.put('/api/auth/profile/update', {
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
        career_objective: objective
      });

      // Update local storage store
      if (user && token) {
        setUser({
          ...user,
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
          career_objective: objective
        }, token);
      }

      setMessage({ text: 'Profile details saved successfully!', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Failed to update profile details.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Change password handler
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
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || 'Failed to update password.';
      setMessage({ text: errMsg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const completeness = getCompletionPercentage();

  return (
    <div className="flex flex-col gap-8 pb-12">
      <PageHeader
        title="Student Profile"
        description="Manage your identity settings, contact info, photo, and passwords."
      />

      {message && (
        <div className={`p-4.5 rounded-2xl border text-xs font-semibold ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-250 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/50' 
            : 'bg-rose-50 border-rose-250 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/50'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* LEFT COLUMN: AVATAR & COMPLETENESS */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card className="flex flex-col items-center p-8 text-center bg-white border border-slate-200/60 rounded-3xl shadow-sm">
            
            {/* Avatar block */}
            <div className="relative group">
              {photo ? (
                <img 
                  src={photo} 
                  alt="Profile" 
                  className="w-28 h-28 rounded-full object-cover border-2 border-blue-600/20 shadow-md"
                />
              ) : (
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white text-4xl font-extrabold shadow-md">
                  {name.charAt(0).toUpperCase() || 'S'}
                </div>
              )}

              {/* Photo Options Overlay */}
              <div className="absolute inset-0 bg-slate-900/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <label className="cursor-pointer text-white hover:text-blue-200 p-1">
                  <Camera size={18} />
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                </label>
                {photo && (
                  <button onClick={handleDeletePhoto} className="text-white hover:text-red-400 p-1">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>

            <h3 className="text-base font-black text-slate-800 mt-4">{name || 'Enter Full Name'}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{user?.personal_email}</p>

            {/* Profile Completion Meter */}
            <div className="w-full border-t border-slate-100 mt-6 pt-6 flex flex-col gap-2.5">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span>Profile Completion</span>
                <span className="text-blue-600">{completeness}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
          </Card>

          {/* Change Password Card */}
          <Card className="p-6 bg-white border border-slate-200/60 rounded-3xl shadow-sm flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Lock size={16} className="text-blue-600" />
              <h4 className="text-sm font-extrabold text-slate-800">Change Password</h4>
            </div>

            <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
              <Input 
                type="password" 
                label="Current Password" 
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)} 
                required 
              />
              <Input 
                type="password" 
                label="New Password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
              />
              <Input 
                type="password" 
                label="Confirm New Password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
              />
              
              <Button type="submit" variant="outline" size="sm" className="font-bold border-slate-250 hover:bg-slate-50 mt-1" disabled={loading}>
                Update Password
              </Button>
            </form>
          </Card>
        </div>

        {/* RIGHT COLUMN: CORE PROFILE INFO EDIT */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="p-6.5 bg-white border border-slate-200/60 rounded-3xl shadow-sm flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <User size={16} className="text-blue-600" />
              <h4 className="text-sm font-extrabold text-slate-800">Personal & Academic Details</h4>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} required />
                <Input label="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Gender</label>
                  <select 
                    value={gender} 
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full pl-3 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <Input label="Roll Number (Read-only)" value={user?.roll_number || ''} disabled />
                <Input label="Email (Read-only)" value={user?.personal_email || ''} disabled />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Department" value={user?.department || ''} disabled />
                <Input label="Semester" value={user?.semester ? `Semester ${user.semester}` : ''} disabled />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Bio / About Me</label>
                <textarea 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  rows={3} 
                  placeholder="Tell recruiters about yourself..."
                  className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Permanent / Present Address</label>
                <textarea 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  rows={2}
                  className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none"
                />
              </div>

              <div className="border-t border-slate-100 pt-4 mt-2">
                <h5 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Globe size={14} className="text-slate-450" /> Social Links & Websites
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input label="LinkedIn Link" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="linkedin.com/in/username" />
                  <Input label="GitHub Link" value={github} onChange={(e) => setGithub(e.target.value)} placeholder="github.com/username" />
                  <Input label="Portfolio Website" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} placeholder="username.dev" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h5 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Award size={14} className="text-slate-450" /> Skills & Career Objectives
                </h5>
                <div className="flex flex-col gap-4">
                  <Input label="Core Technical Skills (Comma-separated)" value={skills} onChange={(e) => setSkills(e.target.value)} placeholder="React, Python, AWS" />
                  <Input label="Languages Spoken" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="English, Kannada, Hindi" />
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Career Objective</label>
                    <textarea 
                      value={objective} 
                      onChange={(e) => setObjective(e.target.value)} 
                      rows={3} 
                      placeholder="Seeking a challenging position to leverage software development capabilities..."
                      className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" variant="primary" size="lg" className="bg-blue-600 hover:bg-blue-700 text-white font-bold w-44 mt-3" disabled={loading}>
                {loading ? 'Saving...' : 'Save Profile Details'}
              </Button>
            </form>
          </Card>
        </div>

      </div>
    </div>
  );
};
export default Profile;
