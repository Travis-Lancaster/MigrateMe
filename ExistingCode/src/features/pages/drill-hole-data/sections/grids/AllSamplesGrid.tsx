/**
 * AllSamples Grid Component
 *
 * AG Grid component for sample logging with complex workflows.
 *
 * @module drill-hole-data/sections/grids
 */

import React, { useMemo } from "react";
import { Button, Card, Space, Statistic } from "antd";
import { ImportOutlined, PlusOutlined, SendOutlined } from "@ant-design/icons";

import { AllSamples } from "../../types/data-contracts";
import { DataGrid } from "../../components/DataGrid";
import { allSamplesColumns } from "../../column-defs/allSamplesColumns";
import { useSampleOperations } from "../../hooks";

export const AllSamplesGrid: React.FC = () => {
	const {
		samples,
		isReadOnly,
		rowMetadata,
		handleCellValueChanged,
		handleEditSample,
		handleAddSample,
		handleDispatchSamples,
		handleImportLabResults,
	} = useSampleOperations();

	const selectedDraftIds = useMemo(
		() => samples.filter(sample => sample.ActiveInd !== false && (sample.RowStatus ?? 0) === 0).map(sample => sample.SampleId),
		[samples],
	);

	const totalWeight = useMemo(
		() => samples.reduce((sum, row) => sum + Number(row.SampleWeight || 0), 0),
		[samples],
	);

	const getRowClass = useMemo(() => {
		return (row: AllSamples) => {
			const sampleId = row.SampleId;
			const metadata = rowMetadata[sampleId];

			if (metadata?.validationStatus === "Invalid") return "bg-red-50 border-l-4 border-red-500";
			if (metadata?.isDirty) return "bg-blue-50 border-l-4 border-blue-500";
			return "";
		};
	}, [rowMetadata]);

	return (
		<div className="h-full w-full p-4">
			<Card size="small" style={{ marginBottom: 12 }}>
				<Space size="large" wrap>
					<Statistic title="Active Samples" value={samples.length} />
					<Statistic title="Total Weight" value={Number(totalWeight.toFixed(3))} suffix="kg" />
					<Button icon={<PlusOutlined />} onClick={handleAddSample} disabled={isReadOnly}>Add Sample</Button>
					<Button
						icon={<SendOutlined />}
						onClick={() => handleDispatchSamples(selectedDraftIds)}
						disabled={isReadOnly || selectedDraftIds.length === 0}
					>
						Dispatch Draft Samples ({selectedDraftIds.length})
					</Button>
					<Button icon={<ImportOutlined />} onClick={handleImportLabResults}>Import Lab Results</Button>
				</Space>
			</Card>

			<DataGrid<AllSamples>
				columnDefs={allSamplesColumns}
				rowData={samples}
				onRowClick={handleEditSample}
				onCellValueChanged={handleCellValueChanged}
				sortColumn="DepthFrom"
				readOnly={isReadOnly}
				getRowClass={getRowClass}
			/>
		</div>
	);
};
