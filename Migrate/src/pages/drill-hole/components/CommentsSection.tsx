import type { Control, FieldErrors } from "react-hook-form";
import TitleCard from "#src/components/basic-card/TitleCard.js";

import { SheetFormField } from "#src/components/sheets/SheetFormField.js";
import { Col, Descriptions } from "antd";

interface CommentsSectionProps {
	control: Control<any>
	errors: FieldErrors<any>
	sheetData?: any
	dirtyFields: Set<string>
}

export function CommentsSection({ control, errors, sheetData, dirtyFields }: CommentsSectionProps) {
	return (
		<Col xs={24} md={24}>
			<TitleCard
				title="Comments"
				orientation="horizontal"
				size="small"
				borderColor="#f5222d"
				showToggle={true}
				titleAlign="left"
				style={{ minHeight: "auto" }}
				bodyStyle={{ minHeight: "auto", padding: "12px" }}
			>
				<Descriptions bordered size="small" column={4}>
					<Descriptions.Item label="Comments" span={4}>
						<SheetFormField
							name="RigSetup.Comments"
							control={control}
							type="area"
							validateStatus={(errors as any).RigSetup?.Comments ? "error" : ""}
							help={(errors as any).RigSetup?.Comments?.message}
							isDirty={dirtyFields.has("RigSetup.Comments")}
						/>
					</Descriptions.Item>
				</Descriptions>
			</TitleCard>
		</Col>
	);
}
