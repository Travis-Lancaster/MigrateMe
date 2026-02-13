import React from "react";
import { Button } from "antd";
import { SaveOutlined, CheckOutlined, EyeOutlined } from "@ant-design/icons";

interface SectionFooterProps {
	rowStatus: 0 | 1 | 2 | 3; // Draft, Complete, Reviewed, Approved
	isDirty: boolean;
	onSave?: () => void;
	onSubmit?: () => void;
	onReview?: () => void;
	className?: string;
}

export const SectionFooter: React.FC<SectionFooterProps> = ({
	rowStatus,
	isDirty,
	onSave,
	onSubmit,
	onReview,
	className = "",
}) => {
	const handleSave = () => {
		console.log("[SectionFooter] 💾 Save clicked", { rowStatus, isDirty });
		onSave?.();
	};

	const handleSubmit = () => {
		console.log("[SectionFooter] ✅ Submit clicked", { rowStatus, isDirty });
		onSubmit?.();
	};

	const handleReview = () => {
		console.log("[SectionFooter] 👁️ Review clicked", { rowStatus, isDirty });
		onReview?.();
	};

	// Determine which button to show based on RowStatus and isDirty
	const showSave = rowStatus === 0 && isDirty; // Draft & Dirty -> Save
	const showSubmit = rowStatus === 0 && !isDirty; // Draft & Clean -> Submit
	const showReview = rowStatus === 1 && !isDirty; // Complete -> Review

	return (
		<div
			className={`bg-slate-50 p-3 flex justify-between items-center px-6 border-t ${className}`}
		>
			<div className="flex items-center space-x-2">
				<div className="w-px h-6 bg-slate-300 mx-2"></div>
			</div>
			<div className="flex items-center space-x-3">
				{showSave && (
					<Button
						type="primary"
						icon={<SaveOutlined />}
						onClick={handleSave}
						className="bg-blue-600 hover:bg-blue-700"
					>
						Save
					</Button>
				)}
				{showSubmit && (
					<Button
						type="primary"
						icon={<CheckOutlined />}
						onClick={handleSubmit}
						className="bg-blue-600 hover:bg-blue-700"
					>
						Submit
					</Button>
				)}
				{showReview && (
					<Button
						type="primary"
						icon={<EyeOutlined />}
						onClick={handleReview}
						className="bg-blue-600 hover:bg-blue-700"
					>
						Review
					</Button>
				)}
				{rowStatus === 2 && (
					<div className="text-green-600 font-semibold">✓ Reviewed</div>
				)}
				{rowStatus === 3 && (
					<div className="text-green-600 font-semibold">✓ Approved (Read Only)</div>
				)}
			</div>
		</div>
	);
};
