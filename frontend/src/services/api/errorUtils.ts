import { AxiosError } from 'axios';

export interface ApiError {
  status?: number;
  message: string;
  code?: string;
}

export function normalizeApiError(error: unknown): ApiError {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<any>;
    
    // Check if the backend provided a structured error response
    if (axiosError.response?.data?.error?.message) {
      return {
        status: axiosError.response.status,
        message: axiosError.response.data.error.message,
        code: axiosError.response.data.error.code
      };
    }
    
    // Default error handling based on status codes
    const status = axiosError.response?.status;
    
    if (!status) {
      return { message: "Network error. Please check your internet connection." };
    }
    
    switch (status) {
      case 400:
        return { status, message: "Invalid request. Please check your input and try again." };
      case 401:
        return { status, message: "Your session has expired. Please sign in again." };
      case 403:
        return { status, message: "You do not have permission to access this resource." };
      case 404:
        return { status, message: "The requested resource could not be found." };
      case 422:
        return { status, message: "There was a validation error with your submission." };
      case 429:
        return { status, message: "Too many requests. Please try again later." };
      case 500:
      case 502:
      case 503:
      case 504:
        return { status, message: "We're experiencing technical difficulties. Please try again later." };
      default:
        return { status, message: "An unexpected error occurred. Please try again." };
    }
  }
  
  if (error instanceof Error) {
    return { message: error.message };
  }
  
  return { message: "An unknown error occurred." };
}
