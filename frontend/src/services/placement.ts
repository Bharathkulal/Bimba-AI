import { apiClient } from './api';

export interface PlacementDashboardData {
  totalStudents: number;
  activeDrives: number;
  applicationsInProgress: number;
  offersMade: number;
  totalApplications: number;
  branchBreakdown: Record<string, { placed: number; total: number }>;
  recentActivities: Array<{ id: string; type: string; title: string; time: string }>;
}

export interface PlacementStudent {
  _id?: string;
  id: number;
  roll_number: string;
  student_name?: string;
  full_name?: string;
  email: string;
  phone?: string;
  department: string;
  semester: number;
  status: string;
  cgpa: number;
  eligibility_status: string;
  placement_status: string;
}

export interface PlacementCompany {
  _id?: string;
  id: number;
  name: string;
  industry: string;
  location: string;
  website: string;
  description: string;
  status: string;
}

export interface PlacementDrive {
  _id?: string;
  id: number;
  company_id: number;
  company_name: string;
  title: string;
  job_role: string;
  salary_package: string;
  eligibility_criteria: string;
  min_cgpa: number;
  branches_eligible: string[];
  drive_date: string;
  status: string;
}

export interface VerificationResume {
  id: number | string;
  name: string;
  student_roll: string;
  student_name: string;
  ats_score: number;
  verification_status: string;
  feedback: string;
  last_edited: string;
}

export interface PlacementApplication {
  _id: string;
  id?: string;
  student_roll: string;
  student_name: string;
  company_name: string;
  drive_title: string;
  applied_at: string;
  status: string;
}

export interface PlacementAnnouncement {
  _id?: string;
  id: number;
  title: string;
  content: string;
  pinned: boolean;
  target_audience: string;
  created_at: string;
}

export interface PlacementReportSummary {
  total_students: number;
  placed_students: number;
  unplaced_students: number;
  placement_percentage: number;
  total_companies: number;
  total_drives: number;
}

export interface PlacementReportDetails {
  roll_number: string;
  name: string;
  department: string;
  cgpa: number;
  eligibility: string;
  status: string;
}

export interface PlacementReportData {
  summary: PlacementReportSummary;
  details: PlacementReportDetails[];
}

export const placementService = {
  getDashboard: async (): Promise<PlacementDashboardData> => {
    const res = await apiClient.get<PlacementDashboardData>('/api/placement/dashboard');
    return res.data;
  },

  getStudents: async (filters?: { department?: string; eligibility_status?: string; placement_status?: string }): Promise<PlacementStudent[]> => {
    const res = await apiClient.get<PlacementStudent[]>('/api/placement/students', { params: filters });
    return res.data;
  },

  updateStudent: async (rollNumber: string, payload: Partial<PlacementStudent>): Promise<void> => {
    await apiClient.put(`/api/placement/students/${rollNumber}`, payload);
  },

  getCompanies: async (): Promise<PlacementCompany[]> => {
    const res = await apiClient.get<PlacementCompany[]>('/api/placement/companies');
    return res.data;
  },

  createCompany: async (payload: Omit<PlacementCompany, 'id'>): Promise<void> => {
    await apiClient.post('/api/placement/companies', payload);
  },

  updateCompany: async (id: number, payload: Partial<PlacementCompany>): Promise<void> => {
    await apiClient.put(`/api/placement/companies/${id}`, payload);
  },

  deleteCompany: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/placement/companies/${id}`);
  },

  getDrives: async (): Promise<PlacementDrive[]> => {
    const res = await apiClient.get<PlacementDrive[]>('/api/placement/drives');
    return res.data;
  },

  createDrive: async (payload: Omit<PlacementDrive, 'id'>): Promise<void> => {
    await apiClient.post('/api/placement/drives', payload);
  },

  updateDrive: async (id: number, payload: Partial<PlacementDrive>): Promise<void> => {
    await apiClient.put(`/api/placement/drives/${id}`, payload);
  },

  deleteDrive: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/placement/drives/${id}`);
  },

  getResumes: async (): Promise<VerificationResume[]> => {
    const res = await apiClient.get<VerificationResume[]>('/api/placement/resumes/verify');
    return res.data;
  },

  verifyResume: async (id: number | string, status: string, feedback: string): Promise<void> => {
    await apiClient.post(`/api/placement/resumes/verify/${id}`, { status, feedback });
  },

  getApplications: async (): Promise<PlacementApplication[]> => {
    const res = await apiClient.get<PlacementApplication[]>('/api/placement/applications');
    return res.data;
  },

  updateApplicationStatus: async (id: string, status: string): Promise<void> => {
    await apiClient.put(`/api/placement/applications/${id}`, { status });
  },

  getAnnouncements: async (): Promise<PlacementAnnouncement[]> => {
    const res = await apiClient.get<PlacementAnnouncement[]>('/api/placement/announcements');
    return res.data;
  },

  createAnnouncement: async (payload: { title: string; content: string; target_audience: string }): Promise<void> => {
    await apiClient.post('/api/placement/announcements', payload);
  },

  getReports: async (): Promise<PlacementReportData> => {
    const res = await apiClient.get<PlacementReportData>('/api/placement/reports');
    return res.data;
  },

  getAiDashboardSummary: async (): Promise<{ summary: string }> => {
    const res = await apiClient.get<{ summary: string }>('/api/placement/ai/dashboard-summary');
    return res.data;
  },

  getAiResumeReview: async (resumeId: number | string): Promise<{ review: string }> => {
    const res = await apiClient.get<{ review: string }>(`/api/placement/ai/resume-review/${resumeId}`);
    return res.data;
  },

  getAiRankCandidates: async (driveId: number): Promise<Array<{ roll_number: string; name: string; cgpa: number; score: number; reason: string }>> => {
    const res = await apiClient.get<Array<{ roll_number: string; name: string; cgpa: number; score: number; reason: string }>>(`/api/placement/ai/rank-candidates/${driveId}`);
    return res.data;
  }
};
