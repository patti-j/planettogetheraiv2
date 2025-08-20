import { Router } from 'express';
import { hintsService } from '../hints-service';

const router = Router();

// Get hints for current page
router.get('/api/hints', async (req, res) => {
  try {
    const userId = req.user?.id || 1; // Get from auth
    const page = req.query.page as string || '';
    
    const hints = await hintsService.getPageHints(userId, page);
    res.json(hints);
  } catch (error) {
    console.error('Error fetching hints:', error);
    res.status(500).json({ error: 'Failed to fetch hints' });
  }
});

// Mark hint as seen
router.post('/api/hints/:hintId/seen', async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const hintId = parseInt(req.params.hintId, 10);
    
    await hintsService.markHintSeen(userId, hintId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking hint as seen:', error);
    res.status(500).json({ error: 'Failed to mark hint as seen' });
  }
});

// Dismiss hint
router.post('/api/hints/:hintId/dismiss', async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const hintId = parseInt(req.params.hintId, 10);
    
    await hintsService.dismissHint(userId, hintId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error dismissing hint:', error);
    res.status(500).json({ error: 'Failed to dismiss hint' });
  }
});

// Complete hint (for tutorials)
router.post('/api/hints/:hintId/complete', async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    const hintId = parseInt(req.params.hintId, 10);
    
    await hintsService.completeHint(userId, hintId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error completing hint:', error);
    res.status(500).json({ error: 'Failed to complete hint' });
  }
});

// Reset all hints for user
router.post('/api/hints/reset', async (req, res) => {
  try {
    const userId = req.user?.id || 1;
    
    await hintsService.resetUserHints(userId);
    res.json({ success: true });
  } catch (error) {
    console.error('Error resetting hints:', error);
    res.status(500).json({ error: 'Failed to reset hints' });
  }
});

// Get hint sequences/tutorials
router.get('/api/hints/sequences', async (req, res) => {
  try {
    const sequences = await hintsService.getHintSequences();
    res.json(sequences);
  } catch (error) {
    console.error('Error fetching hint sequences:', error);
    res.status(500).json({ error: 'Failed to fetch hint sequences' });
  }
});

// Seed hints (admin only)
router.post('/api/hints/seed', async (req, res) => {
  try {
    await hintsService.seedHints();
    res.json({ success: true, message: 'Hints seeded successfully' });
  } catch (error) {
    console.error('Error seeding hints:', error);
    res.status(500).json({ error: 'Failed to seed hints' });
  }
});

export default router;