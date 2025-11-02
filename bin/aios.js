#!/usr/bin/env node

/**
 * AIOS-FullStack CLI
 * Main entry point for all AIOS commands
 * Version: 1.1.0
 */

const { Command } = require('commander');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Read package.json for version
const packageJson = require(path.join(__dirname, '..', 'package.json'));

const program = new Command();

program
  .name('aios-fullstack')
  .description('AIOS-FULLSTACK: AI-Orchestrated System for Full Stack Development')
  .version(packageJson.version, '-V, --version', 'Output the current version');

/**
 * Command: init [project-name]
 * Creates a new AIOS project with interactive wizard
 */
program
  .command('init [project-name]')
  .description('Create new AIOS project with interactive wizard')
  .option('--force', 'Force creation in non-empty directory')
  .option('--skip-install', 'Skip npm dependency installation')
  .option('--template <name>', 'Use specific template (default, minimal, enterprise)', 'default')
  .action(async (projectName, options) => {
    try {
      console.log('🚀 AIOS-FullStack Project Initialization\n');

      // If no project name, use current directory name
      const targetDir = projectName || path.basename(process.cwd());
      const targetPath = projectName ? path.join(process.cwd(), projectName) : process.cwd();

      // Check if directory exists and is not empty
      if (fs.existsSync(targetPath)) {
        const files = fs.readdirSync(targetPath);
        if (files.length > 0 && !options.force) {
          console.error('❌ Directory not empty. Use --force to override.');
          process.exit(1);
        }
      } else if (projectName) {
        // Create project directory
        fs.mkdirSync(targetPath, { recursive: true });
        console.log(`✓ Created directory: ${projectName}`);
      }

      // Change to project directory
      process.chdir(targetPath);

      // Run the initialization wizard (aios-init.js)
      const initScript = path.join(__dirname, 'aios-init.js');
      require(initScript);
    } catch (error) {
      console.error('❌ Initialization failed:', error.message);
      process.exit(1);
    }
  });

/**
 * Command: install
 * Installs AIOS in current project with interactive wizard
 */
program
  .command('install')
  .description('Install AIOS-FullStack in current project (interactive wizard)')
  .option('--force', 'Overwrite existing configuration')
  .option('--quiet', 'Minimal output during installation')
  .option('--dry-run', 'Simulate installation without modifying files')
  .action(async (options) => {
    try {
      if (options.dryRun) {
        console.log('🚀 AIOS-FullStack Installation (Dry Run)\n');
        console.log('[DRY RUN] Would execute project initialization wizard');
        console.log('[DRY RUN] Current directory:', process.cwd());
        console.log('[DRY RUN] Options:', options);
        console.log('✓ Dry run completed - no files were modified');
        return;
      }

      console.log('🚀 AIOS-FullStack Installation\n');

      // Execute the initialization wizard (aios-init.js)
      const initScript = path.join(__dirname, 'aios-init.js');

      if (!fs.existsSync(initScript)) {
        console.error('❌ Initialization wizard not found:', initScript);
        console.error('Please ensure AIOS-FullStack is installed correctly.');
        process.exit(1);
      }

      // Run the wizard
      require(initScript);
    } catch (error) {
      console.error('❌ Installation failed:', error.message);
      process.exit(1);
    }
  });

/**
 * Command: setup-mcp
 * Setup 1MCP infrastructure (global installation)
 */
