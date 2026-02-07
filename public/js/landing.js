// BuildMyIdea - Landing Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
  loadWinners();
});

async function loadWinners() {
  const container = document.getElementById('winners-grid');
  
  try {
    const response = await fetch('/api/ideas/winners');
    const data = await response.json();
    
    if (data.winners && data.winners.length > 0) {
      container.innerHTML = data.winners.slice(0, 3).map(winner => `
        <div class="winner-card">
          <h3>${escapeHtml(winner.title)}</h3>
          <p>${escapeHtml(winner.description.substring(0, 150))}${winner.description.length > 150 ? '...' : ''}</p>
          <div class="winner-meta">
            <span>👤 ${escapeHtml(winner.user_email)}</span>
            <span>📅 ${new Date(winner.selected_at * 1000).toLocaleDateString()}</span>
          </div>
          <a href="/winner/${winner.id}" class="btn btn-small btn-secondary" style="margin-top: 1rem;">View Details</a>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<p style="text-align: center; color: var(--gray);">No winners yet. Be the first!</p>';
    }
  } catch (error) {
    console.error('Error loading winners:', error);
    container.innerHTML = '<p style="text-align: center; color: var(--danger);">Failed to load winners. Please try again later.</p>';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
