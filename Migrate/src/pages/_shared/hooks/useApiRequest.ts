/**
 * Shared API Request Hook
 *
 * Generic hook for making API requests with error handling, timeout, and retry
 */

import { useCallback, useEffect, useState } from "react";

export interface UseApiRequestOptions<T> {
	onSuccess?: (data: T) => void
	onError?: (error: Error) => void
	timeout?: number
	retryAttempts?: number
	retryDelay?: number
}

export interface UseApiRequestResult<T> {
	data: T | null
	loading: boolean
	error: string | null
	execute: (...args: any[]) => Promise<T | null>
	reset: () => void
}

/**
 * Generic hook for API requests with built-in error handling and timeout
 */
export function useApiRequest<T = any>(
	requestFn: (...args: any[]) => Promise<T>,
	options: UseApiRequestOptions<T> = {},
): UseApiRequestResult<T> {
	const {
		onSuccess,
		onError,
		timeout = 30000, // 30 second default
		retryAttempts = 0,
		retryDelay = 1000,
	} = options;

	const [data, setData] = useState<T | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

	const executeWithRetry = useCallback(
		async (args: any[], attempt: number = 0): Promise<T | null> => {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeout);

			try {
				// Pass abort signal to request function if it supports it
				const result = await requestFn(...args, { signal: controller.signal });
				clearTimeout(timeoutId);

				setData(result);
				setError(null);
				onSuccess?.(result);

				return result;
			}
			catch (err: any) {
				clearTimeout(timeoutId);

				// Check if we should retry
				if (attempt < retryAttempts && err.name !== "AbortError") {
					console.log(`[useApiRequest] Retry attempt ${attempt + 1}/${retryAttempts}`);
					await sleep(retryDelay);
					return executeWithRetry(args, attempt + 1);
				}

				const errorMessage = err.name === "AbortError"
					? "Request timed out"
					: err.message || "An error occurred";

				setError(errorMessage);
				setData(null);

				const errorObj = err instanceof Error ? err : new Error(errorMessage);
				onError?.(errorObj);

				throw errorObj;
			}
		},
		[requestFn, timeout, retryAttempts, retryDelay, onSuccess, onError],
	);

	const execute = useCallback(
		async (...args: any[]): Promise<T | null> => {
			try {
				setLoading(true);
				setError(null);
				return await executeWithRetry(args);
			}
			catch (error) {
				return null;
			}
			finally {
				setLoading(false);
			}
		},
		[executeWithRetry],
	);

	const reset = useCallback(() => {
		setData(null);
		setError(null);
		setLoading(false);
	}, []);

	return {
		data,
		loading,
		error,
		execute,
		reset,
	};
}

/**
 * Hook specifically for fetching lists with pagination
 */
export interface UseFetchListOptions<T> extends UseApiRequestOptions<T[]> {
	immediate?: boolean
	initialPage?: number
	initialTake?: number
}

export function useFetchList<T = any>(
	fetchFn: (page: number, take: number, filters?: any) => Promise<T[]>,
	options: UseFetchListOptions<T> = {},
) {
	const {
		immediate = false,
		initialPage = 1,
		initialTake = 20,
		...apiOptions
	} = options;

	const [page, setPage] = useState(initialPage);
	const [take, setTake] = useState(initialTake);
	const [filters, setFilters] = useState<any>(null);

	const { data, loading, error, execute, reset } = useApiRequest<T[]>(
		fetchFn,
		apiOptions,
	);

	const fetchList = useCallback(
		(newPage?: number, newTake?: number, newFilters?: any) => {
			const p = newPage ?? page;
			const t = newTake ?? take;
			const f = newFilters ?? filters;

			setPage(p);
			setTake(t);
			setFilters(f);

			return execute(p, t, f);
		},
		[page, take, filters, execute],
	);

	// Auto-fetch on mount if immediate is true
	useEffect(() => {
		if (immediate) {
			fetchList();
		}
	}, []); // Only run on mount

	return {
		data: data || [],
		loading,
		error,
		page,
		take,
		filters,
		fetchList,
		setPage,
		setTake,
		setFilters,
		reset,
	};
}
