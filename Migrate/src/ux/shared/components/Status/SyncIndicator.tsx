/**
 * SyncIndicator Component
 * Shows offline/online status and sync queue
 */

import { CloudOutlined, CloudSyncOutlined, DisconnectOutlined } from "@ant-design/icons";
import { Badge, Tooltip } from "antd";
import { useEffect, useState } from "react";

export interface SyncIndicatorProps {
	className?: string
}

export function SyncIndicator({ className }: SyncIndicatorProps) {
	const [isOnline, setIsOnline] = useState(navigator.onLine);
	const [pendingCount] = useState(0); // TODO: Connect to sync store

	useEffect(() => {
		const handleOnline = () => {
			console.log("[SYNC] Network status: Online");
			setIsOnline(true);
		};
		const handleOffline = () => {
			console.log("[SYNC] Network status: Offline");
			setIsOnline(false);
		};

		window.addEventListener("online", handleOnline);
		window.addEventListener("offline", handleOffline);

		return () => {
			window.removeEventListener("online", handleOnline);
			window.removeEventListener("offline", handleOffline);
		};
	}, []);

	if (!isOnline) {
		return (
			<Tooltip title={`Offline - ${pendingCount} changes pending`}>
				<Badge count={pendingCount} offset={[-8, 8]}>
					<DisconnectOutlined
						className={className}
						style={{ fontSize: 18, color: "#fa8c16" }}
					/>
				</Badge>
			</Tooltip>
		);
	}

	if (pendingCount > 0) {
		return (
			<Tooltip title={`Syncing ${pendingCount} changes...`}>
				<Badge count={pendingCount} offset={[-8, 8]}>
					<CloudSyncOutlined
						className={className}
						style={{ fontSize: 18, color: "#1890ff" }}
						spin
					/>
				</Badge>
			</Tooltip>
		);
	}

	return (
		<Tooltip title="All synced">
			<CloudOutlined
				className={className}
				style={{ fontSize: 18, color: "#52c41a" }}
			/>
		</Tooltip>
	);
}
