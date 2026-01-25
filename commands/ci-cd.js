/**
 * CI/CD Pipeline Generation Command
 * Generates CI/CD pipeline configuration based on project type and platform
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { detectProjectType } from '../scripts/lib/detect-project-type.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Platform configurations
const PLATFORMS = {
  'github-actions': {
    name: 'GitHub Actions',
    outputDir: '.github/workflows',
    outputFile: 'ci.yml',
    templateDir: 'github-actions'
  },
  'gitlab-ci': {
    name: 'GitLab CI',
    outputDir: '.',
    outputFile: '.gitlab-ci.yml',
    templateDir: 'gitlab-ci'
  },
  'bitbucket-pipelines': {
    name: 'Bitbucket Pipelines',
    outputDir: '.',
    outputFile: 'bitbucket-pipelines.yml',
    templateDir: 'bitbucket-pipelines'
  }
};

// Template mappings for each project type
const TEMPLATE_MAPPINGS = {
  nodejs: {
    'github-actions': 'nodejs.yml',
    'gitlab-ci': 'nodejs.gitlab-ci.yml',
    'bitbucket-pipelines': 'nodejs.yml'
  },
  python: {
    'github-actions': 'python.yml',
    'gitlab-ci': 'python.gitlab-ci.yml',
    'bitbucket-pipelines': 'python.yml'
  },
  maven: {
    'github-actions': 'java-maven.yml',
    'gitlab-ci': 'java-maven.gitlab-ci.yml',
    'bitbucket-pipelines': 'java-maven.yml'
  },
  gradle: {
    'github-actions': 'java-gradle.yml',
    'gitlab-ci': 'java-gradle.gitlab-ci.yml',
    'bitbucket-pipelines': 'java-gradle.yml'
  }
};

/**
 * Select template based on project types (prioritize in order)
 * @param {string[]} projectTypes - Detected project types
 * @param {string} platform - CI/CD platform
 * @returns {string|null} Template filename or null if not found
 */
function selectTemplate(projectTypes, platform) {
  // Priority order: gradle > maven > nodejs > python
  const priorityOrder = ['gradle', 'maven', 'nodejs', 'python'];

  for (const type of priorityOrder) {
    if (projectTypes.includes(type) && TEMPLATE_MAPPINGS[type][platform]) {
      return TEMPLATE_MAPPINGS[type][platform];
    }
  }

  return null;
}

/**
 * Generate CI/CD pipeline configuration
 * @param {string} platform - CI/CD platform (github-actions, gitlab-ci, bitbucket-pipelines)
 * @param {string} cwd - Current working directory
 * @returns {object} Result object with success status and message
 */
export async function generatePipeline(platform = 'github-actions', cwd = process.cwd()) {
  // Validate platform
  if (!PLATFORMS[platform]) {
    return {
      success: false,
      message: `Invalid platform: ${platform}. Valid options: ${Object.keys(PLATFORMS).join(', ')}`
    };
  }

  const platformConfig = PLATFORMS[platform];

  // Detect project type
  console.log('Detecting project type...');
  const projectTypes = detectProjectType(cwd);

  if (projectTypes.length === 0) {
    return {
      success: false,
      message: 'No supported project type detected. Supported types: Node.js, Python, Maven, Gradle'
    };
  }

  console.log(`Detected project types: ${projectTypes.join(', ')}`);

  // Select template
  const templateFile = selectTemplate(projectTypes, platform);

  if (!templateFile) {
    return {
      success: false,
      message: `No ${platformConfig.name} template available for detected project types: ${projectTypes.join(', ')}`
    };
  }

  console.log(`Selected template: ${templateFile}`);

  // Read template
  const templatePath = path.join(__dirname, '..', 'templates', platformConfig.templateDir, templateFile);

  if (!fs.existsSync(templatePath)) {
    return {
      success: false,
      message: `Template file not found: ${templatePath}`
    };
  }

  const templateContent = fs.readFileSync(templatePath, 'utf8');

  // Prepare output path
  const outputDir = path.join(cwd, platformConfig.outputDir);
  const outputPath = path.join(outputDir, platformConfig.outputFile);

  // Check if output file already exists
  if (fs.existsSync(outputPath)) {
    const backupPath = `${outputPath}.backup-${Date.now()}`;
    console.log(`⚠️  ${platformConfig.outputFile} already exists. Creating backup: ${path.basename(backupPath)}`);
    fs.copyFileSync(outputPath, backupPath);
  }

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write pipeline configuration
  fs.writeFileSync(outputPath, templateContent, 'utf8');

  return {
    success: true,
    message: `✅ Generated ${platformConfig.name} pipeline: ${outputPath}`,
    outputPath,
    projectTypes,
    templateFile
  };
}

/**
 * Generate additional files (Docker, Kubernetes, Security configs)
 * @param {string[]} fileTypes - Types of files to generate
 * @param {string} cwd - Current working directory
 * @returns {object} Result object
 */
