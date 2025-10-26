import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { IExecutionContext } from '../../domain/shared/interfaces/execution-context.interface';

@Injectable({ scope: Scope.REQUEST })
export class ExecutionContextService implements IExecutionContext {
  constructor(@Inject(REQUEST) private readonly request: Request) {}

  getUserId(): string {
    if (!this.request.user) {
      throw new Error('User not authenticated');
    }
    return this.request.user.userId;
  }

  getUser(): { id: string; email: string; role: string } {
    if (!this.request.user) {
      throw new Error('User not authenticated');
    }
    return {
      id: this.request.user.userId,
      email: this.request.user.email,
      role: this.request.user.role,
    };
  }
}
