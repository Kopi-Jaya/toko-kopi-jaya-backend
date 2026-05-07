import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

export interface TransformedResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  TransformedResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<TransformedResponse<T>> {
    return next.handle().pipe(
      map((responseData) => {
        if (
          responseData &&
          typeof responseData === 'object' &&
          'data' in responseData &&
          'meta' in responseData
        ) {
          return responseData as unknown as TransformedResponse<T>;
        }

        if (
          responseData &&
          typeof responseData === 'object' &&
          'data' in responseData
        ) {
          return responseData as unknown as TransformedResponse<T>;
        }

        return { data: responseData };
      }),
    );
  }
}
