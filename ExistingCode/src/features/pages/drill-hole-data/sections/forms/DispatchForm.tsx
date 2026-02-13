/**
 * Dispatch Form Component
 *
 * Form-based section for lab dispatch data entry.
 * Integrated with drill-hole-data store and ExistingCode data-access flow.
 *
 * @module drill-hole-data/sections/forms
 */

import { Alert, Button, Card, Checkbox, Col, DatePicker, Form, Input, InputNumber, Row, Space, Statistic, Tag, Typography } from "antd";
import React, { useMemo } from "react";
import dayjs from "dayjs";
import { SectionKey } from "../../types/data-contracts";
import { useDrillHoleDataStore } from "../../store";

const { TextArea } = Input;
const { Text } = Typography;

function buildDefaultDispatch(drillPlanId: string, holeNm: string, organization: string, sampleCount: number, totalWeight: number) {
	const now = new Date().toISOString();

	return {
		LabDispatchId: crypto.randomUUID(),
		CollarId: drillPlanId,
		HoleNm: holeNm || "",
		Organization: organization || "",
		DispatchNumber: "",
		DispatchedDt: now,
		DispatchStatus: "Draft",
		LabCode: "",
		SubmittedBy: "",
		AuthorizedByName: "",
		CertificateInd: false,
		EmailNotificationInd: false,
		WebNotificationInd: false,
		PulpDiscardAfter90Days: false,
		PulpPaidStorageAfter90Days: false,
		PulpReturnAfter90Days: false,
		PulpReturnInd: false,
		RejectDiscardAfter90Days: false,
		RejectPaidStorageAfter90Days: false,
		RejectReturnAfter90Days: false,
		RejectReturnInd: false,
		SampleTypeDrillCore: true,
		SampleTypePercussion: false,
		SampleTypeRock: false,
		SampleTypeSediment: false,
		SampleTypeSoil: false,
		TotalSampleCount: sampleCount,
		TotalWeight: Number(totalWeight.toFixed(3)),
		SpecialInstructions: "",
		RowStatus: 0,
		ActiveInd: true,
		rv: "",
		CreatedOnDt: now,
		ModifiedOnDt: now,
	};
}

