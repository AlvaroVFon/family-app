export enum ResponseStatusCode {
  SUCCESS = 200,
  CREATED = 201,
  NO_CONTENT = 204,
}

export enum ResponseMessage {
  SUCCESS = 'Success',
  CREATED = 'Resource created successfully',
  NO_CONTENT = 'No content',
}

export enum ErrorMessage {
  GENERIC_ERROR = 'An unexpected error occurred',
  NOT_FOUND = 'Resource not found',
  VALIDATION_ERROR = 'Validation failed',
  UNAUTHORIZED = 'Unauthorized access',
  FORBIDDEN = 'Forbidden access',
}
