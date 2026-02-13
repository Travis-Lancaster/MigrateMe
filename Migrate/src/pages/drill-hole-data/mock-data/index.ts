/**
 * Mock Data Generators
 *
 * Generates realistic fake data for all drill hole sections
 * Used for UI testing without API integration
 */

import { generateRigSetupMock } from './rigSetupMock';
import { generateCollarCoordinateMock } from './collarCoordinateMock';
import { generateGeologyCombinedLogMock } from './geologyCombinedLogMock';
import { generateShearLogMock } from './shearLogMock';
import { generateStructureLogMock } from './structureLogMock';
import { generateCoreRecoveryRunLogMock } from './coreRecoveryRunLogMock';
import { generateFractureCountLogMock } from './fractureCountLogMock';
import { generateMagSusLogMock } from './magSusLogMock';
import { generateRockMechanicLogMock } from './rockMechanicLogMock';
import { generateRockQualityDesignationLogMock } from './rockQualityDesignationLogMock';
import { generateSpecificGravityPtLogMock } from './specificGravityPtLogMock';
import { generateAllSamplesMock } from './allSamplesMock';
import { generateDispatchMock } from './dispatchMock';
import { generateQAQCMock } from './qaqcMock';
import { generateVwCollarMock } from './vwCollarMock';

// Re-export all generators
export { generateRigSetupMock };
export { generateCollarCoordinateMock };
export { generateGeologyCombinedLogMock };
export { generateShearLogMock };
export { generateStructureLogMock };
export { generateCoreRecoveryRunLogMock };
export { generateFractureCountLogMock };
export { generateMagSusLogMock };
export { generateRockMechanicLogMock };
export { generateRockQualityDesignationLogMock };
export { generateSpecificGravityPtLogMock };
export { generateAllSamplesMock };
export { generateDispatchMock };
export { generateQAQCMock };
export { generateVwCollarMock };

/**
 * Initialize all mock data at once
 */
export function initializeAllMockData() {
	return {
		rigSetup: generateRigSetupMock(),
		collarCoordinate: generateCollarCoordinateMock(),
		geologyCombinedLog: generateGeologyCombinedLogMock(),
		shearLog: generateShearLogMock(),
		structureLog: generateStructureLogMock(),
		coreRecoveryRunLog: generateCoreRecoveryRunLogMock(),
		fractureCountLog: generateFractureCountLogMock(),
		magSusLog: generateMagSusLogMock(),
		rockMechanicLog: generateRockMechanicLogMock(),
		rockQualityDesignationLog: generateRockQualityDesignationLogMock(),
		specificGravityPtLog: generateSpecificGravityPtLogMock(),
		allSamples: generateAllSamplesMock(),
		dispatch: generateDispatchMock(),
		qaqc: generateQAQCMock(),
		vwCollar: generateVwCollarMock(),
	};
}
