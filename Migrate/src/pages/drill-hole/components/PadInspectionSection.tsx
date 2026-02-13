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

interface PadInspectionSectionProps {
	control: Control<any>
	errors: FieldErrors<any>
	sheetData?: any
	lookupOptions: {
		person: Array<{ value: string, label: string }>
		drillCompanies: Array<{ value: string, label: string }>
	}
	dirtyFields: Set<string>
	drillPlanId: string
}

export function PadInspectionSection({ control, errors, sheetData, lookupOptions, dirtyFields, drillPlanId }: PadInspectionSectionProps) {
	return (
		<Col xs={24} md={24}>
			<TitleCard
				title="Pad Inspection"
				orientation="vertical"
				size="small"
				borderColor="#fa8c16"
				showToggle={true}
				titleAlign="left"
				style={{ minHeight: "auto" }}
				bodyStyle={{ minHeight: "auto", padding: "12px" }}
			>
				<Descriptions bordered size="small" column={4}>
					<Descriptions.Item label="" span={1}>
						<div></div>
					</Descriptions.Item>
					<Descriptions.Item label="Drilling Company" span="filled">
						<SheetFormField
							name="RigSetup.DrillingCompany"
							control={control}
							type="autocomplete"
							options={lookupOptions.drillCompanies}
							validateStatus={(errors as any).RigSetup?.DrillingCompany ? "error" : ""}
							help={(errors as any).RigSetup?.DrillingCompany?.message}
							isDirty={dirtyFields.has("RigSetup.DrillingCompany")}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Completed by Geologist" span={1}>
						<SheetFormField
							name="RigSetup.PadInspectionCompletedBy"
							control={control}
							type="autocomplete"
							options={lookupOptions.person}
							validateStatus={(errors as any).RigSetup?.PadInspectionCompletedBy ? "error" : ""}
							help={(errors as any).RigSetup?.PadInspectionCompletedBy?.message}
							isDirty={dirtyFields.has("RigSetup.PadInspectionCompletedBy")}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Drill Supervisor" span="filled">
						<SheetFormField
							name="RigSetup.DrillSupervisor"
							control={control}
							type="autocomplete"
							options={lookupOptions.person}
							validateStatus={(errors as any).RigSetup?.DrillSupervisor ? "error" : ""}
							help={(errors as any).RigSetup?.DrillSupervisor?.message}
							isDirty={dirtyFields.has("RigSetup.DrillSupervisor")}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Pad Inspection Signature" span={1}>
						<Controller
							name="RigSetup.PadInspectionSignature"
							control={control}
							render={({ field: { value, onChange } }) => (
								<SignaturePad
									value={value || ""}
									error={!!(errors as any).RigSetup?.PadInspectionSignature}
									onChange={(signature: string) => {
										onChange(signature);
										if (signature) {
											store.updateField(drillPlanId, "rigsheet", "RigSetup.PadInspectionSignatureDt", new Date().toISOString());
										}
										else {
											store.updateField(drillPlanId, "rigsheet", "RigSetup.PadInspectionSignatureDt", null);
										}
									}}
								/>
							)}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Drilling Signature" span="filled">
						<Controller
							name="RigSetup.DrillingSignature"
							control={control}
							render={({ field: { value, onChange } }) => (
								<SignaturePad
									value={value || ""}
									error={!!(errors as any).RigSetup?.DrillingSignature}
									onChange={(signature: string) => {
										onChange(signature);
										if (signature) {
											store.updateField(drillPlanId, "rigsheet", "RigSetup.DrillingSignatureDt", new Date().toISOString());
										}
										else {
											store.updateField(drillPlanId, "rigsheet", "RigSetup.DrillingSignatureDt", null);
										}
									}}
								/>
							)}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Date" span={1}>
						<SheetFormField
							name="RigSetup.PadInspectionSignatureDt"
							control={control}
							type="date"
							validateStatus={(errors as any).RigSetup?.PadInspectionSignatureDt ? "error" : ""}
							help={(errors as any).RigSetup?.PadInspectionSignatureDt?.message}
							isDirty={dirtyFields.has("RigSetup.PadInspectionSignatureDt")}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Date" span={1}>
						<SheetFormField
							name="RigSetup.DrillingSignatureDt"
							control={control}
							type="date"
							validateStatus={(errors as any).RigSetup?.DrillingSignatureDt ? "error" : ""}
							help={(errors as any).RigSetup?.DrillingSignatureDt?.message}
							isDirty={dirtyFields.has("RigSetup.DrillingSignatureDt")}
						/>
					</Descriptions.Item>
				</Descriptions>
			</TitleCard>
		</Col>
	);
}
