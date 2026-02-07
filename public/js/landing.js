// BuildMyIdea - Landing Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
  startCountdown();
  loadQueue();
  loadWinners();
});

/**
 * Start countdown timer to 10PM CST
 */
function startCountdown() {
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');

  if (!hoursEl || !minutesEl || !secondsEl) return;

  function updateCountdown() {
    // Get current time
    const now = new Date();

    // Get 10PM CST for today
    const cst = 'America/Chicago';
    const selectionTime = new Date(now.toLocaleString('en-US', { timeZone: cst }));
    selectionTime.setHours(22, 0, 0, 0); // 10 PM

    // If 10PM CST has passed today, set to tomorrow
    const currentCstTime = new Date(now.toLocaleString('en-US', { timeZone: cst }));
    if (currentCstTime >= selectionTime) {
      selectionTime.setDate(selectionTime.getDate() + 1);
    }

    // Calculate difference
    const diff = selectionTime - currentCstTime;

    if (diff <= 0) {
      hoursEl.textContent = '00';
      minutesEl.textContent = '00';
      secondsEl.textContent = '00';
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    hoursEl.textContent = hours.toString().padStart(2, '0');
    minutesEl.textContent = minutes.toString().padStart(2, '0');
    secondsEl.textContent = seconds.toString().padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

/**
 * Load queue display
 */
async function loadQueue() {
  const container = document.getElementById('queue-list');

  if (!container) return;

  try {
    // Get paid ideas that aren't winners or queued yet
    const response = await fetch('/api/ideas');
    const data = await response.json();

    const queueIdeas = data.ideas.filter(idea => 
      (idea.status === 'paid' || idea.status === 'pending') && 
      !data.ideas.some(w => w.idea_id === idea.id)
    ).slice(0, 5); // Show top 5

    if (queueIdeas.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted);">Queue is empty. Be the first to submit!</p>';
    } else {
      container.innerHTML = queueIdeas.map(idea => `
        <div class="queue-item">
          <div>
            <div class="queue-item-title">${escapeHtml(idea.title)}</div>
            <div class="queue-item-meta">
              Submitted ${timeAgo(idea.created_at)}
            </div>
          </div>
          <div class="queue-item-bid">$1</div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading queue:', error);
    container.innerHTML = '<p style="color: var(--text-muted);">Failed to load queue.</p>';
  }
}

/**
 * Load winners for demos section
 */
async function loadWinners() {
  const container = document.getElementById('winners-grid');

  if (!container) return;

  try {
    const response = await fetch('/api/ideas/winners');
    const data = await response.json();

    if (data.winners && data.winners.length > 0) {
      container.innerHTML = data.winners.slice(0, 3).map(winner => `
        <div class="winner-card">
          <h3>${escapeHtml(winner.title)}</h3>
          <p>${escapeHtml(winner.description.substring(0, 150))}${winner.description.length > 150 ? '...' : ''}</p>
          <div class="winner-meta">
            <span>👤 ${escapeHtml(winner.user_email.split('@')[0])}***</span>
            <span>📅 ${new Date(winner.selected_at * 1000).toLocaleDateString()}</span>
            ${winner.status === 'completed' ? '<span style="color: var(--accent-primary);">✓ Built</span>' : ''}
          </div>
          <a href="/winner/${winner.id}" class="btn btn-small btn-secondary" style="margin-top: 1rem; display: inline-block;">View Details</a>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1 / -1;">No winners yet. Be the first!</p>';
    }
  } catch (error) {
    console.error('Error loading winners:', error);
    container.innerHTML = '<p style="text-align: center; color: var(--text-muted); grid-column: 1 / -1;">Failed to load winners.</p>';
  }
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Format time ago
 */
function timeAgo(timestamp) {
  const seconds = Math.floor(Date.now() / 1000) - timestamp;
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };

  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }

  return 'Just now';
}
