/**
 * Section Visibility Hook
 *
 * Controls which drill hole sections are visible to users based on their roles and permissions.
 * Implements role-based access control for section visibility.
 */

import { useUserStore } from "#src/store/user";
import { SectionKey } from "#src/types/drillhole";
import { useMemo } from "react";
import { useDrillHolePermissions } from "./use-drillhole-permissions";

// ============================================================================
// Section Category Definitions
// ============================================================================

/**
 * Sections restricted to logging geologists and elevated roles.
 * Requires canViewRestrictedSections permission.
 */
const RESTRICTED_SECTIONS: SectionKey[] = [
	SectionKey.Sample,
	// Future sections: Photo, SG, Logging, Dispatch
];

/**
 * Sections only accessible to DBAs and elevated roles.
 * Requires canAccessQAQC or canImportAssay permission.
 */
const DBA_ONLY_SECTIONS: SectionKey[] = [
	// Future sections: ImportAssay, QAQC
];

/**
 * Sections only accessible to users with geologist role.
 * Requires 'geologist' role in user's role list.
 */
const GEOLOGIST_ONLY_SECTIONS: SectionKey[] = [
	SectionKey.QuickLog,
];

// ============================================================================
// Section Visibility Hook
// ============================================================================

/**
 * Hook to check if a specific section is visible to the current user.
 *
 * Visibility Rules:
 * - Restricted sections: Require canViewRestrictedSections permission
 * - DBA-only sections: Require canAccessQAQC or canImportAssay permission
 * - Geologist-only sections: Require 'geologist' role
 * - All other sections: Visible to all authenticated users
 *
 * @param sectionKey - The section key to check visibility for
 * @returns true if the section should be visible to the current user
 *
 * @example
 * ```tsx
 * function SectionTab({ sectionKey }: { sectionKey: SectionKey }) {
 *   const isVisible = useSectionVisibility(sectionKey);
 *
 *   if (!isVisible) return null;
 *
 *   return <Tab>{sectionKey}</Tab>;
 * }
 * ```
 */
export function useSectionVisibility(sectionKey: SectionKey): boolean {
	const permissions = useDrillHolePermissions();
	const userRoles = useUserStore(state => state.roles);

	return useMemo(() => {
		// Check restricted sections
		if (RESTRICTED_SECTIONS.includes(sectionKey)) {
			return permissions.canViewRestrictedSections;
		}

		// Check DBA-only sections
		if (DBA_ONLY_SECTIONS.includes(sectionKey)) {
			return permissions.canAccessQAQC || permissions.canImportAssay;
		}

		// Check geologist-only sections
		if (GEOLOGIST_ONLY_SECTIONS.includes(sectionKey)) {
			return userRoles.includes("geologist")
			  || userRoles.includes("loggingGeologist")
			  || userRoles.includes("DBA")
			  || userRoles.includes("Manager")
			  || userRoles.includes("Project Manager")
			  || userRoles.includes("admin");
		}

		// All other sections are visible to everyone
		return true;
	}, [sectionKey, permissions, userRoles]);
}

// ============================================================================
// Visible Sections Hook
// ============================================================================

/**
 * Hook to get array of all sections visible to the current user.
 *
 * Filters all available sections based on user permissions and roles.
 * Result is memoized for performance.
 *
 * @returns Array of SectionKey values that the current user can see
 *
 * @example
 * ```tsx
 * function SectionNavigation() {
 *   const visibleSections = useVisibleSections();
 *
 *   return (
 *     <nav>
 *       {visibleSections.map(sectionKey => (
 *         <SectionTab key={sectionKey} sectionKey={sectionKey} />
 *       ))}
 *     </nav>
 *   );
 * }
 * ```
 */
export function useVisibleSections(): SectionKey[] {
	const permissions = useDrillHolePermissions();
	const userRoles = useUserStore(state => state.roles);

	return useMemo(() => {
		// Get all available section keys
		const allSections = Object.values(SectionKey);

		// Filter sections by visibility
		return allSections.filter((sectionKey) => {
			// Check restricted sections
			if (RESTRICTED_SECTIONS.includes(sectionKey)) {
				return permissions.canViewRestrictedSections;
			}

			// Check DBA-only sections
			if (DBA_ONLY_SECTIONS.includes(sectionKey)) {
				return permissions.canAccessQAQC || permissions.canImportAssay;
			}

			// Check geologist-only sections
			if (GEOLOGIST_ONLY_SECTIONS.includes(sectionKey)) {
				return userRoles.includes("geologist")
				  || userRoles.includes("loggingGeologist")
				  || userRoles.includes("DBA")
				  || userRoles.includes("Manager")
				  || userRoles.includes("Project Manager")
				  || userRoles.includes("admin");
			}

			// All other sections are visible to everyone
			return true;
		});
	}, [permissions, userRoles]);
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a section is restricted (requires special permissions).
 *
 * @param sectionKey - The section key to check
 * @returns true if section is in any restricted category
 */
export function isRestrictedSection(sectionKey: SectionKey): boolean {
	return (
		RESTRICTED_SECTIONS.includes(sectionKey)
		|| DBA_ONLY_SECTIONS.includes(sectionKey)
		|| GEOLOGIST_ONLY_SECTIONS.includes(sectionKey)
	);
}

/**
 * Get the restriction type for a section.
 *
 * @param sectionKey - The section key to check
 * @returns The restriction type or null if not restricted
 */
export function getSectionRestrictionType(
	sectionKey: SectionKey,
): "restricted" | "dba-only" | "geologist-only" | null {
	if (RESTRICTED_SECTIONS.includes(sectionKey)) {
		return "restricted";
	}
	if (DBA_ONLY_SECTIONS.includes(sectionKey)) {
		return "dba-only";
	}
	if (GEOLOGIST_ONLY_SECTIONS.includes(sectionKey)) {
		return "geologist-only";
	}
	return null;
}
