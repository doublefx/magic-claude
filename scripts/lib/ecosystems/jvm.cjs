/**
 * JVM Ecosystem Module
 * Handles Java, Kotlin, Scala projects with Maven and Gradle
 */

const { Ecosystem, ECOSYSTEMS } = require('./types.cjs');

/**
 * JVM Ecosystem implementation
 */
class JvmEcosystem extends Ecosystem {
  constructor(config = {}) {
    super(ECOSYSTEMS.JVM, config);
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

  getPackageManagerCommands() {
    // Determine if Maven or Gradle based on config or indicators
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

  getBuildCommand() {
    const commands = this.getPackageManagerCommands();
    return commands.build;
  }

  getTestCommand() {
    const commands = this.getPackageManagerCommands();
    return commands.test;
  }

  getFormatCommand() {
    // Assume google-java-format or spotless is available
    const buildTool = this.config.buildTool || 'gradle';
    if (buildTool === 'gradle') {
      return './gradlew spotlessApply';
    }
    return './mvnw spotless:apply';
  }

  getLintCommand() {
    // Assume checkstyle is configured
    const buildTool = this.config.buildTool || 'gradle';
    if (buildTool === 'gradle') {
      return './gradlew checkstyleMain';
    }
    return './mvnw checkstyle:check';
  }
}

module.exports = {
  JvmEcosystem
};
