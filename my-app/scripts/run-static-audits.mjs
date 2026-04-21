import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const reportsDir = path.join(rootDir, 'reports', 'static');
const reportJsonPath = path.join(reportsDir, 'static-audits.json');
const reportMarkdownPath = path.join(reportsDir, 'static-audits.md');

const sourceExtensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
]);
const runtimeCodeRoots = ['src', 'app', 'backend/src'];
const accessibilityRoots = ['src', 'app'];
const runtimeTargetAllowlist = new Set([
  path.normalize('src/config/env.ts'),
  path.normalize('src/services/api/api-client.test.ts'),
  path.normalize('src/context/app-context.offline.test.tsx'),
  path.normalize('src/services/sync/sync-engine.test.ts'),
]);

function getRelativePath(filePath) {
  return path.normalize(path.relative(rootDir, filePath));
}

function getLineNumber(content, offset) {
  return content.slice(0, offset).split('\n').length;
}

async function listFiles(dirPath) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);

    if (
      entry.name === 'node_modules' ||
      entry.name === 'reports' ||
      entry.name === 'dist' ||
      entry.name === '.expo'
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...(await listFiles(entryPath)));
      continue;
    }

    if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
}

async function getFilesForRoots(roots) {
  const files = [];

  for (const relativeRoot of roots) {
    const absoluteRoot = path.join(rootDir, relativeRoot);
    try {
      const details = await stat(absoluteRoot);
      if (details.isDirectory()) {
        files.push(...(await listFiles(absoluteRoot)));
      } else if (details.isFile()) {
        files.push(absoluteRoot);
      }
    } catch {
      // Ignore missing roots so the script stays portable.
    }
  }

  return files;
}

function formatFinding(finding) {
  return `${finding.file}:${finding.line} - ${finding.message}`;
}

function createAuditResult({
  name,
  description,
  severity = 'error',
  findings = [],
}) {
  const status =
    findings.length === 0 ? 'passed' : severity === 'warn' ? 'warn' : 'failed';

  return {
    name,
    description,
    severity,
    status,
    findingCount: findings.length,
    findings,
  };
}

function buildMarkdownReport(summary) {
  const lines = [
    '# Static Audit Summary',
    '',
    `- Status: ${summary.status}`,
    `- Generated at: ${summary.generatedAt}`,
    `- Audits: ${summary.audits.length}`,
    '',
  ];

  for (const audit of summary.audits) {
    lines.push(`## ${audit.name}`);
    lines.push('');
    lines.push(`- Description: ${audit.description}`);
    lines.push(`- Severity: ${audit.severity}`);
    lines.push(`- Status: ${audit.status}`);
    lines.push(`- Findings: ${audit.findingCount}`);

    if (audit.findings.length > 0) {
      lines.push('');
      audit.findings.forEach((finding) => {
        lines.push(`- ${formatFinding(finding)}`);
      });
    }

    lines.push('');
  }

  return lines.join('\n');
}

const runtimeFiles = await getFilesForRoots(runtimeCodeRoots);
const accessibilityFiles = (await getFilesForRoots(accessibilityRoots)).filter(
  (filePath) => path.extname(filePath) === '.tsx',
);

const vectorIconFindings = [];
const plainTextIconFindings = [];
const runtimeTargetFindings = [];
const iconOnlyPressableFindings = [];
const backendHotspotFindings = [];

