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

interface DownHoleSurveySectionProps {
	control: Control<any>
	errors: FieldErrors<any>
	sheetData?: any
	lookupOptions: {
		person: Array<{ value: string, label: string }>
		drillCompanies: Array<{ value: string, label: string }>
		machineryAll: Array<{ value: string, label: string }>
	}
	dirtyFields: Set<string>
	filteredMachinery: Array<{ value: string, label: string }>
	drillPlanId: string
}

export function DownHoleSurveySection({ control, errors, sheetData, lookupOptions, dirtyFields, filteredMachinery, drillPlanId }: DownHoleSurveySectionProps) {
	return (
		<Col xs={24} md={24}>
			<TitleCard
				title="Down Hole Survey"
				orientation="vertical"
				size="small"
				borderColor="#13c2c2"
				showToggle={true}
				titleAlign="left"
				style={{ minHeight: "auto" }}
				bodyStyle={{ minHeight: "auto", padding: "12px" }}
			>
				<Descriptions bordered size="small" column={4}>
					<Descriptions.Item label="Drilling Contractor" span={1}>
						<SheetFormField
							name="RigSetup.DownHoleSurveyDrillingContractor"
							control={control}
							type="autocomplete"
							options={lookupOptions.drillCompanies}
							placeholder="Drilling Contractor"
							validateStatus={(errors as any).RigSetup?.DownHoleSurveyDrillingContractor ? "error" : ""}
							help={(errors as any).RigSetup?.DownHoleSurveyDrillingContractor?.message}
							isDirty={dirtyFields.has("RigSetup.DownHoleSurveyDrillingContractor")}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Rig No" span="filled">
						<SheetFormField
							name="RigSetup.DownHoleSurveyRigNo"
							control={control}
							type="autocomplete"
							options={filteredMachinery}
							validateStatus={(errors as any).RigSetup?.DownHoleSurveyRigNo ? "error" : ""}
							help={(errors as any).RigSetup?.DownHoleSurveyRigNo?.message}
							isDirty={dirtyFields.has("RigSetup.DownHoleSurveyRigNo")}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Driller" span={1}>
						<SheetFormField
							name="RigSetup.DownHoleSurveyDriller"
							control={control}
							type="autocomplete"
							options={lookupOptions.person}
							validateStatus={(errors as any).RigSetup?.DownHoleSurveyDriller ? "error" : ""}
							help={(errors as any).RigSetup?.DownHoleSurveyDriller?.message}
							isDirty={dirtyFields.has("RigSetup.DownHoleSurveyDriller")}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Driller Signature" span={1}>
						<Controller
							name="RigSetup.DownHoleSurveyDrillerSignature"
							control={control}
							render={({ field: { value, onChange } }) => (
								<SignaturePad
									value={value || ""}
									error={!!(errors as any).RigSetup?.DownHoleSurveyDrillerSignature}
									onChange={(signature: string) => {
										onChange(signature);
										if (signature) {
											store.updateField(drillPlanId, "rigsheet", "RigSetup.DownHoleSurveyDrillerSignatureDt", new Date().toISOString());
										}
										else {
											store.updateField(drillPlanId, "rigsheet", "RigSetup.DownHoleSurveyDrillerSignatureDt", null);
										}
									}}
								/>
							)}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Date" span="filled">
						<SheetFormField
							name="RigSetup.DownHoleSurveyDrillerSignatureDt"
							control={control}
							type="date"
							validateStatus={(errors as any).RigSetup?.DownHoleSurveyDrillerSignatureDt ? "error" : ""}
							help={(errors as any).RigSetup?.DownHoleSurveyDrillerSignatureDt?.message}
							isDirty={dirtyFields.has("RigSetup.DownHoleSurveyDrillerSignatureDt")}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Rig Alignment Tool Mag Azi" span={1}>
						<SheetFormField
							name="RigSetup.RigAlignmentToolMagAzi"
							control={control}
							type="number"
							validateStatus={(errors as any).RigSetup?.RigAlignmentToolMagAzi ? "error" : ""}
							help={(errors as any).RigSetup?.RigAlignmentToolMagAzi?.message}
							isDirty={dirtyFields.has("RigSetup.RigAlignmentToolMagAzi")}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Rig Alignment Tool Dip" span="filled">
						<SheetFormField
							name="RigSetup.RigAlignmentToolDip"
							control={control}
							type="number"
							validateStatus={(errors as any).RigSetup?.RigAlignmentToolDip ? "error" : ""}
							help={(errors as any).RigSetup?.RigAlignmentToolDip?.message}
							isDirty={dirtyFields.has("RigSetup.RigAlignmentToolDip")}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Survey Tool" span={1}>
						<SheetFormField
							name="RigSetup.SurveyReference"
							control={control}
							type="autocomplete"
							options={filteredMachinery}
							validateStatus={(errors as any).RigSetup?.SurveyReference ? "error" : ""}
							help={(errors as any).RigSetup?.SurveyReference?.message}
							isDirty={dirtyFields.has("RigSetup.SurveyReference")}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Mag Azi" span={1}>
						<SheetFormField
							name="RigSetup.SurveyMagAzi"
							control={control}
							type="number"
							validateStatus={(errors as any).RigSetup?.SurveyMagAzi ? "error" : ""}
							help={(errors as any).RigSetup?.SurveyMagAzi?.message}
							isDirty={dirtyFields.has("RigSetup.SurveyMagAzi")}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Dip" span="filled">
						<SheetFormField
							name="RigSetup.SurveyDip"
							control={control}
							type="number"
							validateStatus={(errors as any).RigSetup?.SurveyDip ? "error" : ""}
							help={(errors as any).RigSetup?.SurveyDip?.message}
							isDirty={dirtyFields.has("RigSetup.SurveyDip")}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Survey Depth" span={1}>
						<SheetFormField
							name="RigSetup.SurveyDepth"
							control={control}
							type="number"
							validateStatus={(errors as any).RigSetup?.SurveyDepth ? "error" : ""}
							help={(errors as any).RigSetup?.SurveyDepth?.message}
							isDirty={dirtyFields.has("RigSetup.SurveyDepth")}
						/>
					</Descriptions.Item>
				</Descriptions>
			</TitleCard>
		</Col>
	);
}
