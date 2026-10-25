import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';

describe('HttpExceptionFilter (i18n)', () => {
  let filter: HttpExceptionFilter;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
  });

  it('should localize error message to pt-BR when header requests pt-BR', () => {
    const statusFn = jest.fn().mockReturnThis();
    const jsonFn = jest.fn();

    const mockResponse = {
      status: statusFn,
      json: jsonFn,
    };

    const mockRequest = {
      method: 'POST',
      url: '/api/v1/expenses',
      headers: {
        'accept-language': 'pt-BR',
      },
    };

    const host = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;

    const exception = new HttpException(
      {
        code: 'EXP001',
        message: 'English default description required',
      },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host);

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        statusCode: 400,
        code: 'EXP001',
        message: 'Por favor, preencha todos os campos obrigatórios: descrição, valor, data e método de pagamento.',
      }),
    );
  });

  it('should localize error message to en-US when header requests en-US', () => {
    const statusFn = jest.fn().mockReturnThis();
    const jsonFn = jest.fn();

    const mockResponse = {
      status: statusFn,
      json: jsonFn,
    };

    const mockRequest = {
      method: 'POST',
      url: '/api/v1/expenses',
      headers: {
        'accept-language': 'en-US,en;q=0.9',
      },
    };

    const host = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;

    const exception = new HttpException(
      {
        code: 'EXP001',
        message: 'English default',
      },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host);

    expect(statusFn).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(jsonFn).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        statusCode: 400,
        code: 'EXP001',
        message: 'Please fill in all mandatory fields: description, amount, date, and payment method.',
      }),
    );
  });
});
