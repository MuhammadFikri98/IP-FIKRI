// show-coverage.js
const fs = require("fs");
const { execSync } = require("child_process");

/**
 * Extracts coverage summary from test output
 * @param {string} output - Test output containing coverage information
 * @returns {string} - Just the coverage summary section
 */
function extractCoverageSummary(output) {
  // Look for coverage summary section that typically starts with "--------------|---------|----------|---------|---------|-------------------"
  const coverageSummaryMatch = output.match(/(-{10,}\|){1,}[\s\S]+?All files[\s\S]+?(?=\n{2}|$)/i);
  if (coverageSummaryMatch) {
    return coverageSummaryMatch[0];
  }
  return "Coverage summary not found in output";
}

/**
 * Generates a highlighted coverage box that will be displayed at the end
 * @param {string} coverageSummary - The coverage summary text
 * @returns {string} - Formatted coverage box
 */
function formatCoverageSummary(coverageSummary) {
  const lines = coverageSummary.split('\n');
  const boxWidth = 80;
  const result = [];
  
  // Top border
  result.push('╔' + '═'.repeat(boxWidth - 2) + '╗');
  
  // Title
  result.push('║' + ' COVERAGE SUMMARY '.padStart((boxWidth + ' COVERAGE SUMMARY '.length) / 2).padEnd(boxWidth - 2) + '║');
  
  // Separator
  result.push('╠' + '═'.repeat(boxWidth - 2) + '╣');
  
  // Content
  lines.forEach(line => {
    // Highlight percentages with color (only in terminal)
    const highlighted = line.replace(/(\d+\.\d+%|\d+%)/g, match => {
      const percentage = parseFloat(match);
      if (percentage >= 90) {
        return `\x1b[32m${match}\x1b[0m`; // Green for >= 90%
      } else if (percentage >= 80) {
        return `\x1b[33m${match}\x1b[0m`; // Yellow for >= 80%
      } else {
        return `\x1b[31m${match}\x1b[0m`; // Red for < 80%
      }
    });
    
    result.push('║ ' + highlighted.padEnd(boxWidth - 4) + ' ║');
  });
  
  // Bottom border
  result.push('╚' + '═'.repeat(boxWidth - 2) + '╝');
  
  return result.join('\n');
}

/**
 * Main function to show test coverage in a nicer format
 */
async function showCoverage() {
  try {
    let testOutput = '';
    let originalOutput = '';
    let coverageSummary = '';
    
    // Capture original output (without special formatting)
    if (fs.existsSync("test-output.txt")) {
      originalOutput = fs.readFileSync("test-output.txt", "utf8");
      testOutput = originalOutput;
    } else {
      console.log("Test output file not found. Running tests...");
      
      try {
        // Execute tests and capture output
        originalOutput = execSync(
          "npx jest --verbose --detectOpenHandles --runInBand --forceExit --coverage",
          { encoding: "utf8" }
        );
        testOutput = originalOutput;
      } catch (err) {
        // In case of test failures, the output is in err.stdout
        if (err.stdout) {
          originalOutput = err.stdout;
          testOutput = originalOutput;
        }
        console.log("Tests completed with errors");
      }
    }
    
    // Extract coverage from original output
    coverageSummary = extractCoverageSummary(originalOutput);
    
    // Remove any existing coverage summary from the output to prevent duplication
    testOutput = testOutput.replace(/(-{10,}\|){1,}[\s\S]+?All files[\s\S]+?(?=\n{2}|$)/gi, "");
    
    // Print the test output without the coverage part
    console.log(testOutput);
    
    // If we couldn't extract coverage from the output, run Jest again with just the coverage reporter
    if (coverageSummary === "Coverage summary not found in output") {
      try {
        console.log("Generating fresh coverage report...");
        const coverageOutput = execSync(
          'npx jest --coverage --coverageReporters="text-summary" --silent',
          { encoding: "utf8" }
        );
        coverageSummary = coverageOutput.trim();
      } catch (coverageError) {
        console.log("Could not generate separate coverage report");
      }
    }
    
    // Always display the coverage summary at the end in a highlighted box
    console.log("\n\n");
    console.log("====================================================================");
    console.log("                         TEST SUMMARY                               ");
    console.log("====================================================================");
    console.log("\n");
    console.log(formatCoverageSummary(coverageSummary));
    console.log("\n");
  } catch (error) {
    console.error("Error in show-coverage script:", error);
  }
}

// Run the main function
showCoverage();
