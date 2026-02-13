/**
 * Python Ecosystem Module
 * Handles Python projects with pip, poetry, uv, conda
 */

const { Ecosystem } = require('./types.cjs');

/**
 * Python Ecosystem implementation
 */
class PythonEcosystem extends Ecosystem {
  constructor(config = {}) {
    super('python', config);
  }

  getConstantKey() {
    return 'PYTHON';
  }

  getDetectionPriority() {
    return 30;
  }

  getName() {
    return 'Python';
  }

  getIndicators() {
    return [
      'requirements.txt',
      'pyproject.toml',
      'setup.py',
      'setup.cfg',
      'Pipfile',
      'Pipfile.lock',
      'poetry.lock',
      'uv.lock',
      'environment.yml',
      'conda.yml'
    ];
  }

  getFileExtensions() {
    return ['.py', '.pyx', '.pyi'];
  }

  getTools() {
    return {
      runtime: ['python', 'python3'],
      packageManagers: ['pip', 'pip3', 'poetry', 'uv']
    };
  }

  getVersionCommands() {
    return {
      python: 'python --version',
      python3: 'python3 --version',
      pip: 'pip --version',
      pip3: 'pip3 --version',
      poetry: 'poetry --version',
      uv: 'uv --version'
    };
  }

  getInstallationHelp() {
    return {
      python: {
        win32: 'Install Python from https://python.org or use winget:\n  winget install Python.Python.3.11\n\nOr use the /setup-ecosystem command for guided setup.',
        darwin: 'Install Python using Homebrew:\n  brew install python@3.11\n\nOr download from https://python.org\n\nOr use the /setup-ecosystem command for guided setup.',
        linux: 'Python is usually pre-installed. To install specific version:\n  Ubuntu/Debian: sudo apt-get install python3.11\n  Fedora: sudo dnf install python3.11\n  Arch: sudo pacman -S python\n\nOr use pyenv: https://github.com/pyenv/pyenv\n\nOr use the /setup-ecosystem command for guided setup.'
      },
      pip: {
        win32: 'pip is included with Python. Install Python first.\nSee: python installation help',
        darwin: 'pip is included with Python. Install Python first.\nSee: python installation help',
        linux: 'pip is included with Python. Install Python first.\nSee: python installation help'
      },
      poetry: {
        win32: 'Install Poetry using pip:\n  pip install poetry\n\nOr use installer:\n  (Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | py -',
        darwin: 'Install Poetry using installer:\n  curl -sSL https://install.python-poetry.org | python3 -',
        linux: 'Install Poetry using installer:\n  curl -sSL https://install.python-poetry.org | python3 -'
      }
    };
  }

  getSetupToolCategories() {
    return {
      critical: ['python', 'python3'],
      packageManagers: ['pip', 'pip3', 'poetry', 'uv'],
      recommended: ['pip3']
    };
  }

  getFileFormatters() {
    return [{
      extensions: ['.py'],
      tool: 'ruff',
      args: (filePath) => ['format', filePath]
    }];
  }

  getDebugPatterns() {
    return [{
      extensions: /\.py$/,
      pattern: /\bprint\s*\(/,
      name: 'print()',
      message: 'Remove print() statements before committing. Use logging module instead.',
      skipPattern: /^\s*(#|"""|''')/
    }];
  }

  getPackageManagerCommands() {
    const pm = this.config.packageManager || 'pip';

    const commands = {
      pip: {
        install: 'pip install -r requirements.txt',
        add: 'pip install',
        remove: 'pip uninstall',
        test: 'pytest',
        run: 'python',
        upgrade: 'pip install --upgrade'
      },
      poetry: {
        install: 'poetry install',
        add: 'poetry add',
        remove: 'poetry remove',
        test: 'poetry run pytest',
        run: 'poetry run python',
        build: 'poetry build',
        publish: 'poetry publish'
      },
      uv: {
        install: 'uv pip install -r requirements.txt',
        add: 'uv pip install',
        remove: 'uv pip uninstall',
        test: 'uv run pytest',
        run: 'uv run python',
        sync: 'uv sync'
      },
      conda: {
        install: 'conda env create -f environment.yml',
        add: 'conda install',
        remove: 'conda remove',
        test: 'pytest',
        run: 'python',
        update: 'conda env update'
      }
    };

    return commands[pm] || commands.pip;
  }

  // --- Config-aware command generation ---

  getInstallCommand(config) {
    const pm = (config && config.packageManager) || this.config.packageManager || 'pip';
    switch (pm) {
      case 'poetry': return 'poetry install';
      case 'uv': return 'uv pip install -r requirements.txt';
      default: return 'pip install -r requirements.txt';
    }
  }

  getRunCommand(script, config) {
    const pm = (config && config.packageManager) || this.config.packageManager || 'pip';
    if (pm === 'poetry') return `poetry run ${script}`;
    return `python ${script}`;
  }

  getBuildCommand(config) {
    const pm = (config && config.packageManager) || this.config.packageManager || 'pip';
    if (pm === 'poetry') return 'poetry build';
    return 'python -m build';
  }

  getTestCommand(config) {
    const pm = (config && config.packageManager) || this.config.packageManager || 'pip';
    if (pm === 'poetry') return 'poetry run pytest';
    return 'pytest';
  }

  getFormatCommand(config) {
    return 'black .';
  }

  getLintCommand(config) {
    return 'flake8 .';
  }
}

module.exports = {
  PythonEcosystem
};
