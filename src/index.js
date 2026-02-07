#!/usr/bin/env node
/**
 * Mad Sniper - Autonomous Web Task Orchestrator
 * Main entry point
 */

import { parseGoal, validateConstraints } from './utils/parsers.js';
import { createPlanner } from './planner/index.js';
import { createLogger, STATE } from './logger/index.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get file path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const result = {
    goal: null,
    verbose: false,
    dryRun: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--goal':
      case '-g':
        result.goal = args[++i];
        break;
      case '--verbose':
      case '-v':
        result.verbose = true;
        break;
      case '--dry-run':
      case '-d':
        result.dryRun = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return result;
}

/**
 * Print usage help
 */
function printHelp() {
  console.log(`
🎯 Mad Sniper - Autonomous Web Task Orchestrator

Usage: node src/index.js [options]

Options:
  --goal, -g       Natural language goal to execute
  --verbose, -v     Enable verbose output
  --dry-run, -d      Plan without executing
  --help, -h        Show this help message

Examples:
  node src/index.js --goal "Find flights from SFO to JFK under $500"
  node src/index.js --goal "Find cheapest laptop" --verbose
  node src/index.js --goal "Book table at Italian restaurant" --dry-run

Environment Variables:
  OPENAI_API_KEY  Required for LLM planning
  DEBUG             Optional: Enable debug logging

For more information: https://github.com/mememan-anon/mad-sniper-hackathon
  `);
}

/**
 * Main execution flow
 */
async function main() {
  console.log('\n🎯 Mad Sniper - Autonomous Web Task Orchestrator');
  console.log('='.repeat(50));

  // Parse command line arguments
  const args = parseArgs();

  if (!args.goal) {
    console.error('❌ Error: No goal specified');
    console.log('Use --help for usage information\n');
    process.exit(1);
  }

  // Validate API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Error: OPENAI_API_KEY not set');
    console.log('Set it in .env file or export environment variable\n');
    process.exit(1);
  }

  try {
    // Parse goal
    console.log('\n📋 Parsing goal...');
    const goal = parseGoal(args.goal);
    
    if (!validateConstraints(goal)) {
      console.error('❌ Error: Invalid goal constraints');
      console.log('Please check your goal and try again\n');
      process.exit(1);
    }

    console.log('✅ Goal parsed successfully');
    console.log(`   Type: ${goal.type}`);
    console.log(`   Original: ${goal.original}\n`);

    // Initialize logger
    const logger = createLogger();
    const taskId = `task_${Date.now()}`;
    logger.startTask(taskId, goal);

    // Initialize planner
    const planner = createPlanner();

    // Create execution plan
    console.log('🧠 Generating execution plan...\n');
    logger.setState(STATE.PLANNING);
    
    const plan = await planner.createPlan(goal);
    
    if (args.dryRun) {
      console.log('\n📄 DRY RUN - Plan generated:');
      console.log(JSON.stringify(plan, null, 2));
      console.log('\nTo execute: node src/index.js --goal "' + args.goal + '"\n');
      process.exit(0);
    }

    if (args.verbose) {
      console.log('\n📋 Execution Plan:');
      console.log(`   Plan ID: ${plan.plan_id}`);
      console.log(`   Steps: ${plan.total_steps}`);
      console.log(`   Estimated Duration: ${(plan.estimated_duration_ms / 1000).toFixed(2)}s\n`);
    }

    // TODO: Day 2 - Execute the plan
    logger.setState(STATE.EXECUTING);
    console.log('\n⚠️  Executor module not yet implemented (Day 2)');
    console.log('Plan generated successfully, awaiting implementation...\n');
    
    // Finalize logger
    logger.finalize(STATE.COMPLETED);

    process.exit(0);

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Run main function
main().catch(error => {
  console.error('\n💥 Unhandled error:', error);
  process.exit(1);
});
