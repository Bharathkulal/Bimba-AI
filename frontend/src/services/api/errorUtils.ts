import { AxiosError } from 'axios';

export interface ApiError {
  status?: number;
  message: string;
  code?: string;
  data?: any;
}

export function normalizeApiError(error: unknown): ApiError {
  if (error && typeof error === 'object' && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<any>;
    const status = axiosError.response?.status;
    const responseData = axiosError.response?.data;
    
    // Handle request cancellation
    if (axiosError.name === 'CanceledError' || axiosError.code === 'ERR_CANCELED') {
      return {
        status: 499, // Client Closed Request
        message: 'Request was cancelled.',
        code: 'CANCELED',
        data: null
      };
    }
    
    let message = axiosError.message;
    
    // Handle FastAPI detail formats
    if (responseData && responseData.detail) {
      if (typeof responseData.detail === 'string') {
        message = responseData.detail;
      } else if (Array.isArray(responseData.detail) && responseData.detail.length > 0) {
        // FastAPI Validation Error (422)
        message = responseData.detail.map((err: any) => {
          const loc = err.loc ? err.loc[err.loc.length - 1] : 'field';
          return `${loc}: ${err.msg}`;
        }).join(', ');
      }
    } else if (responseData?.error?.message) {
      // Handle alternative structured error format
      message = responseData.error.message;
    } else if (!status) {
      if (axiosError.code === 'ECONNABORTED' || axiosError.message.toLowerCase().includes('timeout')) {
        message = "The request took too long. Please try again.";
      } else {
        message = "Unable to connect to the server. Please try again.";
      }
    } else {
      // Default fallback based on status code
      switch (status) {
        case 400:
          message = "Invalid request. Please check your input and try again.";
          break;
        case 401:
          message = "Your session has expired. Please sign in again.";
          break;
        case 403:
          message = "You do not have permission to access this resource.";
          break;
        case 404:
          message = "The requested resource could not be found.";
          break;
        case 422:
          message = "There was a validation error with your submission.";
          break;
        case 429:
          message = "Too many requests. Please try again later.";
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          message = "We're experiencing technical difficulties. Please try again later.";
          break;
        default:
          message = "An unexpected error occurred. Please try again.";
          break;
      }
    }
    
    return {
      status,
      message,
      code: responseData?.error?.code || responseData?.code,
      data: responseData
    };
  }
  
  if (error instanceof Error) {
    return { message: error.message };
  }
  
  return { message: "An unknown error occurred." };
}
