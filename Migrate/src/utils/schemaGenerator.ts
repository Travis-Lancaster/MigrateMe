import type { MappingConfig, MappingField } from "../pages/visual-mapper/types";
import { z } from "zod";

export function createRowValidator(fields: MappingField[]) {
	const shape: any = {};

	fields.forEach((field) => {
		let validator: z.ZodTypeAny;

		// Basic type inference based on transform or naming convention
		// In a real app, MappingField should have a 'type' property (string, number, date)
		if (field.transform === "number" || field.transform === "labValue") {
			validator = z.preprocess((val) => {
				if (typeof val === "string") {
					const trimmed = val.trim();
					if (trimmed === "" || trimmed === "NA")
						return null;
					if (trimmed === "X")
						return 0.005; // Domain specific rule
					const num = Number.parseFloat(trimmed);
					return isNaN(num) ? null : num;
				}
				return val;
			}, z.number().nullable());
		}
		else {
			validator = z.string().trim().nullable();
		}

		if (field.required) {
			// If it was nullable above, we might need to refine.
			// For now, assume required means non-null.
			// But Zod nullable().unwrap() is complex.
			// Simpler: just don't make it nullable if required, but preprocessing returns null...
			// So we add a refinement.
			validator = (validator as any).refine((val: any) => val !== null, { message: "Required field" });
		}

		shape[field.jsonKey] = validator;
	});

	return z.object(shape);
}

export function generateZodSchema(config: MappingConfig) {
	// This generates a validator for the *output* of the extraction
	// For a simple flat list:
	return createRowValidator(config.fields);
}
