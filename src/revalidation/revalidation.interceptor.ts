import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Locale } from '@prisma/client';
import { Observable, tap } from 'rxjs';
import { REVALIDATE_META, RevalidateMeta } from './revalidate.decorator';
import { RevalidationService } from './revalidation.service';

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * After a successful mutating request on a `@RevalidateContent`-marked
 * controller, fires a front-end revalidation. Fire-and-forget: it never blocks
 * the response and the service swallows transport errors.
 */
@Injectable()
export class RevalidationInterceptor implements NestInterceptor {
    constructor(
        private readonly reflector: Reflector,
        private readonly revalidation: RevalidationService
    ) {}

    intercept(
        context: ExecutionContext,
        next: CallHandler
    ): Observable<unknown> {
        const req = context.switchToHttp().getRequest<{ method?: string }>();
        const method = (req?.method ?? '').toUpperCase();
        if (READ_METHODS.has(method)) return next.handle();

        const meta = this.reflector.getAllAndOverride<RevalidateMeta>(
            REVALIDATE_META,
            [context.getHandler(), context.getClass()]
        );
        if (!meta) return next.handle();

        const entities = Array.isArray(meta.entity)
            ? meta.entity
            : [meta.entity];
        const tags = entities.flatMap(entity => [
            entity,
            ...Object.values(Locale).map(loc => `${entity}:${loc}`),
        ]);
        if (meta.greeting) tags.push('greeting');

        return next
            .handle()
            .pipe(tap({ next: () => void this.revalidation.revalidate(tags) }));
    }
}
