/**
 * Task Planner - LLM-based task decomposition
 * Converts natural language goals into executable JSON plans
 */

import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

/**
 * TaskPlanner class - Handles LLM-based plan generation
 */
export class TaskPlanner {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-4.1-mini' // Use OAI-MINI for planning
    });
  }

  /**
   * Create execution plan from natural language goal
   * @param {Object} goal - Parsed goal from utils/parsers.js
   * @returns {Object} Structured execution plan with steps
   */
  async createPlan(goal) {
    console.log('📋 Creating execution plan for:', goal.original);

    const prompt = this.buildPrompt(goal);
    
    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert web automation planner. Break down high-level goals into executable browser automation steps.
            
            Output ONLY valid JSON with this structure:
            {
              "plan_id": "string",
              "goal_summary": "string",
              "steps": [
                {
                  "step_id": number,
                  "action": "web_search|navigate|click|type|wait|extract",
                  "description": "string",
                  "parameters": {
                    "query": "string",
                    "url": "string",
                    "selector": {"role": "string", "name": "string"} | {"text": "string"},
                    "text": "string",
                    "duration": number
                  },
                  "expected_output": "string",
                  "fallback": "string"
                }
              ],
              "total_steps": number,
              "estimated_duration_ms": number
            }

            Actions:
            - web_search: Search web for information
            - navigate: Go to a URL
            - click: Click an element
            - type: Type text into an input field
            - wait: Wait for a specified duration
            - extract: Extract data from the page

            Examples:
            Flight search → navigate to Google Flights, type SFO in origin field, type London in destination field, click search button, extract results
            Product search → web_search for laptops, navigate to top result, filter by price`
          },
          {
            role: 'user',
            content: `Goal: ${goal.original}\nType: ${goal.type}\nConstraints: ${JSON.stringify(goal, null, 2)}\n\nCreate a detailed execution plan with 5-7 steps.`
          }
        ],
        temperature: 0.3, // Lower temperature for more deterministic output
        response_format: { type: "json_object" }
      });

      const plan = this.validatePlan(JSON.parse(response.choices[0].message.content));
      
      console.log(`✅ Plan created with ${plan.steps.length} steps`);
      console.log(`   Estimated duration: ${plan.estimated_duration_ms}ms`);
      
      return plan;

    } catch (error) {
      console.error('❌ Failed to create plan:', error.message);
      throw new Error(`Plan generation failed: ${error.message}`);
    }
  }

  /**
   * Build LLM prompt for plan generation
   * @param {Object} goal - Parsed goal constraints
   * @returns {string} Complete prompt
   */
  buildPrompt(goal) {
    let domainSpecific = '';

    if (goal.type === 'flight_search') {
      domainSpecific = `
Flight Search Domain:
- Origin: ${goal.origin || 'not specified'}
- Destination: ${goal.destination || 'not specified'}
- Departure: ${goal.departureDate || 'not specified'}
- Return: ${goal.returnDate || 'not specified'}
- Max Price: ${goal.maxPrice || 'not specified'}
- Trip Type: ${goal.tripType || 'not specified'}

Recommended steps:
1. Search for "cheap flights ${goal.origin} ${goal.destination} ${goal.departureDate}"
2. Navigate to Google Flights or similar booking site
3. Fill origin field with "${goal.origin || 'YOUR_ORIGIN'}"
4. Fill destination field with "${goal.destination || 'YOUR_DESTINATION'}"
5. Set departure date to "${goal.departureDate || 'YOUR_DEPARTURE_DATE'}"
6. If return date specified, set return date to "${goal.returnDate || ''}"
7. Click search/submit button
8. Wait for results page to load
9. Extract flight prices and details
10. Filter results by max price: ${goal.maxPrice || 'no limit'}
`;
    }

    return `Create an execution plan for this task.${domainSpecific}

Return ONLY JSON, no additional text.`;
  }

  /**
   * Validate and sanitize plan structure
   * @param {Object} plan - Raw plan from LLM
   * @returns {Object} Validated plan
   */
  validatePlan(plan) {
    // Ensure required fields exist
    if (!plan.plan_id || !Array.isArray(plan.steps) || plan.steps.length === 0) {
      throw new Error('Invalid plan: Missing plan_id or steps array');
    }

    // Sanitize each step
    plan.steps = plan.steps.map((step, index) => ({
      step_id: index + 1,
      action: step.action || 'unknown',
      description: step.description || `Step ${index + 1}`,
      parameters: step.parameters || {},
      expected_output: step.expected_output || 'success',
      fallback: step.fallback || 'abort'
    }));

    // Add metadata
    plan.plan_id = plan.plan_id || `plan_${Date.now()}`;
    plan.total_steps = plan.steps.length;
    plan.estimated_duration_ms = plan.estimated_duration_ms || 60000;

    return plan;
  }

  /**
   * Refine plan based on execution feedback
   * @param {Object} plan - Original plan
   * @param {Object} feedback - Execution feedback
   * @returns {Object} Refined plan
   */
  async refinePlan(plan, feedback) {
    console.log('🔄 Refining plan based on feedback:', feedback);

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a web automation planner. Refine execution plans based on feedback.'
          },
          {
            role: 'user',
            content: `Original plan:\n${JSON.stringify(plan, null, 2)}\n\nFeedback:\n${JSON.stringify(feedback, null, 2)}\n\nGenerate a refined plan that addresses the feedback. Return only JSON.`
          }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      return this.validatePlan(JSON.parse(response.choices[0].message.content));

    } catch (error) {
      console.error('❌ Failed to refine plan:', error.message);
      return plan; // Return original plan if refinement fails
    }
  }
}

/**
 * Create a new planner instance
 * @returns {TaskPlanner}
 */
export function createPlanner() {
  return new TaskPlanner();
}
