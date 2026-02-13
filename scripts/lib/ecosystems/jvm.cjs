/**
 * JVM Ecosystem Module
 * Handles Java, Kotlin, Scala projects with Maven and Gradle
 */

const { Ecosystem } = require('./types.cjs');

/**
 * JVM Ecosystem implementation
 */
class JvmEcosystem extends Ecosystem {
  constructor(config = {}) {
    super('jvm', config);
  }

  getConstantKey() {
    return 'JVM';
  }

  getDetectionPriority() {
    return 20;
  }

  getName() {
    return 'JVM (Java/Kotlin/Scala)';
  }

  getIndicators() {
    return [
      'pom.xml',
      'build.gradle',
      'build.gradle.kts',
      'settings.gradle',
      'settings.gradle.kts',
      'gradlew',
      'gradlew.bat',
      'mvnw',
      'mvnw.cmd'
    ];
  }

  getFileExtensions() {
    return ['.java', '.kt', '.kts', '.scala', '.groovy'];
  }

  getTools() {
    return {
      runtime: ['java', 'javac'],
      buildTools: ['mvn', 'gradle']
    };
  }

  getVersionCommands() {
    return {
      java: 'java -version',
      javac: 'javac -version',
      mvn: 'mvn --version',
      gradle: 'gradle --version'
    };
  }

  getInstallationHelp() {
    return {
      java: {
        win32: 'Install Java using winget:\n  winget install EclipseAdoptium.Temurin.11.JDK\n\nOr download from https://adoptium.net\n\nOr use the /setup-ecosystem command for guided setup.',
        darwin: 'Install Java using Homebrew:\n  brew install openjdk@11\n\nOr download from https://adoptium.net\n\nOr use the /setup-ecosystem command for guided setup.',
        linux: 'Install Java using your package manager:\n  Ubuntu/Debian: sudo apt-get install openjdk-11-jdk\n  Fedora: sudo dnf install java-11-openjdk-devel\n  Arch: sudo pacman -S jdk11-openjdk\n\nOr use SDKMAN: https://sdkman.io\n\nOr use the /setup-ecosystem command for guided setup.'
      },
      mvn: {
        win32: 'Install Maven using winget:\n  winget install Apache.Maven\n\nOr download from https://maven.apache.org',
        darwin: 'Install Maven using Homebrew:\n  brew install maven',
        linux: 'Install Maven using your package manager:\n  Ubuntu/Debian: sudo apt-get install maven\n  Fedora: sudo dnf install maven\n  Arch: sudo pacman -S maven\n\nOr use SDKMAN: sdk install maven'
      },
      gradle: {
        win32: 'Install Gradle using winget:\n  winget install Gradle.Gradle\n\nOr download from https://gradle.org',
        darwin: 'Install Gradle using Homebrew:\n  brew install gradle',
        linux: 'Install Gradle using your package manager:\n  Ubuntu/Debian: sudo apt-get install gradle\n  Fedora: sudo dnf install gradle\n  Arch: sudo pacman -S gradle\n\nOr use SDKMAN: sdk install gradle'
      }
    };
  }

  getSetupToolCategories() {
    return {
      critical: ['java', 'javac'],
      buildTools: ['mvn', 'gradle'],
      recommended: ['gradle']
    };
  }

  getDebugPatterns() {
    return [{
      extensions: /\.(java|kt|kts)$/,
      pattern: /System\.(out|err)\.(println|print)\b|\.printStackTrace\s*\(/,
      name: 'System.out.println/e.printStackTrace()',
      message: 'Remove System.out.println/e.printStackTrace() before committing. Use SLF4J/Logback instead.',
      skipPattern: /^\s*(\/\/|\/\*|\*)/
    }];
  }

  getProjectSubTypes() {
    return {
      maven: ['pom.xml', 'mvnw', 'mvnw.cmd'],
      gradle: ['build.gradle', 'build.gradle.kts', 'settings.gradle', 'settings.gradle.kts', 'gradlew', 'gradlew.bat']
    };
  }

  getPackageManagerCommands() {
    const buildTool = this.config.buildTool || 'gradle';

    const commands = {
      maven: {
        install: './mvnw install',
        clean: './mvnw clean',
        compile: './mvnw compile',
        test: './mvnw test',
        build: './mvnw package',
        run: './mvnw exec:java',
        verify: './mvnw verify'
      },
      gradle: {
        install: './gradlew build',
        clean: './gradlew clean',
        compile: './gradlew compileJava',
        test: './gradlew test',
        build: './gradlew build',
        run: './gradlew run',
        verify: './gradlew check'
      }
    };

    return commands[buildTool] || commands.gradle;
  }

  // --- Config-aware command generation (with wrapper + platform support) ---

  _wrapperPrefix(buildTool, config) {
    const useWrapper = (config && config.useWrapper !== undefined) ? config.useWrapper : (this.config.useWrapper !== false);
    const platform = (config && config.platform) || this.config.platform || process.platform;

    if (buildTool === 'gradle') {
      if (useWrapper) {
        return platform === 'win32' ? 'gradlew.bat' : './gradlew';
      }
      return 'gradle';
    }
    // maven
    if (useWrapper) {
      return platform === 'win32' ? 'mvnw.cmd' : './mvnw';
    }
    return 'mvn';
  }

  getInstallCommand(config) {
    const buildTool = (config && config.buildTool) || this.config.buildTool || 'maven';
    const prefix = this._wrapperPrefix(buildTool, config);
    return buildTool === 'gradle' ? `${prefix} build` : `${prefix} install`;
  }

  getRunCommand(script, config) {
    const buildTool = (config && config.buildTool) || this.config.buildTool || 'maven';
    const prefix = this._wrapperPrefix(buildTool, config);
    return `${prefix} ${script}`;
  }

  getBuildCommand(config) {
    const buildTool = (config && config.buildTool) || this.config.buildTool || 'maven';
    const prefix = this._wrapperPrefix(buildTool, config);
    return buildTool === 'gradle' ? `${prefix} build` : `${prefix} package`;
  }

  getTestCommand(config) {
    const buildTool = (config && config.buildTool) || this.config.buildTool || 'maven';
    const prefix = this._wrapperPrefix(buildTool, config);
    return `${prefix} test`;
  }

  getFormatCommand(config) {
    const buildTool = (config && config.buildTool) || this.config.buildTool || 'maven';
    const prefix = this._wrapperPrefix(buildTool, config);
    return buildTool === 'gradle' ? `${prefix} spotlessApply` : `${prefix} spotless:apply`;
  }

  getLintCommand(config) {
    const buildTool = (config && config.buildTool) || this.config.buildTool || 'maven';
    const prefix = this._wrapperPrefix(buildTool, config);
    return buildTool === 'gradle' ? `${prefix} check` : `${prefix} checkstyle:check`;
  }
}

module.exports = {
  JvmEcosystem
};
