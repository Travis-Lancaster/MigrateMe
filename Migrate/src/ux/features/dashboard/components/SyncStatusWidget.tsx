/**
 * SyncStatusWidget Component
 * Shows sync queue status
 */

import { SyncIndicator } from "#src/ux/index.js";

import { Card, Progress } from "antd";

export function SyncStatusWidget() {
	const pendingCount = 0; // TODO: Connect to sync store
	const totalCount = 0;
	const progress = totalCount > 0 ? ((totalCount - pendingCount) / totalCount) * 100 : 100;

	return (
		<Card
			title={(
				<div className="flex items-center gap-2">
					<SyncIndicator />
					<span>Sync Status</span>
				</div>
			)}
			size="small"
		>
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<span className="text-sm text-gray-600">Status:</span>
					<span className="text-sm font-medium text-green-600">
						{pendingCount === 0 ? "All Synced" : `${pendingCount} Pending`}
					</span>
				</div>

				<Progress
					percent={progress}
					size="small"
					showInfo={false}
					strokeColor="#52c41a"
				/>

				<div className="text-xs text-gray-500">
					Last sync: Just now
				</div>
			</div>
		</Card>
	);
}
