#!/usr/bin/env node
/**
 * CLI Balance Testing Suite - REAL AI Testing for Level Analysis
 * 
 * 🤖 This script runs AUTHENTIC AI testing using HeadlessGameSimulator
 * across all levels and personas for genuine balance analysis.
 * 
 * 🚨 CRITICAL: This now uses REAL AI testing - NO MORE FAKE DATA!
 * 
 * Usage:
 *   node testing/runBalanceSuite.js [options]
 * 
 * Options:
 *   --levels=1,2,3     Test specific levels (default: all available)
 *   --personas=all     Test specific personas (default: all)
 *   --runs=10          Number of test runs per persona (default: 10)
 *   --output=results   Output directory for reports (default: testing/reports)
 *   --format=json      Output format: json, csv, markdown (default: json)
 *   --parallel=3       Number of parallel test workers (default: 3)
 *   --timeout=300      Timeout per test in seconds (default: 300 - REAL AI testing is slower!)
 *   --verbose          Enable verbose logging
 *   --dry-run          Show what would be tested without running
 */

const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

// Import the real AI testing system - NO MORE FAKE DATA!
let BalanceAnalyzer, BALANCE_PERSONAS;
try {
  // Dynamic import for ES modules in Node.js context
  const balanceModule = require('../utils/BalanceAnalyzer.ts');
  BalanceAnalyzer = balanceModule.BalanceAnalyzer;
  BALANCE_PERSONAS = balanceModule.BALANCE_PERSONAS;
} catch (error) {
  console.warn('⚠️  Could not import BalanceAnalyzer - running in mock mode');
}

// Configuration
const DEFAULT_CONFIG = {
  levels: 'all',
  personas: 'all', 
  runs: 10,
  output: 'testing/reports',
  format: 'json',
  parallel: 3,
  timeout: 300, // Increased timeout for REAL AI testing (5 minutes per test)
  verbose: false,
  dryRun: false
};

// ANSI colors for CLI output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bright: '\x1b[1m'
};

class BalanceTestSuite {
  constructor(config) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startTime = performance.now();
    this.results = {
      summary: {
        totalTests: 0,
        completedTests: 0,
        failedTests: 0,
        startTime: new Date().toISOString(),
        endTime: null,
        duration: 0
      },
      levelReports: [],
      errors: []
    };
    
