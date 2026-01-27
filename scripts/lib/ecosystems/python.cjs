/**
 * Python Ecosystem Module
 * Handles Python projects with pip, poetry, uv, conda
 */

const { Ecosystem, ECOSYSTEMS } = require('./types.cjs');

/**
 * Python Ecosystem implementation
 */
class PythonEcosystem extends Ecosystem {
  constructor(config = {}) {
    super(ECOSYSTEMS.PYTHON, config);
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

  getPackageManagerCommands() {
    // Determine package manager: pip, poetry, uv, conda
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

  getBuildCommand() {
    const pm = this.config.packageManager || 'pip';
    if (pm === 'poetry') {
      return 'poetry build';
    }
    return 'python setup.py build';
  }

  getTestCommand() {
    const commands = this.getPackageManagerCommands();
    return commands.test;
  }

  getFormatCommand() {
    // Assume black and isort are available
    return 'black . && isort .';
  }

  getLintCommand() {
    // Assume ruff or flake8 is available
    return 'ruff check .';
  }
}

module.exports = {
  PythonEcosystem
};