for (const filePath of runtimeFiles) {
  const content = await readFile(filePath, 'utf8');
  const relativePath = getRelativePath(filePath);
  const isTestFile =
    relativePath.includes('__snapshots__') ||
    /\.(test|spec)\.[cm]?[jt]sx?$/.test(relativePath);

  if (
    content.includes('@expo/vector-icons') &&
    relativePath !== path.normalize('src/components/common/AppIcon.tsx')
  ) {
    vectorIconFindings.push({
      file: relativePath,
      line: 1,
      message: 'Direct icon import found outside AppIcon registry.',
    });
  }

  if (!isTestFile) {
    const plainTextIconMatch = /[→←↑↓✓✔✕✖✗⚠★☆►◄◇◆]/u.exec(content);

    if (plainTextIconMatch) {
      plainTextIconFindings.push({
        file: relativePath,
        line: getLineNumber(content, plainTextIconMatch.index),
        message: `Potential plain-text icon glyph "${plainTextIconMatch[0]}" found in code.`,
      });
    }

    const hasRuntimeTarget =
      /https?:\/\/|127\.0\.0\.1|10\.0\.2\.2|localhost/u.exec(content);
    if (
      hasRuntimeTarget &&
      !runtimeTargetAllowlist.has(relativePath) &&
      !relativePath.startsWith(path.normalize('backend/scripts/')) &&
      !relativePath.startsWith(path.normalize('scripts/'))
    ) {
      runtimeTargetFindings.push({
        file: relativePath,
        line: getLineNumber(content, hasRuntimeTarget.index),
        message: `Hardcoded runtime endpoint token "${hasRuntimeTarget[0]}" found outside the allowlist.`,
      });
    }
  }
}

for (const filePath of accessibilityFiles) {
  const content = await readFile(filePath, 'utf8');
  const relativePath = getRelativePath(filePath);
  const pressablePattern =
    /<(Pressable|TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback)\b([\s\S]*?)>([\s\S]*?)<\/\1>/g;

  for (const match of content.matchAll(pressablePattern)) {
    const openingTag = match[2] ?? '';
    const innerContent = match[3] ?? '';

    if (
      innerContent.includes('<AppIcon') &&
      !innerContent.includes('<Text') &&
      !openingTag.includes('accessibilityLabel=')
    ) {
      iconOnlyPressableFindings.push({
        file: relativePath,
        line: getLineNumber(content, match.index ?? 0),
        message:
          'Icon-only pressable is missing an accessibilityLabel for screen readers.',
      });
    }
  }
}

const backendFiles = runtimeFiles.filter((filePath) =>
  getRelativePath(filePath).startsWith(path.normalize('backend/src/')),
);

for (const filePath of backendFiles) {
  const relativePath = getRelativePath(filePath);
  const content = await readFile(filePath, 'utf8');
  const lineCount = content.split('\n').length;

  if (relativePath.endsWith('.service.ts') && lineCount > 320) {
    backendHotspotFindings.push({
      file: relativePath,
      line: 1,
      message: `Service file is ${lineCount} lines long and should be reviewed for SOLID split opportunities.`,
    });
  }

  if (relativePath.endsWith('.controller.ts') && lineCount > 180) {
    backendHotspotFindings.push({
      file: relativePath,
      line: 1,
      message: `Controller file is ${lineCount} lines long and should be reviewed for thinner request orchestration.`,
    });
  }
}

const audits = [
  createAuditResult({
    name: 'forbidden-vector-icon-imports',
    description:
      'Ensures runtime UI code only uses the centralized AppIcon wrapper.',
    findings: vectorIconFindings,
  }),
  createAuditResult({
    name: 'anti-plain-text-icon',
    description:
      'Detects fake icon glyphs that bypass the design-system icon pipeline.',
    findings: plainTextIconFindings,
  }),
  createAuditResult({
    name: 'anti-hardcoded-runtime-endpoints',
    description:
      'Detects hardcoded runtime network targets outside the approved configuration seam.',
    findings: runtimeTargetFindings,
  }),
  createAuditResult({
    name: 'icon-only-pressable-accessibility',
    description:
      'Flags icon-only pressables that do not provide an accessibility label.',
    findings: iconOnlyPressableFindings,
  }),
  createAuditResult({
    name: 'backend-solid-hotspots',
    description:
      'Highlights oversized backend services/controllers for controlled SOLID refactors.',
    severity: 'warn',
    findings: backendHotspotFindings,
  }),
];

const summary = {
  status: audits.some((audit) => audit.status === 'failed')
    ? 'failed'
    : 'passed',
  generatedAt: new Date().toISOString(),
  audits,
};

await mkdir(reportsDir, { recursive: true });
await writeFile(reportJsonPath, JSON.stringify(summary, null, 2));
await writeFile(reportMarkdownPath, buildMarkdownReport(summary));

process.exit(summary.status === 'passed' ? 0 : 1);
