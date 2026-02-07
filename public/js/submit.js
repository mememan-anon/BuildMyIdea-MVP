// BuildMyIdea - Submit Form JavaScript

document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('idea-form');
  const submitBtn = document.getElementById('submit-btn');
  const errorMessage = document.getElementById('error-message');

  // Check for cancelled payment
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('cancelled') === 'true') {
    showError('Payment was cancelled. Please try again.');
  }

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Disable button and show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';
    hideError();

    // Get form data
    const bidAmount = parseInt(document.getElementById('bid-amount').value);
    const isPriority = bidAmount >= 500;
    const isStealth = document.getElementById('stealth').checked;

    const formData = {
      title: document.getElementById('title').value,
      description: document.getElementById('description').value,
      category: document.getElementById('category').value,
      email: document.getElementById('email').value,
      bid_amount: bidAmount,
      is_priority: isPriority,
      is_stealth: isStealth
    };

    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }

    } catch (error) {
      console.error('Error:', error);
      showError(error.message || 'An error occurred. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Idea';
    }
  });

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
  }

  function hideError() {
    errorMessage.style.display = 'none';
  }

  // Update submit button text based on bid amount
  const bidSelect = document.getElementById('bid-amount');
  bidSelect.addEventListener('change', function() {
    const bidAmount = parseInt(this.value);
    if (bidAmount >= 500) {
      submitBtn.textContent = `Submit Idea - $${bidAmount} (Priority)`;
    } else {
      submitBtn.textContent = `Submit Idea - $${bidAmount}`;
    }
  });

  // Character counter for description
  const description = document.getElementById('description');
  const maxLength = 2000;

  description.addEventListener('input', function() {
    const remaining = maxLength - this.value.length;
    const hint = this.parentElement.querySelector('.form-hint');
    if (hint && !hint.textContent.includes('characters')) {
      // Only show character count if it's not the default hint
      return;
    }
    if (hint) {
      hint.textContent = `${remaining} characters remaining`;
      if (remaining < 100) {
        hint.style.color = '#ef4444';
      } else if (remaining < 500) {
        hint.style.color = '#f59e0b';
      } else {
        hint.style.color = 'var(--text-muted)';
      }
    }
  });
});
