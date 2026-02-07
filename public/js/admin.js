// BuildMyIdea - Admin Panel JavaScript

document.addEventListener('DOMContentLoaded', function() {
  checkAdminAuth();
  setupEventListeners();
});

let isAdmin = false;

async function checkAdminAuth() {
  try {
    const response = await fetch('/api/admin/check');
    const data = await response.json();
    
    if (data.isAdmin) {
      isAdmin = true;
      document.getElementById('admin-email-display').textContent = data.user.email;
      document.getElementById('admin-panel').style.display = 'flex';
      loadDashboardStats();
      loadPendingIdeas();
    } else {
      document.getElementById('login-modal').style.display = 'flex';
    }
  } catch (error) {
    console.error('Error checking admin auth:', error);
    document.getElementById('login-modal').style.display = 'flex';
  }
}

function setupEventListeners() {
  // Login form
  document.getElementById('login-form').addEventListener('submit', handleLogin);
  
  // Logout button
  document.getElementById('logout-btn').addEventListener('click', handleLogout);
  
  // Tab navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      switchTab(this.dataset.tab);
    });
  });
  
  // Status filter
  document.getElementById('status-filter').addEventListener('change', loadAllIdeas);
}

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('admin-email').value;
  const password = document.getElementById('admin-password').value;
  const errorDiv = document.getElementById('login-error');
  
  try {
    const response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.ok && data.success) {
      isAdmin = true;
      closeLoginModal();
      document.getElementById('admin-email-display').textContent = data.user.email;
      document.getElementById('admin-panel').style.display = 'flex';
      loadDashboardStats();
      loadPendingIdeas();
    } else {
      errorDiv.textContent = data.error || 'Invalid credentials';
      errorDiv.style.display = 'block';
    }
  } catch (error) {
    console.error('Login error:', error);
    errorDiv.textContent = 'Login failed. Please try again.';
    errorDiv.style.display = 'block';
  }
}

async function handleLogout() {
  try {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.reload();
  } catch (error) {
    console.error('Logout error:', error);
  }
}

function closeLoginModal() {
  document.getElementById('login-modal').style.display = 'none';
}

function switchTab(tabName) {
  // Update nav links
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.tab === tabName);
  });
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });
  
  // Update page title
  document.getElementById('page-title').textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
  
  // Load tab-specific data
  switch(tabName) {
    case 'dashboard':
      loadDashboardStats();
      loadPendingIdeas();
      break;
    case 'ideas':
      loadAllIdeas();
      break;
    case 'queue':
      loadQueue();
      break;
    case 'winners':
      loadWinners();
      break;
  }
}

