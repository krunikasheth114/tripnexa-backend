export interface ApiSuccessResponse<T> {
  status: 'success';
  statusCode: number;
  data: T;
}

export interface ApiErrorResponse {
  status: 'error';
  statusCode: number;
  data: {
    message: string | string[];
    error?: string;
  };
}
