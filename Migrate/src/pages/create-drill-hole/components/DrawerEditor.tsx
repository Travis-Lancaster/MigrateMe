/**
 * Drawer Editor
 *
 * Right-side drawer for detailed row editing in grid sections.
 * Mobile/tablet optimized with full-screen overlay on small screens.
 *
 * Based on: public/create-drill-hole.html mockup inspector panel
 */

import { CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, Space } from "antd";
import { useState } from "react";

export interface DrawerEditorProps {
	open: boolean
	title?: string
	width?: number | string
	onClose: () => void
	onSave?: (values: any) => void
	children?: React.ReactNode
}

/**
 * Drawer editor component for row detail editing
 */
export function DrawerEditor({
	open,
	title = "Edit Row",
	width = 480,
	onClose,
	onSave,
	children,
}: DrawerEditorProps): JSX.Element {
	console.log("🎨 [DRAWER] Rendering DrawerEditor", { open, title });

	const [form] = Form.useForm();
	const [saving, setSaving] = useState(false);

	// Handle save
	const handleSave = async () => {
		try {
			console.log("💾 [DRAWER] Validating and saving form");
			
			const values = await form.validateFields();
			setSaving(true);

			if (onSave) {
				await onSave(values);
			}

			console.log("✅ [DRAWER] Form saved successfully");
			setSaving(false);
			onClose();
		}
		catch (err) {
			console.error("❌ [DRAWER] Form validation failed", err);
			setSaving(false);
		}
	};

	// Handle cancel
	const handleCancel = () => {
		console.log("🔙 [DRAWER] Canceling editor");
		form.resetFields();
		onClose();
	};

	return (
		<Drawer
			title={title}
			placement="right"
			width={width}
			open={open}
			onClose={handleCancel}
			maskClosable={false}
			extra={
				<Space>
					<Button
						icon={<CloseOutlined />}
						onClick={handleCancel}
						disabled={saving}
					>
						Cancel
					</Button>
					<Button
						type="primary"
						icon={<SaveOutlined />}
						onClick={handleSave}
						loading={saving}
					>
						Save
					</Button>
				</Space>
			}
			styles={{
				body: {
					paddingBottom: 80,
				},
			}}
		>
			<Form
				form={form}
				layout="vertical"
				autoComplete="off"
			>
				{children}
			</Form>
		</Drawer>
	);
}
