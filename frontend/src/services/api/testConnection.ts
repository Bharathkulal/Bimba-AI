import { apiClient, API_BASE_URL } from '../api';

export const testApiConnection = async () => {
  console.log('Testing Bimba AI API connection...');
  console.log(`Configured Base URL: ${API_BASE_URL}`);

  try {
    const response = await apiClient.get('/health');
    console.log('API Connection: SUCCESS');
    console.log('Response:', response.data);
    return true;
  } catch (error: any) {
    console.error('API Connection: FAILED');
    if (!error.response) {
      console.error('Network Error:', error.message);
    } else {
      console.error(`Backend returned status ${error.response.status}`);
      console.error('Error Data:', error.response.data);
    }
    return false;
  }
};
