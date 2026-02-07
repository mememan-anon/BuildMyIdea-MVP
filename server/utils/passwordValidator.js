/**
 * Password Validator Utility
 * Validates password strength and provides feedback
 */

/**
 * Password validation result
 */
export function validatePassword(password) {
  const errors = [];
  const warnings = [];
  
  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else if (password.length < 12) {
    warnings.push('Consider using a longer password (12+ characters) for better security');
  }
  
  // Uppercase check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Lowercase check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Number check
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Special character check
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Common passwords check (basic list)
  const commonPasswords = ['password', '123456', 'qwerty', 'letmein', 'welcome', 'admin'];
  const lowerPassword = password.toLowerCase();
  if (commonPasswords.some(common => lowerPassword.includes(common))) {
    warnings.push('Password contains common words that may be easy to guess');
  }
  
  // Calculate strength score
  const strength = calculateStrength(password);
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    strength,
    score: strength.score
  };
}

/**
 * Calculate password strength
 */
function calculateStrength(password) {
  let score = 0;
  let label = 'Weak';
  let color = 'red';
  
  // Length contributes to score
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character variety contributes to score
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  
  // Determine label and color based on score
  if (score <= 2) {
    label = 'Weak';
    color = 'red';
  } else if (score <= 4) {
    label = 'Fair';
    color = 'orange';
  } else if (score <= 5) {
    label = 'Good';
    color = 'yellow';
  } else if (score <= 6) {
    label = 'Strong';
    color = 'lightgreen';
  } else {
    label = 'Very Strong';
    color = 'green';
  }
  
  return { score, label, color };
}

/**
 * Check password strength level
 */
export function getPasswordStrength(password) {
  const { score, label, color } = calculateStrength(password);
  
  // 0-2: weak, 3-4: fair, 5: good, 6: strong, 7: very strong
  const level = score <= 2 ? 'weak' : score <= 4 ? 'fair' : score <= 5 ? 'good' : 'strong';
  
  return { score, label, color, level };
}

export default {
  validatePassword,
  calculateStrength,
  getPasswordStrength
};
