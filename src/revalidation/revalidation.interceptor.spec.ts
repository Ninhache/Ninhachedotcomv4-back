import { lastValueFrom, of } from 'rxjs';
import { RevalidationInterceptor } from './revalidation.interceptor';

function ctxWith(method: string) {
    return {
        switchToHttp: () => ({ getRequest: () => ({ method }) }),
        getHandler: () => () => undefined,
        getClass: () => class {},
    } as never;
}

describe('RevalidationInterceptor', () => {
    it('fires entity + per-locale tags after a successful mutation', async () => {
        const revalidation = { revalidate: jest.fn().mockResolvedValue(undefined) };
        const reflector = {
            getAllAndOverride: jest
                .fn()
                .mockReturnValue({ entity: 'projects', greeting: false }),
        };
        const interceptor = new RevalidationInterceptor(
            reflector as never,
            revalidation as never
        );

        await lastValueFrom(
            interceptor.intercept(ctxWith('PATCH'), {
                handle: () => of({ ok: true }),
            } as never)
        );

        expect(revalidation.revalidate).toHaveBeenCalledWith([
            'projects',
            'projects:fr',
            'projects:en',
        ]);
    });

    it('adds the greeting tag when the controller opts in', async () => {
        const revalidation = { revalidate: jest.fn().mockResolvedValue(undefined) };
        const reflector = {
            getAllAndOverride: jest
                .fn()
                .mockReturnValue({ entity: 'profile', greeting: true }),
        };
        const interceptor = new RevalidationInterceptor(
            reflector as never,
            revalidation as never
        );

        await lastValueFrom(
            interceptor.intercept(ctxWith('PATCH'), {
                handle: () => of({}),
            } as never)
        );

        expect(revalidation.revalidate).toHaveBeenCalledWith([
            'profile',
            'profile:fr',
            'profile:en',
            'greeting',
        ]);
    });

    it('does NOT revalidate on a GET (read)', async () => {
        const revalidation = { revalidate: jest.fn() };
        const reflector = {
            getAllAndOverride: jest
                .fn()
                .mockReturnValue({ entity: 'projects', greeting: false }),
        };
        const interceptor = new RevalidationInterceptor(
            reflector as never,
            revalidation as never
        );

        await lastValueFrom(
            interceptor.intercept(ctxWith('GET'), {
                handle: () => of([]),
            } as never)
        );

        expect(revalidation.revalidate).not.toHaveBeenCalled();
    });
});
