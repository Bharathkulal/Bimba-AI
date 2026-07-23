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
  }
};
