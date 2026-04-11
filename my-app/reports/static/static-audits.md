# Static Audit Summary

- Status: passed
- Generated at: 2026-04-11T15:55:10.656Z
- Audits: 5

## forbidden-vector-icon-imports

- Description: Ensures runtime UI code only uses the centralized AppIcon wrapper.
- Severity: error
- Status: passed
- Findings: 0

## anti-plain-text-icon

- Description: Detects fake icon glyphs that bypass the design-system icon pipeline.
- Severity: error
- Status: passed
- Findings: 0

## anti-hardcoded-runtime-endpoints

- Description: Detects hardcoded runtime network targets outside the approved configuration seam.
- Severity: error
- Status: passed
- Findings: 0

## icon-only-pressable-accessibility

- Description: Flags icon-only pressables that do not provide an accessibility label.
- Severity: error
- Status: passed
- Findings: 0

## backend-solid-hotspots

- Description: Highlights oversized backend services/controllers for controlled SOLID refactors.
- Severity: warn
- Status: warn
- Findings: 4

- backend\src\approvals\approvals.service.ts:1 - Service file is 401 lines long and should be reviewed for SOLID split opportunities.
- backend\src\open-shifts\open-shifts.service.ts:1 - Service file is 353 lines long and should be reviewed for SOLID split opportunities.
- backend\src\requests\requests.service.ts:1 - Service file is 386 lines long and should be reviewed for SOLID split opportunities.
- backend\src\sync\sync.service.ts:1 - Service file is 422 lines long and should be reviewed for SOLID split opportunities.
