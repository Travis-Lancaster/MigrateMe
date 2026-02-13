/**
 * useLocalStorage Hook
 *
 * Manages state that persists in localStorage with automatic serialization
 *
 * @example
 * ```typescript
 * const [preferences, setPreferences] = useLocalStorage('user-preferences', {
 *   theme: 'light',
 *   pageSize: 20
 * });
 *
 * // Update preferences (auto-saved to localStorage)
 * setPreferences({ ...preferences, theme: 'dark' });
 * ```
 */

import { useCallback, useEffect, useState } from "react";

export interface UseLocalStorageOptions {
	serializer?: (value: any) => string
	deserializer?: (value: string) => any
	syncAcrossTabs?: boolean
}

export function useLocalStorage<T>(
	key: string,
	initialValue: T,
	options: UseLocalStorageOptions = {},
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
	const {
		serializer = JSON.stringify,
		deserializer = JSON.parse,
		syncAcrossTabs = true,
	} = options;

	// Get initial value from localStorage or use provided initial value
	const [storedValue, setStoredValue] = useState<T>(() => {
		try {
			const item = window.localStorage.getItem(key);

			if (item) {
				console.log("[FLOW:local-storage] [STATE] Loaded from localStorage", {
					key,
					hasValue: true,
				});
				return deserializer(item);
			}

			console.log("[FLOW:local-storage] [STATE] Using initial value", {
				key,
				hasValue: false,
			});
			return initialValue;
		}
		catch (error) {
			console.error("[FLOW:local-storage] [ERROR] Failed to load from localStorage", {
				key,
				error,
			});
			return initialValue;
		}
	});

	// Save to localStorage whenever value changes
	const setValue = useCallback(
		(value: T | ((prev: T) => T)) => {
			try {
				// Allow value to be a function for functional updates
				const valueToStore = typeof value === "function" ? (value as (prev: T) => T)(storedValue) : value;

				console.log("[FLOW:local-storage] [ACTION] Saving to localStorage", {
					key,
					valueType: typeof valueToStore,
				});

				setStoredValue(valueToStore);
				window.localStorage.setItem(key, serializer(valueToStore));
			}
			catch (error) {
				console.error("[FLOW:local-storage] [ERROR] Failed to save to localStorage", {
					key,
					error,
				});
			}
		},
		[key, serializer, storedValue],
	);

	// Remove from localStorage
	const removeValue = useCallback(() => {
		try {
			console.log("[FLOW:local-storage] [ACTION] Removing from localStorage", { key });
			window.localStorage.removeItem(key);
			setStoredValue(initialValue);
		}
		catch (error) {
			console.error("[FLOW:local-storage] [ERROR] Failed to remove from localStorage", {
				key,
				error,
			});
		}
	}, [key, initialValue]);

	// Sync across tabs
	useEffect(() => {
		if (!syncAcrossTabs)
			return;

		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === key && e.newValue !== null) {
				try {
					console.log("[FLOW:local-storage] [STATE] Syncing from other tab", { key });
					setStoredValue(deserializer(e.newValue));
				}
				catch (error) {
					console.error("[FLOW:local-storage] [ERROR] Failed to sync from other tab", {
						key,
						error,
					});
				}
			}
			else if (e.key === key && e.newValue === null) {
				// Value was removed in another tab
				console.log("[FLOW:local-storage] [STATE] Value removed in other tab", { key });
				setStoredValue(initialValue);
			}
		};

		window.addEventListener("storage", handleStorageChange);

		return () => {
			window.removeEventListener("storage", handleStorageChange);
		};
	}, [key, initialValue, deserializer, syncAcrossTabs]);

	return [storedValue, setValue, removeValue];
}

/**
 * useSessionStorage Hook
 *
 * Same as useLocalStorage but uses sessionStorage (cleared when tab closes)
 *
 * @example
 * ```typescript
 * const [tempData, setTempData] = useSessionStorage('temp-data', null);
 * ```
 */

export function useSessionStorage<T>(
	key: string,
	initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
	const [storedValue, setStoredValue] = useState<T>(() => {
		try {
			const item = window.sessionStorage.getItem(key);
			return item ? JSON.parse(item) : initialValue;
		}
		catch (error) {
			console.error("[FLOW:session-storage] [ERROR] Failed to load", { key, error });
			return initialValue;
		}
	});

	const setValue = useCallback(
		(value: T | ((prev: T) => T)) => {
			try {
				const valueToStore = typeof value === "function" ? (value as (prev: T) => T)(storedValue) : value;
				setStoredValue(valueToStore);
				window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
			}
			catch (error) {
				console.error("[FLOW:session-storage] [ERROR] Failed to save", { key, error });
			}
		},
		[key, storedValue],
	);

	const removeValue = useCallback(() => {
		try {
			window.sessionStorage.removeItem(key);
			setStoredValue(initialValue);
		}
		catch (error) {
			console.error("[FLOW:session-storage] [ERROR] Failed to remove", { key, error });
		}
	}, [key, initialValue]);

	return [storedValue, setValue, removeValue];
}
