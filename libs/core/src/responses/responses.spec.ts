import {
  successResponse,
  paginatedResponse,
  ResponseMessage,
  ResponseStatusCode,
} from './index';

describe('Response Helpers', () => {
  describe('successResponse', () => {
    it('should create success response with default values', () => {
      const data = { id: 1, name: 'Test' };
      const response = successResponse(data);

      expect(response.data).toEqual(data);
      expect(response.message).toBe(ResponseMessage.SUCCESS);
      expect(response.statusCode).toBe(ResponseStatusCode.SUCCESS);
      expect(response.statusCode).toBe(200);
      expect(response.error).toBeNull();
    });

    it('should create success response with custom message and status', () => {
      const data = { id: 1 };
      const response = successResponse(
        data,
        ResponseMessage.CREATED,
        ResponseStatusCode.CREATED,
      );

      expect(response.data).toEqual(data);
      expect(response.message).toBe(ResponseMessage.CREATED);
      expect(response.statusCode).toBe(201);
      expect(response.error).toBeNull();
    });

    it('should handle array data', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const response = successResponse(data);

      expect(response.data).toEqual(data);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should handle null data', () => {
      const response = successResponse(null);

      expect(response.data).toBeNull();
      expect(response.error).toBeNull();
    });
  });

  describe('paginatedResponse', () => {
    it('should create paginated response with all fields', () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const response = paginatedResponse(data, 30, 1, 10);

      expect(response.data).toEqual(data);
      expect(response.totalCount).toBe(30);
      expect(response.totalPages).toBe(3);
      expect(response.currentPage).toBe(1);
      expect(response.pageSize).toBe(10);
      expect(response.message).toBe(ResponseMessage.SUCCESS);
      expect(response.statusCode).toBe(200);
      expect(response.error).toBeNull();
    });

    it('should calculate totalPages correctly', () => {
      const data = [{ id: 1 }];

      // 25 items, 10 per page = 3 pages
      const response1 = paginatedResponse(data, 25, 1, 10);
      expect(response1.totalPages).toBe(3);

      // 30 items, 10 per page = 3 pages
      const response2 = paginatedResponse(data, 30, 1, 10);
      expect(response2.totalPages).toBe(3);

      // 31 items, 10 per page = 4 pages
      const response3 = paginatedResponse(data, 31, 1, 10);
      expect(response3.totalPages).toBe(4);
    });

    it('should handle empty results', () => {
      const response = paginatedResponse([], 0, 1, 10);

      expect(response.data).toEqual([]);
      expect(response.totalCount).toBe(0);
      expect(response.totalPages).toBe(0);
    });

    it('should accept custom message and status', () => {
      const data = [{ id: 1 }];
      const response = paginatedResponse(
        data,
        10,
        1,
        10,
        ResponseMessage.SUCCESS,
        ResponseStatusCode.SUCCESS,
      );

      expect(response.message).toBe(ResponseMessage.SUCCESS);
      expect(response.statusCode).toBe(200);
    });
  });
});
