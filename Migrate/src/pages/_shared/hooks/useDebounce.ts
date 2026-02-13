/**
 * useDebounce Hook
 *
 * Debounces a value to avoid excessive re-renders or API calls
 *
 * @example
 * ```typescript
 * const [searchQuery, setSearchQuery] = useState('');
 * const debouncedQuery = useDebounce(searchQuery, 500);
 *
 * useEffect(() => {
 *   if (debouncedQuery) {
 *     performSearch(debouncedQuery);
 *   }
 * }, [debouncedQuery]);
 * ```
 */

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useDebouncedCallback Hook
 *
 * Returns a debounced version of a callback function
 *
 * @example
 * ```typescript
 * const debouncedSearch = useDebouncedCallback(
 *   (query: string) => performSearch(query),
 *   500
 * );
 *
 * <Input onChange={(e) => debouncedSearch(e.target.value)} />
 * ```
 */

export function useDebounce<T>(value: T, delay: number = 500): T {
	const [debouncedValue, setDebouncedValue] = useState<T>(value);

	useEffect(() => {
		// Set up the timeout
		const handler = setTimeout(() => {
			console.log("[FLOW:debounce] [STATE] Debounced value updated", {
				value: typeof value === "string" ? value.substring(0, 50) : value,
			});
			setDebouncedValue(value);
		}, delay);

		// Clean up the timeout if value changes before delay
		return () => {
			clearTimeout(handler);
		};
	}, [value, delay]);

	return debouncedValue;
}

export function useDebouncedCallback<T extends (...args: any[]) => any>(
	callback: T,
	delay: number = 500,
): (...args: Parameters<T>) => void {
	const timeoutRef = useRef<NodeJS.Timeout>();

	const debouncedCallback = useCallback(
		(...args: Parameters<T>) => {
			// Clear existing timeout
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			// Set new timeout
			timeoutRef.current = setTimeout(() => {
				console.log("[FLOW:debounce] [ACTION] Executing debounced callback");
				callback(...args);
			}, delay);
		},
		[callback, delay],
	);

	// Clean up on unmount
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	return debouncedCallback;
}