program
  .command('setup-mcp')
  .description('Setup 1MCP infrastructure with MCPs, presets, and API keys (advanced)')
  .option('--force', 'Overwrite existing configuration')
  .action(async (options) => {
    try {
      console.log('🚀 AIOS-FullStack 1MCP Setup\n');
      console.log('This will install 1MCP globally and configure MCPs.\n');

      // Detect platform
      const isWindows = process.platform === 'win32';
      const installScript = isWindows
        ? path.join(__dirname, '..', 'scripts', 'install-aios.cmd')
        : path.join(__dirname, '..', 'scripts', 'install-aios.sh');

      // Check if install script exists
      if (!fs.existsSync(installScript)) {
        console.error('❌ Installation script not found:', installScript);
        console.error('Please ensure AIOS-FullStack is installed correctly.');
        process.exit(1);
      }

      // Execute installation script
      console.log(`📦 Running ${isWindows ? 'Windows' : 'Unix'} installation script...\n`);

      const execOptions = {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..'),
        shell: true
      };

      if (isWindows) {
        execSync(`cmd /c "${installScript}"`, execOptions);
      } else {
        // Make script executable on Unix
        try {
          execSync(`chmod +x "${installScript}"`, { stdio: 'ignore' });
        } catch (err) {
          // Ignore chmod errors (might already be executable)
        }
        execSync(`bash "${installScript}"`, execOptions);
      }

      console.log('\n✅ 1MCP setup complete!');
    } catch (error) {
      if (error.status) {
        // Script exited with error code
        process.exit(error.status);
      }
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  });

/**
 * Command: info
 * Display system information
 */
program
  .command('info')
  .description('Display system information')
  .action(() => {
    console.log('📊 AIOS-FullStack System Information\n');
    console.log(`Version: ${packageJson.version}`);
    console.log(`Platform: ${process.platform}`);
    console.log(`Node.js: ${process.version}`);
    console.log(`Architecture: ${process.arch}`);
    console.log(`Working Directory: ${process.cwd()}`);
    console.log(`Install Location: ${path.join(__dirname, '..')}`);

    // Check if .aios-core exists
    const aiosCoreDir = path.join(__dirname, '..', '.aios-core');
    if (fs.existsSync(aiosCoreDir)) {
      console.log('\n✓ AIOS Core installed');

      // Count components
      const countFiles = (dir) => {
        try {
          return fs.readdirSync(dir).length;
        } catch {
          return 0;
        }
      };

      console.log(`  - Agents: ${countFiles(path.join(aiosCoreDir, 'agents'))}`);
      console.log(`  - Tasks: ${countFiles(path.join(aiosCoreDir, 'tasks'))}`);
      console.log(`  - Templates: ${countFiles(path.join(aiosCoreDir, 'templates'))}`);
      console.log(`  - Workflows: ${countFiles(path.join(aiosCoreDir, 'workflows'))}`);
    } else {
      console.log('\n⚠️  AIOS Core not found');
    }
  });

/**
 * Command: doctor
 * Run system diagnostics
 */
program
  .command('doctor')
  .description('Run system diagnostics and health checks')
  .option('--fix', 'Automatically fix detected issues')
  .action((options) => {
    console.log('🏥 AIOS System Diagnostics\n');

    let hasErrors = false;

    // Check Node.js version
    const nodeVersion = process.version.replace('v', '');
    const requiredNodeVersion = '18.0.0';
    const nodeOk = compareVersions(nodeVersion, requiredNodeVersion) >= 0;

    console.log(`${nodeOk ? '✔' : '✗'} Node.js version: ${process.version} ${nodeOk ? '(meets requirement: >=18.0.0)' : '(requires >=18.0.0)'}`);
    if (!nodeOk) hasErrors = true;

    // Check npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`✔ npm version: ${npmVersion}`);
    } catch {
      console.log('✗ npm not found');
      hasErrors = true;
    }

    // Check git
    try {
      const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
      console.log(`✔ Git installed: ${gitVersion}`);
    } catch {
      console.log('⚠️  Git not found (optional but recommended)');
    }

    // Check GitHub CLI
    try {
      const ghVersion = execSync('gh --version', { encoding: 'utf8' }).split('\n')[0];
      console.log(`✔ GitHub CLI: ${ghVersion}`);
    } catch {
      console.log('⚠️  GitHub CLI not found (optional but recommended for team collaboration)');
    }

    // Check AIOS installation
    const aiosCoreDir = path.join(__dirname, '..', '.aios-core');
    if (fs.existsSync(aiosCoreDir)) {
      console.log(`✔ AIOS-FULLSTACK: v${packageJson.version}`);

      // Check components
      const checkDir = (name, dir) => {
        const fullPath = path.join(aiosCoreDir, dir);
        if (fs.existsSync(fullPath)) {
          const count = fs.readdirSync(fullPath).length;
          console.log(`  ✔ ${name}: ${count} found`);
          return true;
        } else {
          console.log(`  ✗ ${name}: directory not found`);
          hasErrors = true;
          return false;
        }
      };

      console.log('\nConfiguration:');
      checkDir('Agent files', 'agents');
      checkDir('Task files', 'tasks');
      checkDir('Workflow files', 'workflows');
      checkDir('Templates', 'templates');
    } else {
      console.log('✗ AIOS Core not installed');
      console.log('  Run: npx aios-fullstack init');
      hasErrors = true;
    }

    // Check dependencies
    console.log('\nDependencies:');
    const checkDependency = (name) => {
      try {
        require.resolve(name);
        console.log(`✔ ${name}: installed`);
        return true;
      } catch {
        console.log(`✗ ${name}: not installed`);
        hasErrors = true;
        return false;
      }
    };

    checkDependency('@clack/prompts');
    checkDependency('commander');
    checkDependency('inquirer');
    checkDependency('js-yaml');

    // Summary
    console.log('');
    if (hasErrors) {
      console.log('⚠️  Some issues were detected.');
      if (options.fix) {
        console.log('\nAttempting automatic fixes...');
        console.log('⚠️  Auto-fix not yet implemented. Please fix issues manually.');
      }
      process.exit(1);
    } else {
      console.log('✅ All checks passed! Your installation is healthy.');
    }
  });