export async function generateAdditionalFiles(fileTypes = [], cwd = process.cwd()) {
  const results = [];

  for (const fileType of fileTypes) {
    switch (fileType) {
      case 'docker': {
        const projectTypes = detectProjectType(cwd);
        const dockerfileTemplate = projectTypes.includes('nodejs')
          ? 'Dockerfile.nodejs'
          : projectTypes.includes('python')
          ? 'Dockerfile.python'
          : projectTypes.includes('gradle')
          ? 'Dockerfile.java-gradle'
          : projectTypes.includes('maven')
          ? 'Dockerfile.java-maven'
          : null;

        if (dockerfileTemplate) {
          const templatePath = path.join(__dirname, '..', 'templates', 'docker', dockerfileTemplate);
          const outputPath = path.join(cwd, 'Dockerfile');

          if (fs.existsSync(outputPath)) {
            results.push({
              success: false,
              message: `⚠️  Dockerfile already exists. Skipping.`
            });
          } else {
            const content = fs.readFileSync(templatePath, 'utf8');
            fs.writeFileSync(outputPath, content);
            results.push({
              success: true,
              message: `✅ Generated Dockerfile from ${dockerfileTemplate}`
            });
          }

          // Also copy .dockerignore
          const dockerignorePath = path.join(__dirname, '..', 'templates', 'docker', '.dockerignore');
          const dockerignoreOutput = path.join(cwd, '.dockerignore');
          if (!fs.existsSync(dockerignoreOutput)) {
            const dockerignoreContent = fs.readFileSync(dockerignorePath, 'utf8');
            fs.writeFileSync(dockerignoreOutput, dockerignoreContent);
            results.push({
              success: true,
              message: `✅ Generated .dockerignore`
            });
          }
        }
        break;
      }

      case 'kubernetes': {
        const k8sDir = path.join(cwd, 'k8s');
        if (!fs.existsSync(k8sDir)) {
          fs.mkdirSync(k8sDir, { recursive: true });
        }

        const k8sFiles = [
          'deployment.yaml',
          'service.yaml',
          'ingress.yaml',
          'configmap.yaml',
          'hpa.yaml'
        ];

        for (const file of k8sFiles) {
          const templatePath = path.join(__dirname, '..', 'templates', 'kubernetes', file);
          const outputPath = path.join(k8sDir, file);

          if (!fs.existsSync(outputPath)) {
            const content = fs.readFileSync(templatePath, 'utf8');
            fs.writeFileSync(outputPath, content);
            results.push({
              success: true,
              message: `✅ Generated k8s/${file}`
            });
          }
        }
        break;
      }

      case 'security': {
        const securityFiles = [
          { src: 'trivy.yaml', dest: 'trivy.yaml' },
          { src: '.trivyignore', dest: '.trivyignore' },
          { src: '.gitleaks.toml', dest: '.gitleaks.toml' },
          { src: 'semgrep.yaml', dest: 'semgrep.yaml' },
          { src: '.semgrepignore', dest: '.semgrepignore' }
        ];

        for (const { src, dest } of securityFiles) {
          const templatePath = path.join(__dirname, '..', 'templates', 'security', src);
          const outputPath = path.join(cwd, dest);

          if (!fs.existsSync(outputPath)) {
            const content = fs.readFileSync(templatePath, 'utf8');
            fs.writeFileSync(outputPath, content);
            results.push({
              success: true,
              message: `✅ Generated ${dest}`
            });
          }
        }
        break;
      }
    }
  }

  return {
    success: results.every(r => r.success),
    results
  };
}

/**
 * Command handler for Claude Code
 */
export default async function ciCdCommand(args = []) {
  const validPlatforms = Object.keys(PLATFORMS);
  const validAdditionalFiles = ['docker', 'kubernetes', 'security', 'helm'];

  // Validate platform argument
  const platform = args[0] || 'github-actions';
  if (!validPlatforms.includes(platform)) {
    console.error(`\n❌ Invalid platform: ${platform}`);
    console.error(`\n✅ Valid platforms: ${validPlatforms.join(', ')}\n`);
    return;
  }

  // Validate and filter additional file arguments
  const requestedFiles = args.slice(1);
  const additionalFiles = requestedFiles.filter(f => validAdditionalFiles.includes(f));

  if (requestedFiles.length !== additionalFiles.length) {
    const invalid = requestedFiles.filter(f => !validAdditionalFiles.includes(f));
    console.warn(`\n⚠️  Invalid file types ignored: ${invalid.join(', ')}`);
    console.error(`✅ Valid file types: ${validAdditionalFiles.join(', ')}\n`);
  }

  console.log(`\n🔨 Generating ${PLATFORMS[platform]?.name || platform} pipeline...\n`);

  // Generate main pipeline
  const result = await generatePipeline(platform);

  console.log(result.message);

  if (!result.success) {
    return;
  }

  console.log(`\nDetected project types: ${result.projectTypes.join(', ')}`);
  console.log(`Using template: ${result.templateFile}`);

  // Generate additional files if requested
  if (additionalFiles.length > 0) {
    console.log(`\n📦 Generating additional files: ${additionalFiles.join(', ')}...\n`);
    const additionalResult = await generateAdditionalFiles(additionalFiles);

    for (const res of additionalResult.results) {
      console.log(res.message);
    }
  }

  // Show next steps
  console.log('\n📚 Next steps:');
  console.log('1. Review and customize the generated pipeline configuration');
  console.log('2. Add required secrets to your CI/CD platform');
  console.log('3. Commit and push to trigger the pipeline');
  console.log('4. Monitor the pipeline execution\n');

  // Show additional commands
  console.log('💡 Additional options:');
  console.log('   /ci-cd github-actions docker        - Also generate Dockerfile');
  console.log('   /ci-cd gitlab-ci kubernetes         - Also generate Kubernetes manifests');
  console.log('   /ci-cd bitbucket-pipelines security - Also generate security configs');
  console.log('   /ci-cd github-actions docker kubernetes security - Generate all\n');
}

// Allow direct execution for testing
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  ciCdCommand(args);
}
