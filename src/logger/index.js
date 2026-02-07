/**
 * Execution Logger - Track task execution progress and trace
 */

/**
 * Execution states
 */
export const STATE = {
  PLANNING: 'planning',
  EXECUTING: 'executing',
  RECOVERING: 'recovering',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

/**
 * ExecutionLogger class - Tracks execution state, steps, and results
 */
export class ExecutionLogger {
  constructor() {
    this.trace = {
      task_id: null,
      goal: null,
      start_time: null,
      end_time: null,
      state: STATE.PLANNING,
      steps: [],
      errors: []
    };
  }

  /**
   * Start a new task
   * @param {string} taskId - Unique task identifier
   * @param {Object} goal - Task goal
   */
  startTask(taskId, goal) {
    this.trace.task_id = taskId;
    this.trace.goal = goal;
    this.trace.start_time = Date.now();
    this.trace.state = STATE.PLANNING;
    
    console.log('🎯 Task started:', taskId);
    console.log('   Goal:', goal.original || goal);
  }

  /**
   * Set execution state
   * @param {string} newState - New state from STATE enum
   */
  setState(newState) {
    this.trace.state = newState;
    console.log(`📊 State: ${newState}`);
  }

  /**
   * Log a step execution
   * @param {Object} step - Step being executed
   * @param {Object} result - Step result
   * @param {string} status - Step status (success, failed, skipped)
   */
  logStep(step, result, status = 'unknown') {
    const logEntry = {
      step_id: step.step_id,
      action: step.action,
      description: step.description,
      status: status,
      duration_ms: result.duration || 0,
      output: result.output || null,
      error: result.error || null,
      timestamp: Date.now()
    };

    this.trace.steps.push(logEntry);
    
    // Console output
    const emoji = status === 'success' ? '✅' : status === 'failed' ? '❌' : '⏳';
    console.log(`${emoji} Step ${step.step_id}: ${step.description}`);
    console.log(`   Action: ${step.action}`);
    if (result.output) {
      console.log(`   Output: ${JSON.stringify(result.output, null, 2)}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  }

  /**
   * Log an error
   * @param {Error} error - Error object
   * @param {Object} context - Context where error occurred
   */
  logError(error, context = {}) {
    const errorEntry = {
      error: error.message,
      stack: error.stack,
      context: context,
      timestamp: Date.now()
    };

    this.trace.errors.push(errorEntry);
    console.error('❌ Error:', error.message);
    if (Object.keys(context).length > 0) {
      console.error('   Context:', JSON.stringify(context, null, 2));
    }
  }

  /**
   * Get complete execution trace
   * @returns {Object} Full trace object
   */
  getTrace() {
    // Add end time if not set
    if (!this.trace.end_time) {
      this.trace.end_time = Date.now();
    }
    
    // Calculate total duration
    this.trace.total_duration_ms = this.trace.end_time - this.trace.start_time;
    
    return this.trace;
  }

  /**
   * Get summary statistics
   * @returns {Object} Execution summary
   */
  getSummary() {
    const trace = this.getTrace();
    
    const successfulSteps = trace.steps.filter(s => s.status === 'success').length;
    const failedSteps = trace.steps.filter(s => s.status === 'failed').length;
    
    return {
      task_id: trace.task_id,
      total_steps: trace.steps.length,
      successful_steps: successfulSteps,
      failed_steps: failedSteps,
      total_duration_ms: trace.total_duration_ms,
      state: trace.state,
      error_count: trace.errors.length
    };
  }

  /**
   * Format trace for display
   * @returns {string} Formatted trace string
   */
  formatTrace() {
    const trace = this.getTrace();
    const summary = this.getSummary();
    
    let output = '\n' + '='.repeat(60);
    output += '\n📋 EXECUTION TRACE';
    output += '\n' + '='.repeat(60);
    output += `\nTask ID: ${trace.task_id}`;
    output += `\nGoal: ${JSON.stringify(trace.goal, null, 2)}`;
    output += `\nState: ${trace.state}`;
    output += `\nTotal Duration: ${(trace.total_duration_ms / 1000).toFixed(2)}s`;
    output += '\n\nSteps:';
    
    trace.steps.forEach((step, i) => {
      const emoji = step.status === 'success' ? '✅' : step.status === 'failed' ? '❌' : '⏳';
      output += `\n\n${emoji} Step ${i + 1}: ${step.description}`;
      output += `\n   Action: ${step.action}`;
      output += `\n   Status: ${step.status}`;
      output += `\n   Duration: ${step.duration_ms}ms`;
      if (step.output) {
        output += `\n   Output: ${JSON.stringify(step.output, null, 2)}`;
      }
      if (step.error) {
        output += `\n   Error: ${step.error}`;
      }
    });
    
    output += '\n\n' + '='.repeat(60);
    output += '\n📊 SUMMARY';
    output += '\n' + '='.repeat(60);
    output += `\nTotal Steps: ${summary.total_steps}`;
    output += `\nSuccessful: ${summary.successful_steps}`;
    output += `\nFailed: ${summary.failed_steps}`;
    output += `\nErrors: ${summary.error_count}`;
    output += '\n' + '='.repeat(60);
    
    return output;
  }

  /**
   * Finalize task
   * @param {string} finalState - Final state from STATE enum
   */
  finalize(finalState = STATE.COMPLETED) {
    this.trace.end_time = Date.now();
    this.trace.state = finalState;
    
    console.log('\n' + this.formatTrace());
  }
}

/**
 * Create a new logger instance
 * @returns {ExecutionLogger}
 */
export function createLogger() {
  return new ExecutionLogger();
}
