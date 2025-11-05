export enum ResponseCode {
  SUCCESS = 200,
  BUSINESS_ERROR = 0,
  ERROR = 500,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  BAD_REQUEST = 400,
}
export interface Response<T> {
  data: T;
  code: ResponseCode;
  message: string;
}
export class ApiResponse<T> {
  constructor(
    public readonly data: T,
    public readonly code: ResponseCode,
    public readonly message: string,
  ) {
    this.code = code;
    this.message = message;
    this.data = data;
  }
  static success<T>(data: T, message: string = 'success'): ApiResponse<T> {
    return new ApiResponse(data, 200, message);
  }
  static custom<T>(
    data: T,
    code: ResponseCode,
    message: string,
  ): ApiResponse<T> {
    return new ApiResponse(data, code, message);
  }
  static error<T>(
    data: T,
    code: ResponseCode = ResponseCode.BUSINESS_ERROR,
    message: string = 'error',
  ): ApiResponse<T> {
    return new ApiResponse(data, code, message);
  }
  static paginated<T>(
    data: T,
    page: number,
    pageSize: number,
    total: number,
  ): ApiResponse<{ list: T; page: number; pageSize: number; total: number }> {
    return new ApiResponse(
      {
        list: data,
        page,
        pageSize,
        total,
      },
      200,
      'success',
    );
  }
}