export const DispatchForm: React.FC = () => {
	const section = useDrillHoleDataStore(state => state.sections.dispatch);
	const allSamplesSection = useDrillHoleDataStore(state => state.sections.allSamples);
	const drillPlanId = useDrillHoleDataStore(state => state.drillPlanId || "");
	const vwCollar = useDrillHoleDataStore(state => state.vwCollar);
	const updateSectionData = useDrillHoleDataStore(state => state.updateSectionData);
	const canEdit = useDrillHoleDataStore(state => state.canEdit(SectionKey.Dispatch));

	const activeSamples = useMemo(() => {
		const samples = Array.isArray(allSamplesSection.data) ? allSamplesSection.data : [];
		return samples.filter((row: any) => row?.ActiveInd !== false);
	}, [allSamplesSection.data]);

	const totalWeight = useMemo(
		() => activeSamples.reduce((sum: number, row: any) => sum + Number(row?.SampleWeight || 0), 0),
		[activeSamples],
	);

	const dispatchData = (section.data || {}) as Record<string, any>;

	const upsertField = (field: string, value: any) => {
		updateSectionData(SectionKey.Dispatch, {
			...dispatchData,
			[field]: value,
		});
	};

	const handleInitialize = () => {
		const base = buildDefaultDispatch(
			drillPlanId,
			(vwCollar as any)?.HoleNm || "",
			(vwCollar as any)?.Organization || "",
			activeSamples.length,
			totalWeight,
		);
		updateSectionData(SectionKey.Dispatch, base);
	};

	const hasDispatch = Boolean(dispatchData?.LabDispatchId);

	return (
		<div className="p-4 space-y-4">
			<Card size="small">
				<Space size="large" wrap>
					<Statistic title="Available Samples" value={activeSamples.length} />
					<Statistic title="Total Weight" value={Number(totalWeight.toFixed(3))} suffix="kg" />
					<Tag color={section.isDirty ? "processing" : "default"}>{section.isDirty ? "Unsaved changes" : "Saved"}</Tag>
				</Space>
			</Card>

			{!hasDispatch && (
				<Alert
					type="info"
					message="No dispatch loaded"
					description="Create a dispatch record to manage lab dispatch metadata for this hole."
					action={<Button type="primary" onClick={handleInitialize} disabled={!canEdit}>Create Dispatch</Button>}
				/>
			)}

			{hasDispatch && (
				<Card title="Dispatch Details">
					<Form layout="vertical">
						<Row gutter={16}>
							<Col span={8}>
								<Form.Item label="Dispatch Number">
									<Input value={dispatchData.DispatchNumber || ""} disabled={!canEdit} onChange={e => upsertField("DispatchNumber", e.target.value)} />
								</Form.Item>
							</Col>
							<Col span={8}>
								<Form.Item label="Dispatched Date">
									<DatePicker
										style={{ width: "100%" }}
										value={dispatchData.DispatchedDt ? dayjs(dispatchData.DispatchedDt) : null}
										disabled={!canEdit}
										onChange={value => upsertField("DispatchedDt", value ? value.toISOString() : null)}
									/>
								</Form.Item>
							</Col>
							<Col span={8}>
								<Form.Item label="Lab Code">
									<Input value={dispatchData.LabCode || ""} disabled={!canEdit} onChange={e => upsertField("LabCode", e.target.value)} />
								</Form.Item>
							</Col>
						</Row>

						<Row gutter={16}>
							<Col span={8}>
								<Form.Item label="Submitted By">
									<Input value={dispatchData.SubmittedBy || ""} disabled={!canEdit} onChange={e => upsertField("SubmittedBy", e.target.value)} />
								</Form.Item>
							</Col>
							<Col span={8}>
								<Form.Item label="Authorized By">
									<Input value={dispatchData.AuthorizedByName || ""} disabled={!canEdit} onChange={e => upsertField("AuthorizedByName", e.target.value)} />
								</Form.Item>
							</Col>
							<Col span={8}>
								<Form.Item label="Status">
									<Input value={dispatchData.DispatchStatus || "Draft"} disabled={!canEdit} onChange={e => upsertField("DispatchStatus", e.target.value)} />
								</Form.Item>
							</Col>
						</Row>

						<Row gutter={16}>
							<Col span={8}>
								<Form.Item label="Total Sample Count">
									<InputNumber
										style={{ width: "100%" }}
										value={dispatchData.TotalSampleCount ?? activeSamples.length}
										disabled={!canEdit}
										onChange={value => upsertField("TotalSampleCount", value || 0)}
									/>
								</Form.Item>
							</Col>
							<Col span={8}>
								<Form.Item label="Total Weight (kg)">
									<InputNumber
										style={{ width: "100%" }}
										value={dispatchData.TotalWeight ?? Number(totalWeight.toFixed(3))}
										disabled={!canEdit}
										onChange={value => upsertField("TotalWeight", value || 0)}
									/>
								</Form.Item>
							</Col>
						</Row>

						<Row gutter={16}>
							<Col span={24}>
								<Form.Item label="Special Instructions">
									<TextArea
										rows={4}
										value={dispatchData.SpecialInstructions || ""}
										disabled={!canEdit}
										onChange={e => upsertField("SpecialInstructions", e.target.value)}
									/>
								</Form.Item>
							</Col>
						</Row>

						<Space>
							<Checkbox checked={Boolean(dispatchData.CertificateInd)} disabled={!canEdit} onChange={e => upsertField("CertificateInd", e.target.checked)}>Certificate Required</Checkbox>
							<Checkbox checked={Boolean(dispatchData.EmailNotificationInd)} disabled={!canEdit} onChange={e => upsertField("EmailNotificationInd", e.target.checked)}>Email Notification</Checkbox>
							<Checkbox checked={Boolean(dispatchData.WebNotificationInd)} disabled={!canEdit} onChange={e => upsertField("WebNotificationInd", e.target.checked)}>Web Notification</Checkbox>
						</Space>

						<div className="mt-3">
							<Text type="secondary">Dispatch ID: {dispatchData.LabDispatchId}</Text>
						</div>
					</Form>
				</Card>
			)}
		</div>
	);
};

export default DispatchForm;
