/**
 * Lab Results Importer
 *
 * Imports CSV lab results and merges values into AllSamples rows using existing store actions.
 *
 * @module drill-hole-data/sections/forms
 */

import { Alert, Button, Card, Table, Upload, message } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import React, { useMemo, useState } from "react";

import { SectionKey } from "../../types/data-contracts";
import { useDrillHoleDataStore } from "../../store";

interface ParsedRow {
	SampleNm?: string;
	SampleId?: string;
	[key: string]: string | undefined;
}

function parseCsv(content: string): ParsedRow[] {
	const lines = content
		.split(/\r?\n/)
		.map(line => line.trim())
		.filter(Boolean);

	if (lines.length < 2) {
		return [];
	}

	const headers = lines[0].split(",").map(h => h.trim());

	return lines.slice(1).map((line) => {
		const values = line.split(",").map(v => v.trim());
		const row: ParsedRow = {};
		headers.forEach((header, index) => {
			row[header] = values[index];
		});
		return row;
	});
}

export const LabResultsImporter: React.FC = () => {
	const section = useDrillHoleDataStore(state => state.sections.allSamples);
	const updateRow = useDrillHoleDataStore(state => state.updateRow);
	const canEdit = useDrillHoleDataStore(state => state.canEdit(SectionKey.AllSamples));

	const [rows, setRows] = useState<ParsedRow[]>([]);
	const [appliedCount, setAppliedCount] = useState<number>(0);

	const sampleRows = useMemo(() => (Array.isArray(section.data) ? section.data : []), [section.data]);

	const handleBeforeUpload = async (file: File) => {
		if (!file.name.toLowerCase().endsWith(".csv")) {
			message.error("Please upload a CSV file");
			return Upload.LIST_IGNORE;
		}

		const content = await file.text();
		const parsed = parseCsv(content);

		if (parsed.length === 0) {
			message.warning("No rows found in CSV file");
			setRows([]);
			return Upload.LIST_IGNORE;
		}

		setRows(parsed);
		setAppliedCount(0);
		message.success(`Loaded ${parsed.length} lab-result rows`);
		return Upload.LIST_IGNORE;
	};

	const applyResults = () => {
		if (!canEdit) {
			message.warning("Cannot import in read-only mode");
			return;
		}

		if (rows.length === 0) {
			message.warning("No parsed rows to apply");
			return;
		}

		let updated = 0;

		rows.forEach((importRow) => {
			const sampleId = importRow.SampleId;
			const sampleNm = importRow.SampleNm;

			const match = sampleRows.find((sample: any) => {
				if (sampleId && sample.SampleId === sampleId) return true;
				if (sampleNm && sample.SampleNm === sampleNm) return true;
				return false;
			});

			if (!match) return;

			const payload: Record<string, any> = {};
			Object.entries(importRow).forEach(([key, value]) => {
				if (key === "SampleId" || key === "SampleNm") return;
				payload[key] = value;
			});

			if (Object.keys(payload).length > 0) {
				updateRow(SectionKey.AllSamples, match.SampleId, payload);
				updated += 1;
			}
		});

		setAppliedCount(updated);
		message.success(`Applied lab results to ${updated} sample row(s)`);
	};

	return (
		<div className="p-4 space-y-4">
			<Card title="Lab Results Import (CSV)">
				<Upload.Dragger
					accept=".csv"
					beforeUpload={handleBeforeUpload as any}
					maxCount={1}
					showUploadList
				>
					<p className="ant-upload-drag-icon"><InboxOutlined /></p>
					<p className="ant-upload-text">Click or drag CSV file to this area</p>
					<p className="ant-upload-hint">Expected columns: SampleId or SampleNm + result columns (e.g. Au, Ag)</p>
				</Upload.Dragger>

				<div className="mt-4">
					<Button type="primary" onClick={applyResults} disabled={rows.length === 0 || !canEdit}>
						Apply to Samples
					</Button>
				</div>
			</Card>

			{appliedCount > 0 && (
				<Alert type="success" message={`Updated ${appliedCount} sample row(s)`} showIcon />
			)}

			{rows.length > 0 && (
				<Card title={`Preview (${rows.length} rows)`}>
					<Table
						size="small"
						rowKey={(_, index) => `${index}`}
						pagination={{ pageSize: 10 }}
						columns={Object.keys(rows[0]).map(key => ({ title: key, dataIndex: key, key }))}
						dataSource={rows}
					/>
				</Card>
			)}
		</div>
	);
};

export default LabResultsImporter;
