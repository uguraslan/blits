const fs = require('fs');

/**
 * Analyzes test results and prepares output files for GitHub Actions
 * @param {Object} core - GitHub Actions core library
 * @returns {Object} Test analysis results
 */
module.exports = async function analyzeTests(core) {
  const timestamp = new Date().toISOString();
  const results = {
    timestamp,
    summary: '',
    testsFailed: false,
    error: null
  };

  // Check if test report exists and has content
  if (!fs.existsSync('test-report.txt') || !fs.statSync('test-report.txt').size) {
    results.summary = 'Test execution error: No test output generated.';
    results.testsFailed = true;
    return outputResults(core, results);
  }

  // Read test report
  const testOutput = fs.readFileSync('test-report.txt', 'utf8');

  // Check for errors and test results
  const hasError = testOutput.includes('Error');
  const testSummaryMatch = testOutput.match(/passed:\s*(\d+)\s*failed:\s*(\d+)\s*of\s*(\d+)\s*tests/);

  if (hasError && (!testSummaryMatch || testSummaryMatch[3] === '0')) {
    // Error with no tests or zero tests
    results.summary = 'Test execution encountered errors. No tests were run.';
    results.testsFailed = true;
    results.error = testOutput;
  } else if (testSummaryMatch) {
    // We have a test summary
    const passed = parseInt(testSummaryMatch[1]);
    const failed = parseInt(testSummaryMatch[2]);
    const total = parseInt(testSummaryMatch[3]);

    results.summary = testSummaryMatch[0];

    if (failed > 0 || total === 0) {
      results.testsFailed = true;

      if (total === 0) {
        results.summary = 'No tests were found to run. This is considered a failure.';
      }
    }
  } else {
    // No test summary found
    results.summary = 'Test execution produced no valid test summary';
    results.testsFailed = true;
    results.error = testOutput;
  }

  return outputResults(core, results);
};

/**
 * Outputs results to GitHub Actions and saves result files
 * @param {Object} core - GitHub Actions core library
 * @param {Object} results - Analysis results
 * @returns {Object} The results object
 */
function outputResults(core, results) {
  // Output findings to GitHub Actions
  core.setOutput('timestamp', results.timestamp);
  core.setOutput('summary', results.summary);
  core.setOutput('tests_failed', results.testsFailed.toString());

  if (results.error) {
    core.setOutput('error', results.error);
  }

  // Create test results directory and files
  try {
    fs.mkdirSync('./test-results', { recursive: true });

    // Write results files
    fs.writeFileSync('./test-results/timestamp.txt', results.timestamp);
    fs.writeFileSync('./test-results/summary.txt', results.summary);
    fs.writeFileSync('./test-results/failed.txt', results.testsFailed.toString());

    // Save error output if it exists
    if (results.error) {
      fs.writeFileSync('./test-results/error.txt', results.error);
    }
  } catch (err) {
    console.error('Error saving test results:', err);
    core.warning(`Error saving test results: ${err.message}`);
  }

  return results;
}