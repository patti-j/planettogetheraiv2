import type { Express } from 'express';

export default function registerScheduleRoutes(app: Express) {
  // Simple schedule endpoints to get the app running
  app.get('/api/schedules', (req, res) => {
    res.json([]);
  });

  app.get('/api/schedules/:id', (req, res) => {
    res.json({ id: req.params.id, message: 'Schedule not found' });
  });

  app.post('/api/schedules', (req, res) => {
    res.json({ message: 'Schedule creation not implemented yet' });
  });
}