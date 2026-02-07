/**
 * Goal Parsers - Extract constraints and parameters from natural language goals
 */

/**
 * Parse a natural language goal and extract structured constraints
 * @param {string} goal - The user's natural language goal
 * @returns {Object} Parsed constraints with goal type and parameters
 */
export function parseGoal(goal) {
  const goalLower = goal.toLowerCase();

  // Detect goal type
  const goalType = detectGoalType(goalLower);

  // Extract constraints based on goal type
  const constraints = {
    type: goalType,
    original: goal,
    timestamp: Date.now()
  };

  switch (goalType) {
    case 'flight_search':
      Object.assign(constraints, parseFlightGoal(goal));
      break;
    case 'product_search':
      Object.assign(constraints, parseProductGoal(goal));
      break;
    case 'booking':
      Object.assign(constraints, parseBookingGoal(goal));
      break;
    default:
      // Generic goal - just store the text
      break;
  }

  return constraints;
}

/**
 * Detect the type of goal based on keywords
 * @param {string} goal - Lowercase goal string
 * @returns {string} Goal type
 */
function detectGoalType(goal) {
  if (goal.includes('flight') || goal.includes('fly') || goal.includes('airline')) {
    return 'flight_search';
  }
  if (goal.includes('cheapest') || goal.includes('buy') || goal.includes('price')) {
    return 'product_search';
  }
  if (goal.includes('book') || goal.includes('reserve') || goal.includes('schedule')) {
    return 'booking';
  }
  return 'general';
}

/**
 * Parse flight search constraints from goal
 * @param {string} goal - Flight search goal
 * @returns {Object} Flight constraints
 */
function parseFlightGoal(goal) {
  const constraints = {};

  // Extract origin and destination
  const cities = extractCities(goal);
  if (cities.length >= 1) constraints.origin = cities[0];
  if (cities.length >= 2) constraints.destination = cities[1];

  // Extract price constraint
  const priceMatch = goal.match(/max \$?(\d+)/i);
  if (priceMatch) {
    constraints.maxPrice = parseInt(priceMatch[1]);
  }

  // Extract dates (format: 3/15, March 15, etc.)
  const dates = extractDates(goal);
  if (dates.length >= 1) constraints.departureDate = dates[0];
  if (dates.length >= 2) constraints.returnDate = dates[1];

  // Extract round-trip or one-way
  constraints.tripType = goal.toLowerCase().includes('round-trip') ||
                    goal.toLowerCase().includes('rt') ||
                    goal.toLowerCase().includes('return') ? 'round-trip' : 'one-way';

  return constraints;
}

/**
 * Extract city codes or names from goal
 * @param {string} goal - Goal string
 * @returns {Array<string>} List of cities/airports found
 */
function extractCities(goal) {
  // Common airport codes and city names
  const airportPatterns = [
    /\b(SFO|LAX|JFK|LHR|CDG|NRT|HKG|DXB)\b/g,
    /\b(San Francisco|Los Angeles|New York|London|Paris|Tokyo|Hong Kong|Dubai)\b/gi
  ];

  const cities = [];
  airportPatterns.forEach(pattern => {
    const matches = goal.match(pattern);
    if (matches) {
      cities.push(...matches);
    }
  });

  return [...new Set(cities)]; // Remove duplicates
}

/**
 * Extract dates from goal in various formats
 * @param {string} goal - Goal string
 * @returns {Array<string>} List of dates found
 */
function extractDates(goal) {
  const dates = [];

  // Match formats: 3/15, March 15, 3-15, etc.
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})/g, // 3/15 or 3-15
    /(\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s*(\d{1,2}))/gi, // March 15
  ];

  datePatterns.forEach(pattern => {
    const matches = goal.match(pattern);
    if (matches) {
      dates.push(...matches);
    }
  });

  return [...new Set(dates)];
}

/**
 * Validate parsed constraints
 * @param {Object} constraints - Parsed constraints
 * @returns {boolean} True if valid
 */
export function validateConstraints(constraints) {
  if (!constraints.type) {
    return false;
  }

  if (constraints.type === 'flight_search') {
    if (!constraints.origin || !constraints.destination) {
      return false;
    }
  }

  return true;
}