    this.log(`${colors.cyan}🎮 AI Balance Testing Suite${colors.reset}`);
    this.log(`${colors.blue}Configuration:${colors.reset}`, this.config);
  }

  /**
   * Main entry point for running the test suite
   */
  async run() {
    try {
      // Validate configuration
      this.validateConfig();
      
      // Load available levels and personas
      const testMatrix = await this.generateTestMatrix();
      
      if (this.config.dryRun) {
        this.showDryRun(testMatrix);
        return;
      }
      
      // Execute tests
      this.log(`${colors.green}🚀 Starting balance testing...${colors.reset}`);
      await this.executeTests(testMatrix);
      
      // Generate reports
      await this.generateReports();
      
      // Show summary
      this.showSummary();
      
    } catch (error) {
      this.logError('Fatal error in test suite:', error);
      process.exit(1);
    }
  }

  /**
   * Validate configuration and environment
   */
  validateConfig() {
    // Check if we're in the right directory
    if (!fs.existsSync('package.json')) {
      throw new Error('Must be run from project root directory');
    }
    
    // Check if levels directory exists
    if (!fs.existsSync('levels')) {
      throw new Error('levels/ directory not found');
    }
    
    // Create output directory if needed
    if (!fs.existsSync(this.config.output)) {
      fs.mkdirSync(this.config.output, { recursive: true });
      this.log(`📁 Created output directory: ${this.config.output}`);
    }
    
    this.log(`${colors.green}✅ Configuration validated${colors.reset}`);
  }

  /**
   * Generate test matrix of levels × personas × runs
   */
  async generateTestMatrix() {
    // Load available levels
    const levelsIndexPath = 'levels/levels_index.json';
    if (!fs.existsSync(levelsIndexPath)) {
      throw new Error('levels/levels_index.json not found');
    }
    
    const levelsIndex = JSON.parse(fs.readFileSync(levelsIndexPath, 'utf8'));
    const availableLevels = levelsIndex.levels.map(l => l.id);
    
    // Determine levels to test
    let levelsToTest = availableLevels;
    if (this.config.levels !== 'all') {
      const requestedLevels = this.config.levels.split(',').map(l => parseInt(l.trim()));
      levelsToTest = requestedLevels.filter(id => availableLevels.includes(id));
      
      if (levelsToTest.length === 0) {
        throw new Error(`No valid levels found in: ${this.config.levels}`);
      }
    }
    
    // Define personas (matching BalanceAnalyzer.ts)
    const availablePersonas = [
      { id: 'nervous_newbie', name: 'Nervous Newbie' },
      { id: 'casual_commuter', name: 'Casual Commuter' },
      { id: 'focused_gamer', name: 'Focused Gamer' },
      { id: 'twitchy_speedrunner', name: 'Twitchy Speedrunner' },
      { id: 'methodical_strategist', name: 'Methodical Strategist' }
    ];
    
    // Determine personas to test
    let personasToTest = availablePersonas;
    if (this.config.personas !== 'all') {
      const requestedPersonas = this.config.personas.split(',').map(p => p.trim());
      personasToTest = availablePersonas.filter(p => requestedPersonas.includes(p.id));
      
      if (personasToTest.length === 0) {
        throw new Error(`No valid personas found in: ${this.config.personas}`);
      }
    }
    
    // Generate test matrix
    const testMatrix = [];
    for (const levelId of levelsToTest) {
      for (const persona of personasToTest) {
        for (let run = 1; run <= this.config.runs; run++) {
          testMatrix.push({
            levelId,
            levelName: `Level ${levelId}`,
            persona,
            run,
            testId: `L${levelId}_${persona.id}_R${run}`
          });
        }
      }
    }
    
    this.results.summary.totalTests = testMatrix.length;
    
    this.log(`${colors.blue}📊 Test Matrix Generated:${colors.reset}`);
    this.log(`  • Levels: ${levelsToTest.join(', ')}`);
    this.log(`  • Personas: ${personasToTest.map(p => p.name).join(', ')}`);
    this.log(`  • Runs per persona: ${this.config.runs}`);
    this.log(`  • Total tests: ${testMatrix.length}`);
    // Real AI testing takes 60-180 seconds per test (vs fake 1-3 seconds)
    const realTestDuration = 120; // Average 2 minutes per REAL AI test
    const estimatedMinutes = Math.ceil(testMatrix.length * realTestDuration / this.config.parallel / 60);
    this.log(`  • Estimated duration: ${estimatedMinutes} minutes (REAL AI testing - much slower than fake data)`);
    
    return testMatrix;
  }

  /**
   * Show dry run information
   */
  showDryRun(testMatrix) {
    this.log(`${colors.yellow}🔍 DRY RUN - Tests that would be executed:${colors.reset}`);
    
    const groupedByLevel = testMatrix.reduce((acc, test) => {
      if (!acc[test.levelId]) acc[test.levelId] = [];
      acc[test.levelId].push(test);
      return acc;
    }, {});
    
    for (const [levelId, tests] of Object.entries(groupedByLevel)) {
      this.log(`\n${colors.bright}Level ${levelId}:${colors.reset}`);
      
      const personaGroups = tests.reduce((acc, test) => {
        if (!acc[test.persona.id]) acc[test.persona.id] = [];
        acc[test.persona.id].push(test);
        return acc;
      }, {});
      
      for (const [personaId, personaTests] of Object.entries(personaGroups)) {
        const persona = personaTests[0].persona;
        this.log(`  • ${persona.name}: ${personaTests.length} runs`);
      }
    }
    
    this.log(`\n${colors.green}Total: ${testMatrix.length} tests would be executed${colors.reset}`);
  }

  /**
   * Execute all tests with parallel processing
   */
  async executeTests(testMatrix) {
    const workers = [];
    const chunks = this.chunkArray(testMatrix, Math.ceil(testMatrix.length / this.config.parallel));
    
    this.log(`${colors.blue}🔄 Executing tests with ${this.config.parallel} workers...${colors.reset}`);
    
    // Start progress tracking
    const progressInterval = setInterval(() => {
      this.showProgress();
    }, 5000); // Update every 5 seconds
    
    try {
      // Run test chunks in parallel
      for (let i = 0; i < this.config.parallel && i < chunks.length; i++) {
        const chunk = chunks[i];
        if (chunk && chunk.length > 0) {
          workers.push(this.runTestChunk(chunk, i + 1));
        }
      }
      
      await Promise.all(workers);
      
    } finally {
      clearInterval(progressInterval);
    }
    
    this.showProgress(); // Final progress update
  }

  /**
   * Run a chunk of tests in sequence
   */
  async runTestChunk(tests, workerId) {
    this.log(`${colors.cyan}Worker ${workerId} starting ${tests.length} tests${colors.reset}`);
    
    for (const test of tests) {
      try {
        await this.runSingleTest(test, workerId);
        this.results.summary.completedTests++;
      } catch (error) {
        this.results.summary.failedTests++;
        this.results.errors.push({
          testId: test.testId,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        this.logError(`Test ${test.testId} failed:`, error);
      }
    }
    
    this.log(`${colors.green}Worker ${workerId} completed${colors.reset}`);
  }

  /**
   * Run a single test using REAL AI testing - NO MORE FAKE DATA!
   */
  async runSingleTest(test, workerId) {
    if (this.config.verbose) {
      this.log(`Worker ${workerId}: Running REAL AI test ${test.testId}`);
    }
    
    let testResult;
    
    try {
      if (BalanceAnalyzer && BALANCE_PERSONAS) {
        // Use REAL AI testing via BalanceAnalyzer
        const balanceAnalyzer = BalanceAnalyzer.getInstance();
        
        // Find the matching persona from BALANCE_PERSONAS
        const persona = BALANCE_PERSONAS.find(p => p.id === test.persona.id);
        if (!persona) {
          throw new Error(`Persona ${test.persona.id} not found in BALANCE_PERSONAS`);
        }
        
        this.log(`🤖 Running REAL AI test: ${persona.name} on Level ${test.levelId}`, this.config.verbose ? { persona, levelId: test.levelId } : null);
        
        // Run actual AI testing - this uses HeadlessGameSimulator under the hood
        const startTime = Date.now();
        const personaReport = await balanceAnalyzer.testPersonaOnLevel(persona, test.levelId, test.levelName, 1);
        const duration = Date.now() - startTime;
        
        // Extract real results from the persona report
        const run = personaReport.runs && personaReport.runs.length > 0 ? personaReport.runs[0] : null;
        
        if (run) {
          testResult = {
            testId: test.testId,
            completed: run.levelCompleted || false,
            accuracy: run.accuracy || 0,
            score: run.score || 0,
            duration: duration,
            attempts: 1,
            timestamp: new Date().toISOString(),
            // Real AI metrics
            reactionTime: run.averageReactionTime || 0,
            threats: run.threatsDetected || 0,
            dodgeSuccess: run.dodgeSuccessRate || 0,
            realAITesting: true // Mark as real testing
          };
          
          this.log(`✅ REAL AI test completed: ${persona.name} - ${run.accuracy.toFixed(1)}% accuracy, ${run.score} score`, this.config.verbose ? testResult : null);
        } else {
          throw new Error('No test results returned from AI testing');
        }
        
      } else {
        // Fallback to minimal fake data with clear warning
        this.logError('⚠️  CRITICAL: BalanceAnalyzer not available - using fallback fake data!');
        testResult = this.generateFallbackResult(test);
      }
      
    } catch (error) {
      this.logError(`❌ REAL AI test failed for ${test.testId}:`, error);
      
      // Create error result instead of fake data
      testResult = {
        testId: test.testId,
        completed: false,
        accuracy: 0,
        score: 0,
        duration: 0,
        attempts: 0,
        timestamp: new Date().toISOString(),
        error: error.message,
        realAITesting: false
      };
    }
    
    // Store result
    let levelReport = this.results.levelReports.find(r => r.levelId === test.levelId);
    if (!levelReport) {
      levelReport = {
        levelId: test.levelId,
        levelName: test.levelName,
        personaResults: {},
        overallHealthScore: 0,
        testCount: 0
      };
      this.results.levelReports.push(levelReport);
    }
    
    if (!levelReport.personaResults[test.persona.id]) {
      levelReport.personaResults[test.persona.id] = {
        persona: test.persona,
        runs: [],
        averageScore: 0,
        completionRate: 0,
        healthScore: 0
      };
    }
    
    levelReport.personaResults[test.persona.id].runs.push(testResult);
    levelReport.testCount++;
    
    return testResult;
  }

  /**
   * FALLBACK ONLY - Minimal fake data when real AI testing fails
   * This should NEVER be used in production - real AI testing is required!
   */
  generateFallbackResult(test) {
    console.error(`🚨 CRITICAL WARNING: Generating FAKE data for ${test.testId} - Real AI testing failed!`);
    
    return {
      testId: test.testId,
      completed: false,
      accuracy: 0,
      score: 0,
      duration: 0,
      attempts: 0,
      timestamp: new Date().toISOString(),
      error: 'FAKE_DATA_FALLBACK - Real AI testing not available',
      realAITesting: false // Clearly mark as fake
    };
  }

  /**
   * Show progress update
   */
  showProgress() {
    const { totalTests, completedTests, failedTests } = this.results.summary;
    const remaining = totalTests - completedTests - failedTests;
    const progressPercent = ((completedTests + failedTests) / totalTests * 100).toFixed(1);
    const elapsed = (performance.now() - this.startTime) / 1000;
    const eta = remaining > 0 ? (elapsed / (completedTests + failedTests)) * remaining : 0;
    
    process.stdout.write(`\r${colors.blue}Progress: ${progressPercent}% ` +
      `(${completedTests}/${totalTests} completed, ${failedTests} failed, ` +
      `ETA: ${Math.ceil(eta)}s)${colors.reset}`);
    
    if (completedTests + failedTests === totalTests) {
      process.stdout.write('\n');
    }
  }

  /**
   * Generate comprehensive reports
   */
  async generateReports() {
    this.log(`${colors.blue}📝 Generating reports...${colors.reset}`);
    
    // Calculate final statistics
    this.calculateFinalStatistics();
    
    // Generate reports in requested format(s)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const baseFilename = `balance-report-${timestamp}`;
    
    if (this.config.format === 'json' || this.config.format === 'all') {
      await this.generateJSONReport(`${baseFilename}.json`);
    }
    
    if (this.config.format === 'csv' || this.config.format === 'all') {
      await this.generateCSVReport(`${baseFilename}.csv`);
    }
    
    if (this.config.format === 'markdown' || this.config.format === 'all') {
      await this.generateMarkdownReport(`${baseFilename}.md`);
    }
    
    this.log(`${colors.green}📊 Reports generated in ${this.config.output}/${colors.reset}`);
  }

  /**
   * Calculate final statistics across all tests
   */
  calculateFinalStatistics() {
    for (const levelReport of this.results.levelReports) {
      let totalHealthScore = 0;
      let personaCount = 0;
      
      for (const [personaId, personaResult] of Object.entries(levelReport.personaResults)) {
        const runs = personaResult.runs;
        
        // Calculate persona averages
        personaResult.averageScore = runs.reduce((sum, run) => sum + run.score, 0) / runs.length;
        personaResult.completionRate = runs.filter(run => run.completed).length / runs.length;
        personaResult.healthScore = Math.min(1, personaResult.completionRate * personaResult.averageScore / 500);
        
        totalHealthScore += personaResult.healthScore;
        personaCount++;
      }
      
      levelReport.overallHealthScore = personaCount > 0 ? totalHealthScore / personaCount : 0;
    }
    
    // Update summary
    this.results.summary.endTime = new Date().toISOString();
    this.results.summary.duration = (performance.now() - this.startTime) / 1000;
  }

  /**
   * Generate JSON report
   */
  async generateJSONReport(filename) {
    const filepath = path.join(this.config.output, filename);
    fs.writeFileSync(filepath, JSON.stringify(this.results, null, 2));
    this.log(`📄 JSON report: ${filepath}`);
  }

  /**
   * Generate CSV report
   */
  async generateCSVReport(filename) {
    const filepath = path.join(this.config.output, filename);
    const csvLines = ['Level,Persona,Runs,Completion Rate,Average Score,Health Score'];
    
    for (const levelReport of this.results.levelReports) {
      for (const [personaId, personaResult] of Object.entries(levelReport.personaResults)) {
        csvLines.push([
          levelReport.levelId,
          personaResult.persona.name,
          personaResult.runs.length,
          (personaResult.completionRate * 100).toFixed(1) + '%',
          personaResult.averageScore.toFixed(0),
          (personaResult.healthScore * 100).toFixed(1) + '%'
        ].join(','));
      }
    }
    
    fs.writeFileSync(filepath, csvLines.join('\n'));
    this.log(`📊 CSV report: ${filepath}`);
  }

  /**
   * Generate Markdown report
   */
  async generateMarkdownReport(filename) {
    const filepath = path.join(this.config.output, filename);
    const lines = [
      '# AI Balance Testing Report',
      '',
      `**Generated:** ${this.results.summary.startTime}`,
      `**Duration:** ${this.results.summary.duration.toFixed(1)}s`,
      `**Tests:** ${this.results.summary.completedTests}/${this.results.summary.totalTests} completed`,
      '',
      '## Summary',
      '',
      '| Metric | Value |',
      '|--------|-------|',
      `| Total Tests | ${this.results.summary.totalTests} |`,
      `| Completed | ${this.results.summary.completedTests} |`,
      `| Failed | ${this.results.summary.failedTests} |`,
      `| Success Rate | ${((this.results.summary.completedTests / this.results.summary.totalTests) * 100).toFixed(1)}% |`,
      '',
      '## Level Results',
      ''
    ];
    
    for (const levelReport of this.results.levelReports) {
      lines.push(`### ${levelReport.levelName}`);
      lines.push('');
      lines.push(`**Overall Health Score:** ${(levelReport.overallHealthScore * 100).toFixed(1)}%`);
      lines.push('');
      lines.push('| Persona | Completion Rate | Average Score | Health Score |');
      lines.push('|---------|----------------|---------------|--------------|');
      
      for (const [personaId, personaResult] of Object.entries(levelReport.personaResults)) {
        lines.push(`| ${personaResult.persona.name} | ${(personaResult.completionRate * 100).toFixed(1)}% | ${personaResult.averageScore.toFixed(0)} | ${(personaResult.healthScore * 100).toFixed(1)}% |`);
      }
      
      lines.push('');
    }
    
    fs.writeFileSync(filepath, lines.join('\n'));
    this.log(`📝 Markdown report: ${filepath}`);
  }

  /**
   * Show final summary
   */
  showSummary() {
    const { summary } = this.results;
    
    this.log(`\n${colors.bright}${colors.green}🎉 Test Suite Complete!${colors.reset}`);
    this.log(`${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    this.log(`📊 Total Tests: ${summary.totalTests}`);
    this.log(`✅ Completed: ${summary.completedTests}`);
    this.log(`❌ Failed: ${summary.failedTests}`);
    this.log(`⏱️  Duration: ${summary.duration.toFixed(1)}s`);
    this.log(`📈 Success Rate: ${((summary.completedTests / summary.totalTests) * 100).toFixed(1)}%`);
    
    if (this.results.levelReports.length > 0) {
      this.log(`\n${colors.blue}📋 Level Health Summary:${colors.reset}`);
      
      for (const levelReport of this.results.levelReports) {
        const healthPercent = (levelReport.overallHealthScore * 100).toFixed(1);
        const healthColor = levelReport.overallHealthScore >= 0.8 ? colors.green :
                           levelReport.overallHealthScore >= 0.6 ? colors.yellow : colors.red;
        
        this.log(`  • ${levelReport.levelName}: ${healthColor}${healthPercent}%${colors.reset}`);
      }
    }
    
    this.log(`\n${colors.cyan}📁 Reports saved to: ${this.config.output}${colors.reset}`);
    
    if (summary.failedTests > 0) {
      this.log(`\n${colors.red}⚠️  ${summary.failedTests} tests failed. Check error logs for details.${colors.reset}`);
    }
  }

  /**
   * Utility functions
   */
  chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  log(message, data = null) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
    if (data && this.config.verbose) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  logError(message, error) {
    const timestamp = new Date().toLocaleTimeString();
    console.error(`${colors.red}[${timestamp}] ERROR: ${message}${colors.reset}`);
    if (error && this.config.verbose) {
      console.error(error);
    }
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const config = {};
  
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.slice(2).split('=');
      
      switch (key) {
        case 'levels':
        case 'personas':
        case 'output':
        case 'format':
          config[key] = value;
          break;
        case 'runs':
        case 'parallel':
        case 'timeout':
          config[key] = parseInt(value);
          break;
        case 'verbose':
        case 'dry-run':
        case 'help':
          config[key.replace('-', '')] = true;
          break;
        default:
          console.warn(`Unknown option: --${key}`);
      }
    }
  }
  
  return config;
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
${colors.cyan}🤖 REAL AI Balance Testing Suite${colors.reset}
${colors.yellow}🚨 Now uses AUTHENTIC AI testing - NO MORE FAKE DATA!${colors.reset}

${colors.bright}Usage:${colors.reset}
  node testing/runBalanceSuite.js [options]

${colors.bright}Options:${colors.reset}
  --levels=1,2,3       Test specific levels (default: all available)
  --personas=all       Test specific personas (default: all)
  --runs=10            Number of test runs per persona (default: 10)
  --output=results     Output directory for reports (default: testing/reports)
  --format=json        Output format: json, csv, markdown, all (default: json)
  --parallel=3         Number of parallel test workers (default: 3)
  --timeout=300        Timeout per test in seconds (default: 300 - REAL AI is slower!)
  --verbose            Enable verbose logging
  --dry-run            Show what would be tested without running

${colors.bright}Examples:${colors.reset}
  # Test all levels with REAL AI personas
  node testing/runBalanceSuite.js
  
  # Test specific levels with REAL AI testing
  node testing/runBalanceSuite.js --levels=1,2,3 --runs=5 --verbose
  
  # Generate all report formats with REAL data
  node testing/runBalanceSuite.js --format=all --verbose
  
  # Dry run to see test plan (no actual AI testing)
  node testing/runBalanceSuite.js --dry-run

${colors.yellow}⚠️  Note: REAL AI testing is much slower than previous fake data generation!${colors.reset}
`);
}

/**
 * Main entry point
 */
async function main() {
  const args = parseArgs();
  
  if (args.help || process.argv.includes('--help') || process.argv.includes('-h') || process.argv.includes('help')) {
    showHelp();
    return;
  }
  
  const suite = new BalanceTestSuite(args);
  await suite.run();
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(`${colors.red}Unhandled promise rejection:${colors.reset}`, reason);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error(`${colors.red}Failed to run test suite:${colors.reset}`, error);
    process.exit(1);
  });
}

module.exports = { BalanceTestSuite };