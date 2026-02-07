// BuildMyIdea - Winner Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
  const winnerId = window.location.pathname.split('/').pop();
  loadWinner(winnerId);
});

async function loadWinner(id) {
  const container = document.getElementById('winner-content');
  
  try {
    const response = await fetch(`/api/ideas/winner/${id}`);
    const data = await response.json();
    
    if (data.winner) {
      const winner = data.winner;
      const hasDemo = winner.status === 'completed' && winner.demo_url;
      const hasRepo = winner.repo_url;
      
      container.innerHTML = `
        <div class="winner-detail">
          <h1>${escapeHtml(winner.idea?.title || 'Untitled')}</h1>
          <div class="winner-meta">
            <span>👤 Submitted by ${escapeHtml(winner.idea?.user_email || 'Unknown')}</span>
            <span>📅 Selected: ${new Date(winner.selected_at * 1000).toLocaleDateString()}</span>
          </div>
          <div class="winner-description">
            <h2>Description</h2>
            <p>${escapeHtml(winner.idea?.description || 'No description available.')}</p>
          </div>
          ${winner.build_started_at ? `
            <div style="margin-bottom: 2rem;">
              <h2>Build Status</h2>
              <p>
                <strong>Started:</strong> ${new Date(winner.build_started_at * 1000).toLocaleString()}
              </p>
              ${winner.build_completed_at ? `
                <p>
                  <strong>Completed:</strong> ${new Date(winner.build_completed_at * 1000).toLocaleString()}
                </p>
              ` : ''}
            </div>
          ` : ''}
          <div class="winner-actions">
            ${hasDemo ? `<a href="${escapeHtml(winner.demo_url)}" target="_blank" class="btn btn-primary">🌐 View Live Demo</a>` : ''}
            ${hasRepo ? `<a href="${escapeHtml(winner.repo_url)}" target="_blank" class="btn btn-secondary">📦 View Source Code</a>` : ''}
            <a href="/demos" class="btn btn-outline">← All Demos</a>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
          <h1>Winner Not Found</h1>
          <p style="color: var(--gray); margin: 1rem 0;">This winner doesn't exist or has been removed.</p>
          <a href="/demos" class="btn btn-primary">View All Demos</a>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading winner:', error);
    container.innerHTML = `
      <div style="text-align: center; padding: 3rem;">
        <p style="color: var(--danger);">Failed to load winner details. Please try again later.</p>
        <a href="/demos" class="btn btn-primary">View All Demos</a>
      </div>
    `;
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
