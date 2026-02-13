/**
 * Horizontal Tabs Navigation
 *
 * Mobile/tablet-optimized horizontal tab navigation for create drill hole workflow.
 * Shows 7 main categories with completion indicators.
 *
 * Based on: public/create-drill-hole.html mockup
 * Pattern adapted from: src/pages/drill-hole/components/VerticalTabs.tsx
 */

import { CheckCircleOutlined } from "@ant-design/icons";
import { Badge, Tabs } from "antd";
import type { SectionStore } from "../store/section-factory";
import { getSectionStoresByCategory } from "../store/section-config";

export interface HorizontalTabsProps {
	activeSection: string
	sections: Record<string, SectionStore<any>>
	onTabChange: (sectionKey: string) => void
}

/**
 * Main category tabs
 */
const MAIN_CATEGORIES = [
	{ key: "setup", label: "Setup", icon: "🔧" },
	{ key: "drilling", label: "Drilling", icon: "⚒️" },
	{ key: "survey", label: "Survey", icon: "📐" },
	{ key: "geology", label: "Geology", icon: "🪨" },
	{ key: "geotech", label: "Geotech", icon: "🏗️" },
	{ key: "sampling", label: "Sampling", icon: "🧪" },
	{ key: "summary", label: "Summary", icon: "📊" },
];

/**
 * Horizontal tabs navigation component
 */
export function HorizontalTabs({
	activeSection,
	sections,
	onTabChange,
}: HorizontalTabsProps): JSX.Element {
	console.log("🎨 [TABS] Rendering HorizontalTabs", { activeSection });

	// Determine active category from active section
	const getActiveCategoryKey = (): string => {
		// Map section keys to categories
		const categoryMap: Record<string, string> = {
			rigsheet: "setup",
			collarcoordinates: "setup",
			drillmethod: "drilling",
			dhsurvey: "survey",
			surveylog: "survey",
			geologylog: "geology",
			shearlog: "geology",
			structurelog: "geology",
			corerecovery: "geotech",
			fracturecount: "geotech",
			magsus: "geotech",
			rockmechanic: "geotech",
			rqd: "geotech",
			specificgravity: "geotech",
			sample: "sampling",
			dispatch: "sampling",
			cyclone: "sampling",
			qaqc: "summary",
			signoff: "summary",
		};

		return categoryMap[activeSection] || "setup";
	};

	// Calculate completion status for a category
	const getCategoryCompletion = (categoryKey: string): { total: number; completed: number } => {
		const categorySections = getSectionStoresByCategory(sections, categoryKey as any);
		const total = categorySections.length;
		const completed = categorySections.filter(s => (s as any)?.isComplete).length;
		return { total, completed };
	};

	// Handle tab change
	const handleTabChange = (categoryKey: string) => {
		console.log("🎨 [TABS] Category changed", { categoryKey });
		
		// Get first section in category
		const categorySections = getSectionStoresByCategory(sections, categoryKey as any);
		if (categorySections.length > 0) {
			const firstSection = Object.keys(sections).find(key =>
				sections[key] === categorySections[0]
			);
			if (firstSection) {
				onTabChange(firstSection);
			}
		}
	};

	// Build tab items
	const tabItems = MAIN_CATEGORIES.map(category => {
		const { total, completed } = getCategoryCompletion(category.key);
		const isComplete = completed === total && total > 0;
		const hasProgress = completed > 0;

		return {
			key: category.key,
			label: (
				<div style={{ 
					display: "flex", 
					alignItems: "center", 
					gap: "8px",
					padding: "4px 8px",
				}}>
					{/* Icon */}
					<span style={{ fontSize: "16px" }}>{category.icon}</span>
					
					{/* Label */}
					<span>{category.label}</span>
					
					{/* Completion indicator */}
					{isComplete ? (
						<CheckCircleOutlined style={{ color: "#52c41a" }} />
					) : hasProgress ? (
						<Badge count={`${completed}/${total}`} 
							style={{ 
								backgroundColor: "#1890ff",
								fontSize: "10px",
								height: "18px",
								lineHeight: "18px",
							}} 
						/>
					) : (
						<Badge count={total} 
							style={{ 
								backgroundColor: "#d9d9d9",
								color: "#595959",
								fontSize: "10px",
								height: "18px",
								lineHeight: "18px",
							}} 
						/>
					)}
				</div>
			),
		};
	});

	return (
		<div style={{
			backgroundColor: "white",
			borderBottom: "1px solid #f0f0f0",
		}}>
			<Tabs
				activeKey={getActiveCategoryKey()}
				items={tabItems}
				onChange={handleTabChange}
				size="large"
				style={{ 
					marginBottom: 0,
					paddingLeft: "16px",
					paddingRight: "16px",
				}}
			/>
		</div>
	);
}
