import 'reflect-metadata';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../auth/entities/user.entity';

function createContext(role?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () =>
        role ? { user: { sub: 1, email: 'a@b.c', role } } : {},
    }),
    getHandler: () => function handler() {},
    getClass: () => class Controller {},
  } as unknown as ExecutionContext;
}

function createGuard(required: UserRole[] | undefined): RolesGuard {
  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue(required),
  } as unknown as Reflector;
  return new RolesGuard(reflector);
}

describe('RolesGuard', () => {
  it('@Roles 메타데이터가 없으면 통과시킨다', () => {
    expect(createGuard(undefined).canActivate(createContext('worker'))).toBe(
      true,
    );
  });

  it('요구 역할과 일치하면 통과시킨다 (customer 의 의뢰 등록)', () => {
    const guard = createGuard([UserRole.CUSTOMER]);
    expect(guard.canActivate(createContext('customer'))).toBe(true);
  });

  it('요구 역할과 다르면 403 을 던진다 (worker 의 의뢰 등록)', () => {
    const guard = createGuard([UserRole.CUSTOMER]);
    expect(() => guard.canActivate(createContext('worker'))).toThrow(
      ForbiddenException,
    );
  });

  it('견적 제출은 worker 만 허용한다', () => {
    const guard = createGuard([UserRole.WORKER]);
    expect(guard.canActivate(createContext('worker'))).toBe(true);
    expect(() => guard.canActivate(createContext('customer'))).toThrow(
      ForbiddenException,
    );
  });

  it('요청에 user 가 없으면 403 을 던진다', () => {
    const guard = createGuard([UserRole.CUSTOMER]);
    expect(() => guard.canActivate(createContext())).toThrow(
      ForbiddenException,
    );
  });
});
