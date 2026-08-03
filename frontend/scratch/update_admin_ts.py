import re
import os

FILE_PATH = r"frontend/src/services/admin.ts"

with open(FILE_PATH, "r", encoding="utf-8") as f:
    content = f.read()

interfaces = """
export interface StudentStatsData {
  total: number;
  active: number;
  inactive: number;
  with_resume: number;
  without_resume: number;
  logged_in_today: number;
}
"""
# Insert before export interface AdminDashboardData
content = content.replace("export interface AdminDashboardData", interfaces + "\nexport interface AdminDashboardData")

methods = """
  getStudentStats: async (): Promise<StudentStatsData> => {
    const res = await apiClient.get<StudentStatsData>('/api/admin/students/stats');
    return res.data;
  },

  searchStudents: async (query: string): Promise<AdminUserData[]> => {
    const res = await apiClient.get<AdminUserData[]>(`/api/admin/students/search?q=${encodeURIComponent(query)}`);
    return res.data;
  },

  bulkActionStudents: async (rollNumbers: string[], action: string): Promise<void> => {
    await apiClient.post('/api/admin/students/bulk', { roll_numbers: rollNumbers, action });
  },

  importStudents: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/api/admin/students/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
"""

# Insert after toggleStudentStatus
target = """  toggleStudentStatus: async (rollNumber: string): Promise<{ success: boolean; status: string }> => {
    const res = await apiClient.post<{ success: boolean; status: string }>(`/api/admin/students/${rollNumber}/toggle-status`);
    return res.data;
  },"""

content = content.replace(target, target + "\n" + methods)

with open(FILE_PATH, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated admin.ts successfully.")
