import { apiClient } from './api';

export interface JobListItem {
  id: string;
  title: string;
  company: string;
  location: string;
  logo?: string;
  salary?: string;
  employment_type?: string;
  remote?: boolean;
  posted_date?: string;
  ai_match_score?: number;
  skills_matched?: string[];
  skills_missing?: string[];
  apply_url?: string;
}

export interface JobSearchResponse {
  jobs: JobListItem[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface JobDetailResponse extends JobListItem {
  banner?: string;
  description: string;
  requirements?: string[];
  responsibilities?: string[];
  benefits?: string[];
  experience?: string;
  company_info?: {
    industry?: string;
    size?: string;
    website?: string;
  };
}

export interface SavedJob {
  id: number;
  job_id: string;
  company: string;
  title: string;
  location: string;
  logo?: string;
  source?: string;
  application_url?: string;
  saved_at: string;
}

export interface JobApplication {
  id: number;
  job_id: string;
  company: string;
  title: string;
  logo?: string;
  location?: string;
  status: string; // Applied, Interview, Rejected, Offer, Accepted
  application_date: string;
  notes?: string;
  job_url?: string;
  application_method?: string;
  application_source?: string;
  salary_offered?: string;
  recruiter_name?: string;
  recruiter_email?: string;
  timeline?: Array<{
    date: string;
    time: string;
    status: string;
    notes: string;
    source: string;
  }>;
}

export const jobsService = {
  async searchJobs(params: {
    keyword?: string;
    location?: string;
    page?: number;
    experience?: string;
    remote?: boolean;
    employment_type?: string;
    salary?: string;
    limit?: number;
  }): Promise<JobSearchResponse> {
    const response = await apiClient.get('/api/jobs', { params });
    return response.data;
  },

  async getJobDetails(id: string): Promise<JobDetailResponse> {
    const response = await apiClient.get(`/api/jobs/${id}`);
    return response.data;
  },

  async saveJob(job: {
    job_id: string;
    company: string;
    title: string;
    location: string;
    logo?: string;
    source?: string;
    application_url?: string;
  }): Promise<SavedJob> {
    const response = await apiClient.post('/api/jobs/save', job);
    return response.data;
  },

  async unsaveJob(id: string): Promise<{ message: string }> {
    const response = await apiClient.delete(`/api/jobs/save/${id}`);
    return response.data;
  },

  async getSavedJobs(): Promise<SavedJob[]> {
    const response = await apiClient.get('/api/jobs/saved');
    return response.data;
  },

  async applyJob(application: {
    job_id: string;
    company: string;
    title: string;
    logo?: string;
    location?: string;
    status?: string;
    notes?: string;
  }): Promise<JobApplication> {
    const response = await apiClient.post('/api/jobs/apply', application);
    return response.data;
  },

  async getApplications(): Promise<JobApplication[]> {
    const response = await apiClient.get('/api/jobs/applications');
    return response.data;
  },

  async updateApplication(id: number, status: string, notes?: string): Promise<JobApplication> {
    const response = await apiClient.patch(`/api/jobs/applications/${id}`, { status, notes });
    return response.data;
  },

  async getRecommendations(resumeId: number): Promise<any> {
    const response = await apiClient.get('/api/jobs/recommendations', { params: { resume_id: resumeId } });
    return response.data;
  },

  async getAnalytics(): Promise<any> {
    const response = await apiClient.get('/api/jobs/applications/analytics');
    return response.data;
  },

  async createApplication(app: {
    company: string;
    title: string;
    job_url?: string;
    location?: string;
    salary_offered?: string;
    application_method?: string;
    application_source?: string;
    status?: string;
    notes?: string;
    recruiter_name?: string;
    recruiter_email?: string;
  }): Promise<any> {
    const response = await apiClient.post('/api/jobs/applications', app);
    return response.data;
  },

  async updateStatus(id: number, status: string, notes?: string, reason?: string): Promise<any> {
    const response = await apiClient.patch(`/api/jobs/applications/${id}/status`, { status, notes, reason });
    return response.data;
  },

  async suggestStatus(id: number, text: string): Promise<any> {
    const response = await apiClient.post(`/api/jobs/applications/${id}/status-suggest`, { text });
    return response.data;
  },

  async getGuidance(id: number): Promise<any> {
    const response = await apiClient.get(`/api/jobs/applications/${id}/guidance`);
    return response.data;
  },

  async recordFollowUp(id: number, method: string, notes?: string): Promise<any> {
    const response = await apiClient.post(`/api/jobs/applications/${id}/follow-up`, { method, notes });
    return response.data;
  }
};