/**
 * Command: update
 * Update AIOS-FullStack to latest version
 */
program
  .command('update')
  .description('Update AIOS-FullStack to latest version')
  .action(() => {
    console.log('🔄 Updating AIOS-FullStack...\n');

    try {
      // Check if installed globally or locally
      const isGlobal = __dirname.includes('node_modules');

      if (isGlobal) {
        console.log('📦 Updating global installation...');
        execSync('npm install -g aios-fullstack@latest', { stdio: 'inherit' });
      } else {
        console.log('📦 Updating local installation...');
        execSync('npm install aios-fullstack@latest', { stdio: 'inherit' });
      }

      console.log('\n✅ Update complete!');
      console.log('Run: aios-fullstack doctor to verify installation');
    } catch (error) {
      console.error('❌ Update failed:', error.message);
      process.exit(1);
    }
  });

/**
 * Command: uninstall
 * Remove AIOS-FullStack
 */
program
  .command('uninstall')
  .description('Remove AIOS-FullStack (use with caution)')
  .action(() => {
    console.log('⚠️  Uninstalling AIOS-FullStack...\n');

    try {
      const isGlobal = __dirname.includes('node_modules');

      if (isGlobal) {
        console.log('📦 Removing global installation...');
        execSync('npm uninstall -g aios-fullstack', { stdio: 'inherit' });
      } else {
        console.log('📦 Removing local installation...');
        execSync('npm uninstall aios-fullstack', { stdio: 'inherit' });
      }

      console.log('\n✅ AIOS-FullStack has been uninstalled.');
    } catch (error) {
      console.error('❌ Uninstall failed:', error.message);
      process.exit(1);
    }
  });

// Helper: Compare semantic versions
function compareVersions(a, b) {
  const pa = a.split('.').map(n => parseInt(n, 10));
  const pb = b.split('.').map(n => parseInt(n, 10));

  for (let i = 0; i < 3; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

// Parse arguments and execute
program.parse(process.argv);

// Show help if no command specified
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
