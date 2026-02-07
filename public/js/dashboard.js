// BuildMyIdea - Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
  loadUserIdeas();
});

async function loadUserIdeas() {
  // In a real app, we'd get the user ID from session
  // For MVP, we'll load all ideas (should be filtered by user_id)
  
  const ideasList = document.getElementById('ideas-list');
  const noIdeasSection = document.getElementById('no-ideas');
  const totalSubmissions = document.getElementById('total-submissions');
  const pendingIdeas = document.getElementById('pending-ideas');
  const winnerCount = document.getElementById('winner-count');

  try {
    // Try to get user info first
    const userResponse = await fetch('/api/users/me');
    const userData = await userResponse.json();
    
    if (userData.isAuthenticated) {
      // Load user's ideas
      const ideasResponse = await fetch(`/api/ideas/user/${userData.user.id}`);
      const ideasData = await ideasResponse.json();
      
      const ideas = ideasData.ideas || [];
      
      // Update stats
      totalSubmissions.textContent = ideas.length;
      pendingIdeas.textContent = ideas.filter(i => i.status === 'paid' || i.status === 'pending').length;
      winnerCount.textContent = ideas.filter(i => i.status === 'winner').length;
      
      if (ideas.length === 0) {
        ideasList.style.display = 'none';
        noIdeasSection.style.display = 'block';
      } else {
        ideasList.innerHTML = ideas.map(idea => createIdeaCard(idea)).join('');
      }
    } else {
      // Show login prompt
      ideasList.innerHTML = `
        <div class="empty-state">
          <p>Please <a href="/submit" style="color: var(--primary);">submit an idea</a> first.</p>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error loading ideas:', error);
    ideasList.innerHTML = `
      <p style="color: var(--danger);">Failed to load your ideas. Please refresh the page.</p>
    `;
  }
}

function createIdeaCard(idea) {
  const statusClass = `status-${idea.status}`;
  const statusText = idea.status.charAt(0).toUpperCase() + idea.status.slice(1);
  
  return `
    <div class="idea-item">
      <div class="idea-header">
        <div>
          <div class="idea-title">${escapeHtml(idea.title)}</div>
          <div class="idea-meta">
            <span>Submitted: ${new Date(idea.created_at * 1000).toLocaleDateString()}</span>
            <span>Category: ${escapeHtml(idea.category)}</span>
          </div>
        </div>
        <span class="idea-status ${statusClass}">${statusText}</span>
      </div>
      <p style="color: var(--gray);">${escapeHtml(idea.description.substring(0, 200))}${idea.description.length > 200 ? '...' : ''}</p>
    </div>
  `;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