async function loadDashboardStats() {
  try {
    const response = await fetch('/api/admin/stats');
    const data = await response.json();
    
    document.getElementById('stat-users').textContent = data.totalUsers;
    document.getElementById('stat-ideas').textContent = data.totalIdeas;
    document.getElementById('stat-winners').textContent = data.totalWinners;
    document.getElementById('stat-queue').textContent = data.queueCount;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function loadPendingIdeas() {
  const container = document.getElementById('pending-ideas');
  
  try {
    const response = await fetch('/api/ideas');
    const data = await response.json();
    
    const pendingIdeas = data.ideas.filter(i => i.status === 'paid' || i.status === 'pending');
    
    if (pendingIdeas.length === 0) {
      container.innerHTML = '<p style="color: var(--gray);">No pending ideas to review.</p>';
    } else {
      container.innerHTML = createIdeasTable(pendingIdeas);
    }
  } catch (error) {
    console.error('Error loading pending ideas:', error);
  }
}

async function loadAllIdeas() {
  const container = document.getElementById('all-ideas');
  const filter = document.getElementById('status-filter').value;
  
  try {
    const response = await fetch('/api/ideas');
    const data = await response.json();
    
    let ideas = data.ideas;
    if (filter !== 'all') {
      ideas = ideas.filter(i => i.status === filter);
    }
    
    if (ideas.length === 0) {
      container.innerHTML = '<p style="color: var(--gray);">No ideas found.</p>';
    } else {
      container.innerHTML = createIdeasTable(ideas);
    }
  } catch (error) {
    console.error('Error loading ideas:', error);
  }
}

async function loadQueue() {
  const container = document.getElementById('build-queue');
  
  try {
    const response = await fetch('/api/ideas/queue/all');
    const data = await response.json();
    
    if (!data.queue || data.queue.length === 0) {
      container.innerHTML = '<p style="color: var(--gray);">No ideas in the build queue.</p>';
    } else {
      container.innerHTML = data.queue.map(item => `
        <div class="queue-item">
          <div class="queue-item-content">
            <div class="queue-item-title">${escapeHtml(item.title)}</div>
            <div class="queue-item-meta">
              👤 ${escapeHtml(item.user_email)} | Position: ${item.position} | Priority: ${item.priority}
            </div>
          </div>
          <div class="queue-item-actions">
            <button onclick="removeFromQueue('${item.idea_id}')" class="btn btn-small btn-danger">Remove</button>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading queue:', error);
  }
}

async function loadWinners() {
  const container = document.getElementById('winners-list');
  
  try {
    const response = await fetch('/api/ideas/winners');
    const data = await response.json();
    
    if (!data.winners || data.winners.length === 0) {
      container.innerHTML = '<p style="color: var(--gray);">No winners yet.</p>';
    } else {
      container.innerHTML = data.winners.map(winner => createWinnerItem(winner)).join('');
    }
  } catch (error) {
    console.error('Error loading winners:', error);
  }
}

function createIdeasTable(ideas) {
  return `
    <div class="table-row table-header-row">
      <div class="table-cell">Title</div>
      <div class="table-cell">Description</div>
      <div class="table-cell">User</div>
      <div class="table-cell">Status</div>
      <div class="table-cell">Actions</div>
    </div>
    ${ideas.map(idea => `
      <div class="table-row">
        <div class="table-cell title">${escapeHtml(idea.title)}</div>
        <div class="table-cell">${escapeHtml(idea.description.substring(0, 50))}...</div>
        <div class="table-cell email">${escapeHtml(idea.user_email)}</div>
        <div class="table-cell"><span class="status status-${idea.status}">${idea.status}</span></div>
        <div class="table-cell">
          ${idea.status === 'paid' || idea.status === 'pending' ? `
            <button onclick="selectWinner('${idea.id}')" class="btn btn-small btn-success">Select</button>
            <button onclick="addToQueue('${idea.id}')" class="btn btn-small btn-primary">Queue</button>
          ` : ''}
        </div>
      </div>
    `).join('')}
  `;
}

function createWinnerItem(winner) {
  return `
    <div class="winner-item">
      <div class="winner-item-header">
        <div>
          <div class="winner-item-title">${escapeHtml(winner.title)}</div>
          <div class="winner-item-meta">
            👤 ${escapeHtml(winner.user_email)} | 📅 ${new Date(winner.selected_at * 1000).toLocaleDateString()}
          </div>
        </div>
        <span class="status status-${winner.status}">${winner.status}</span>
      </div>
      <p class="winner-item-description">${escapeHtml(winner.description.substring(0, 200))}...</p>
      <div class="winner-item-actions">
        ${winner.status === 'selected' ? `
          <button onclick="startBuild('${winner.id}')" class="btn btn-small btn-primary">Start Build</button>
          <button onclick="addToQueue('${winner.idea_id}')" class="btn btn-small btn-secondary">Add to Queue</button>
        ` : ''}
        ${winner.status === 'building' ? `
          <button onclick="completeBuild('${winner.id}')" class="btn btn-small btn-success">Mark Complete</button>
        ` : ''}
      </div>
    </div>
  `;
}

async function selectWinner(ideaId) {
  if (!confirm('Select this idea as a winner?')) return;
  
  try {
    const response = await fetch(`/api/ideas/${ideaId}/winner`, { method: 'POST' });
    
    if (response.ok) {
      alert('Idea selected as winner!');
      loadPendingIdeas();
      loadAllIdeas();
    } else {
      alert('Failed to select winner');
    }
  } catch (error) {
    console.error('Error selecting winner:', error);
    alert('Error selecting winner');
  }
}

async function addToQueue(ideaId) {
  try {
    const response = await fetch(`/api/ideas/${ideaId}/queue`, { method: 'POST' });
    
    if (response.ok) {
      alert('Idea added to queue!');
      loadPendingIdeas();
      loadAllIdeas();
      if (document.getElementById('tab-queue').classList.contains('active')) {
        loadQueue();
      }
    } else {
      alert('Failed to add to queue');
    }
  } catch (error) {
    console.error('Error adding to queue:', error);
    alert('Error adding to queue');
  }
}

async function removeFromQueue(ideaId) {
  if (!confirm('Remove this idea from the queue?')) return;
  
  try {
    const response = await fetch(`/api/ideas/${ideaId}/queue`, { method: 'DELETE' });
    
    if (response.ok) {
      alert('Idea removed from queue!');
      loadQueue();
    } else {
      alert('Failed to remove from queue');
    }
  } catch (error) {
    console.error('Error removing from queue:', error);
    alert('Error removing from queue');
  }
}

async function startBuild(winnerId) {
  try {
    const response = await fetch(`/api/ideas/winner/${winnerId}/build`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        build_started_at: Math.floor(Date.now() / 1000),
        status: 'building'
      })
    });
    
    if (response.ok) {
      alert('Build started!');
      loadWinners();
    } else {
      alert('Failed to start build');
    }
  } catch (error) {
    console.error('Error starting build:', error);
    alert('Error starting build');
  }
}

async function completeBuild(winnerId) {
  const demoUrl = prompt('Enter demo URL (optional):');
  const repoUrl = prompt('Enter repository URL (optional):');
  
  try {
    const response = await fetch(`/api/ideas/winner/${winnerId}/build`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        build_completed_at: Math.floor(Date.now() / 1000),
        demo_url: demoUrl || null,
        repo_url: repoUrl || null,
        status: 'completed'
      })
    });
    
    if (response.ok) {
      alert('Build marked as complete!');
      loadWinners();
    } else {
      alert('Failed to complete build');
    }
  } catch (error) {
    console.error('Error completing build:', error);
    alert('Error completing build');
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
