import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class AtGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Extract request properly for both HTTP and GraphQL
    const request = this.getRequest(context);
    const token = this.extractTokenFromHeader(request);

    // CASE 1: Public route
    if (isPublic) {
      // If token exists → validate it (optional auth for REST)
      if (token) {
        return super.canActivate(context) as boolean;
      }
      // No token → allow access (perfect for GraphQL public resolvers)
      return true;
    }

    // CASE 2: Protected route → always require valid token
    const result = await super.canActivate(context);
    if (!result) {
      throw new UnauthorizedException();
    }
    return true;
  }

  // Unified way to get request (works for both HTTP & GraphQL)
  getRequest(context: ExecutionContext): any {
    if (context.getType() === 'http') {
      return context.switchToHttp().getRequest();
    }

    const gqlCtx = GqlExecutionContext.create(context);
    const ctx = gqlCtx.getContext();
    // Apollo Server attaches req to context.req
    return ctx.req || ctx.request;
  }

  // Extract token from Authorization header
  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request?.headers?.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
