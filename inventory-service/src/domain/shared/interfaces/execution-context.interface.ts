export interface IExecutionContext {
  getUserId(): string;
  getUser(): { id: string; email: string; role: string };
}

export const EXECUTION_CONTEXT: symbol = Symbol('EXECUTION_CONTEXT');
