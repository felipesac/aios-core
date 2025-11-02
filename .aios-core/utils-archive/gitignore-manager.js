const fs = require('fs');
const path = require('path');

/**
 * Updates .gitignore file based on installation mode
 *
 * @param {string} mode - 'framework-development' or 'project-development'
 * @param {string} projectRoot - Path to project root directory
 */
function updateGitIgnore(mode, projectRoot) {
  const gitignorePath = path.join(projectRoot, '.gitignore');

  let gitignore = '';
  if (fs.existsSync(gitignorePath)) {
    gitignore = fs.readFileSync(gitignorePath, 'utf8');
  }

  if (mode === 'project-development') {
    // Add AIOS framework files to gitignore
    const frameworkRules = [
      '',
      '# AIOS-FullStack Framework Files (auto-managed - do not edit)',
      '.aios-core/',
      'node_modules/@aios/',
      'outputs/minds/',
      '.aios-installation-config.yaml',
      '# End AIOS-FullStack auto-managed section',
      ''
    ];

    // Check if rules already exist
    const hasFrameworkSection = gitignore.includes('# AIOS-FullStack Framework Files');

    if (!hasFrameworkSection) {
      gitignore += frameworkRules.join('\n');
      fs.writeFileSync(gitignorePath, gitignore);
      console.log('✓ Updated .gitignore with AIOS framework rules');
    } else {
      console.log('✓ .gitignore already has AIOS framework rules');
    }
  } else if (mode === 'framework-development') {
    // In framework-development mode, ensure .aios-core/ is NOT in .gitignore
    // Check if rules exist and warn user
    if (gitignore.includes('.aios-core/')) {
      console.log('⚠️  Warning: .aios-core/ found in .gitignore but mode is framework-development');
      console.log('   Framework files should be committed. Consider removing .aios-core/ from .gitignore');
    } else {
      console.log('✓ .gitignore configuration correct for framework-development mode');
    }
  }
}

module.exports = { updateGitIgnore };
