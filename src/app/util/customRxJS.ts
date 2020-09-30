import { defer, OperatorFunction } from 'rxjs';
import { startWith } from 'rxjs/operators';

export function startWithDefer<T, R>(fn: () => R): OperatorFunction<T, T | R> {
	return input$ => defer(() => input$.pipe(startWith(fn())));
}