/**
 * Idea Controller
 */

import { IdeaModel, WinnerModel, QueueModel } from '../models/database.js';

/**
 * Get all ideas (admin only)
 */
export async function getAllIdeas(req, res) {
  try {
    const ideas = IdeaModel.getAllWithUser(100);
    res.json({ ideas });
  } catch (error) {
    console.error('Error fetching ideas:', error);
    res.status(500).json({ error: 'Failed to fetch ideas' });
  }
}

/**
 * Get user's ideas
 */
export async function getUserIdeas(req, res) {
  try {
    const { userId } = req.params;
    const ideas = IdeaModel.findByUserId(userId);
    res.json({ ideas });
  } catch (error) {
    console.error('Error fetching user ideas:', error);
    res.status(500).json({ error: 'Failed to fetch user ideas' });
  }
}

/**
 * Get idea by ID
 */
export async function getIdea(req, res) {
  try {
    const { id } = req.params;
    const idea = IdeaModel.withUser(id);
    
    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    res.json({ idea });
  } catch (error) {
    console.error('Error fetching idea:', error);
    res.status(500).json({ error: 'Failed to fetch idea' });
  }
}

/**
 * Submit idea (without payment - for admin use or testing)
 */
export async function submitIdea(req, res) {
  try {
    const { userId, title, description, category } = req.body;

    if (!userId || !title || !description) {
      return res.status(400).json({
        error: 'Missing required fields: userId, title, description'
      });
    }

    const idea = IdeaModel.create(userId, title, description, category || 'general', null, null);
    res.status(201).json({ idea });

  } catch (error) {
    console.error('Error submitting idea:', error);
    res.status(500).json({ error: 'Failed to submit idea' });
  }
}

/**
 * Update idea status
 */
export async function updateIdeaStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const idea = IdeaModel.updateStatus(id, status);
    res.json({ idea });

  } catch (error) {
    console.error('Error updating idea status:', error);
    res.status(500).json({ error: 'Failed to update idea status' });
  }
}

/**
 * Select idea as winner
 */
export async function selectWinner(req, res) {
  try {
    const { id } = req.params;
    
    // Check if idea exists
    const idea = IdeaModel.findById(id);
    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    // Check if already selected as winner
    const existingWinner = WinnerModel.findByIdeaId(id);
    if (existingWinner) {
      return res.status(400).json({ error: 'Idea already selected as winner' });
    }

    // Create winner record
    const winner = WinnerModel.create(id);
    
    // Update idea status
    IdeaModel.updateStatus(id, 'winner');

    res.status(201).json({ winner });

  } catch (error) {
    console.error('Error selecting winner:', error);
    res.status(500).json({ error: 'Failed to select winner' });
  }
}

/**
 * Add idea to build queue
 */
export async function addToQueue(req, res) {
  try {
    const { id } = req.params;
    const { priority = 5 } = req.body;

    // Check if idea exists
    const idea = IdeaModel.findById(id);
    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    // Check if already in queue
    const existingQueueItem = QueueModel.getAll().find(q => q.idea_id === id);
    if (existingQueueItem) {
      return res.status(400).json({ error: 'Idea already in queue' });
    }

    // Add to queue
    const queueItem = QueueModel.add(id, priority);
    
    // Update idea status
    IdeaModel.updateStatus(id, 'queued');

    res.status(201).json({ queueItem });

  } catch (error) {
    console.error('Error adding to queue:', error);
    res.status(500).json({ error: 'Failed to add to queue' });
  }
}

/**
 * Remove from queue
 */
export async function removeFromQueue(req, res) {
  try {
    const { id } = req.params;
    QueueModel.remove(id);
    IdeaModel.updateStatus(id, 'selected');
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing from queue:', error);
    res.status(500).json({ error: 'Failed to remove from queue' });
  }
}

/**
 * Get queue
 */
export async function getQueue(req, res) {
  try {
    const queue = QueueModel.getAll();
    res.json({ queue });
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
}

/**
 * Get next item from queue
 */
export async function getNextInQueue(req, res) {
  try {
    const nextItem = QueueModel.getNext();
    res.json({ nextItem });
  } catch (error) {
    console.error('Error fetching next in queue:', error);
    res.status(500).json({ error: 'Failed to fetch next in queue' });
  }
}

/**
 * Update winner build status
 */
export async function updateWinnerBuild(req, res) {
  try {
    const { id } = req.params;
    const { build_started_at, build_completed_at, demo_url, repo_url, status } = req.body;

    const winner = WinnerModel.updateBuildStatus(
      id,
      build_started_at || null,
      build_completed_at || null,
      demo_url || null,
      repo_url || null,
      status || 'building'
    );

    res.json({ winner });

  } catch (error) {
    console.error('Error updating winner build:', error);
    res.status(500).json({ error: 'Failed to update winner build' });
  }
}

/**
 * Get all winners
 */
export async function getWinners(req, res) {
  try {
    const winners = WinnerModel.getAll(50);
    res.json({ winners });
  } catch (error) {
    console.error('Error fetching winners:', error);
    res.status(500).json({ error: 'Failed to fetch winners' });
  }
}

/**
 * Get winner by ID
 */
export async function getWinner(req, res) {
  try {
    const { id } = req.params;
    const winner = WinnerModel.findById(id);
    
    if (!winner) {
      return res.status(404).json({ error: 'Winner not found' });
    }

    // Get idea details
    const idea = IdeaModel.withUser(winner.idea_id);
    winner.idea = idea;

    res.json({ winner });

  } catch (error) {
    console.error('Error fetching winner:', error);
    res.status(500).json({ error: 'Failed to fetch winner' });
  }
}
