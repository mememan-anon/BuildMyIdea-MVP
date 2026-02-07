// BuildMyIdea - Demos Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
  loadDemos();
});

async function loadDemos() {
  const container = document.getElementById('demos-grid');
  
  try {
    const response = await fetch('/api/ideas/winners');
    const data = await response.json();
    
    if (data.winners && data.winners.length > 0) {
      container.innerHTML = data.winners.map(winner => createDemoCard(winner)).join('');
    } else {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem;">
          <div style="font-size: 4rem; margin-bottom: 1rem;">🚧</div>
          <h2>No Demos Yet</h2>
          <p style="color: var(--gray); margin: 1rem 0;">Be the first to have your idea built!</p>
          <a href="/submit" class="btn btn-primary">Submit Your Idea</a>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading demos:', error);
    container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--danger);">Failed to load demos. Please try again later.</p>';
  }
}

function createDemoCard(winner) {
  const hasDemo = winner.status === 'completed' && winner.demo_url;
  const hasRepo = winner.repo_url;
  const statusClass = winner.status === 'completed' ? 'status-completed' : 'status-building';
  const statusText = winner.status === 'completed' ? '✓ Built' : '🔨 Building...';
  
  return `
    <div class="demo-card">
      <h3>${escapeHtml(winner.title)}</h3>
      <span class="demo-status ${statusClass}">${statusText}</span>
      <p style="color: var(--gray); margin-bottom: 1rem;">${escapeHtml(winner.description.substring(0, 150))}${winner.description.length > 150 ? '...' : ''}</p>
      <div style="color: var(--gray); font-size: 0.875rem; margin-bottom: 1rem;">
        <span>👤 ${escapeHtml(winner.user_email)}</span>
        <span style="margin-left: 1rem;">📅 ${new Date(winner.selected_at * 1000).toLocaleDateString()}</span>
      </div>
      <div class="demo-links">
        ${hasDemo ? `<a href="${escapeHtml(winner.demo_url)}" target="_blank">🌐 View Demo</a>` : ''}
        ${hasRepo ? `<a href="${escapeHtml(winner.repo_url)}" target="_blank">📦 Repository</a>` : ''}
        <a href="/winner/${winner.id}">📖 Details</a>
      </div>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
