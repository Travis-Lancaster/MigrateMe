import type { Control, FieldErrors } from "react-hook-form";
import TitleCard from "#src/components/basic-card/TitleCard.js";

import { SheetFormField } from "#src/components/sheets/SheetFormField.js";
import SignaturePad from "#src/components/signature-pad/index.js";
import { Col, Descriptions } from "antd";
import { Controller } from "react-hook-form";

// Global store adapter for signature pad integration
declare const store: {
	updateField: (
		drillPlanId: string,
		sectionKey: string,
		fieldPath: string,
		value: any,
	) => void
};

interface FinalSetupSectionProps {
	control: Control<any>
	errors: FieldErrors<any>
	sheetData?: any
	lookupOptions: {
		person: Array<{ value: string, label: string }>
	}
	dirtyFields: Set<string>
	drillPlanId: string
}

export function FinalSetupSection({ control, errors, sheetData, lookupOptions, dirtyFields, drillPlanId }: FinalSetupSectionProps) {
	return (
		<Col xs={24} md={24}>
			<TitleCard
				title="Final-Setup Details"
				orientation="vertical"
				size="small"
				borderColor="#eb2f96"
				showToggle={true}
				titleAlign="left"
				style={{ minHeight: "auto" }}
				bodyStyle={{ minHeight: "auto", padding: "12px" }}
			>
				<Descriptions bordered size="small" column={4}>
					<Descriptions.Item label="Mag Azimuth" span={1}>
						<SheetFormField
							name="RigSetup.FinalMagAzimuth"
							control={control}
							type="number"
							validateStatus={(errors as any).RigSetup?.FinalMagAzimuth ? "error" : ""}
							help={(errors as any).RigSetup?.FinalMagAzimuth?.message}
							isDirty={dirtyFields.has("RigSetup.FinalMagAzimuth")}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Inclination" span="filled">
						<SheetFormField
							name="RigSetup.FinalInclination"
							control={control}
							type="number"
							validateStatus={(errors as any).RigSetup?.FinalInclination ? "error" : ""}
							help={(errors as any).RigSetup?.FinalInclination?.message}
							isDirty={dirtyFields.has("RigSetup.FinalInclination")}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Final Geologist" span={1}>
						<SheetFormField
							name="RigSetup.FinalGeologist"
							control={control}
							type="autocomplete"
							options={lookupOptions.person}
							validateStatus={(errors as any).RigSetup?.FinalGeologist ? "error" : ""}
							help={(errors as any).RigSetup?.FinalGeologist?.message}
							isDirty={dirtyFields.has("RigSetup.FinalGeologist")}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Geologist Signature" span={1}>
						<Controller
							name="RigSetup.FinalGeologistSignature"
							control={control}
							render={({ field: { value, onChange } }) => (
								<SignaturePad
									value={value || ""}
									error={!!(errors as any).RigSetup?.FinalGeologistSignature}
									onChange={(signature: string) => {
										onChange(signature);
										if (signature) {
											store.updateField(drillPlanId, "rigsheet", "RigSetup.FinalGeologistSignatureDt", new Date().toISOString());
										}
										else {
											store.updateField(drillPlanId, "rigsheet", "RigSetup.FinalGeologistSignatureDt", null);
										}
									}}
								/>
							)}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Date" span="filled">
						<SheetFormField
							name="RigSetup.FinalGeologistSignatureDt"
							control={control}
							type="date"
							validateStatus={(errors as any).RigSetup?.FinalGeologistSignatureDt ? "error" : ""}
							help={(errors as any).RigSetup?.FinalGeologistSignatureDt?.message}
							isDirty={dirtyFields.has("RigSetup.FinalGeologistSignatureDt")}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Final Setup Approved By" span={1}>
						<SheetFormField
							name="RigSetup.FinalSetupApprovedBy"
							control={control}
							type="autocomplete"
							options={lookupOptions.person}
							validateStatus={(errors as any).RigSetup?.FinalSetupApprovedBy ? "error" : ""}
							help={(errors as any).RigSetup?.FinalSetupApprovedBy?.message}
							isDirty={dirtyFields.has("RigSetup.FinalSetupApprovedBy")}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Approval Signature" span={1}>
						<Controller
							name="RigSetup.FinalSetupSignature"
							control={control}
							render={({ field: { value, onChange } }) => (
								<SignaturePad
									value={value || ""}
									error={!!(errors as any).RigSetup?.FinalSetupSignature}
									onChange={(signature: string) => {
										onChange(signature);
										if (signature) {
											store.updateField(drillPlanId, "rigsheet", "RigSetup.FinalSetupSignatureDt", new Date().toISOString());
										}
										else {
											store.updateField(drillPlanId, "rigsheet", "RigSetup.FinalSetupSignatureDt", null);
										}
									}}
								/>
							)}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Date" span="filled">
						<SheetFormField
							name="RigSetup.FinalSetupSignatureDt"
							control={control}
							type="date"
							validateStatus={(errors as any).RigSetup?.FinalSetupSignatureDt ? "error" : ""}
							help={(errors as any).RigSetup?.FinalSetupSignatureDt?.message}
							isDirty={dirtyFields.has("RigSetup.FinalSetupSignatureDt")}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Final Drill Supervisor" span={1}>
						<SheetFormField
							name="RigSetup.FinalSetupDrillSupervisor"
							control={control}
							type="autocomplete"
							options={lookupOptions.person}
							validateStatus={(errors as any).RigSetup?.FinalSetupDrillSupervisor ? "error" : ""}
							help={(errors as any).RigSetup?.FinalSetupDrillSupervisor?.message}
							isDirty={dirtyFields.has("RigSetup.FinalSetupDrillSupervisor")}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Supervisor Signature" span={1}>
						<Controller
							name="RigSetup.FinalSetupDrillSupervisorSignature"
							control={control}
							render={({ field: { value, onChange } }) => (
								<SignaturePad
									value={value || ""}
									error={!!(errors as any).RigSetup?.FinalSetupDrillSupervisorSignature}
									onChange={(signature: string) => {
										onChange(signature);
										if (signature) {
											store.updateField(drillPlanId, "rigsheet", "RigSetup.FinalSetupDrillSupervisorSignatureDt", new Date().toISOString());
										}
										else {
											store.updateField(drillPlanId, "rigsheet", "RigSetup.FinalSetupDrillSupervisorSignatureDt", null);
										}
									}}
								/>
							)}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Date" span="filled">
						<SheetFormField
							name="RigSetup.FinalSetupDrillSupervisorSignatureDt"
							control={control}
							type="date"
							validateStatus={(errors as any).RigSetup?.FinalSetupDrillSupervisorSignatureDt ? "error" : ""}
							help={(errors as any).RigSetup?.FinalSetupDrillSupervisorSignatureDt?.message}
							isDirty={dirtyFields.has("RigSetup.FinalSetupDrillSupervisorSignatureDt")}
						/>
					</Descriptions.Item>
				</Descriptions>
			</TitleCard>
		</Col>
	);
}
