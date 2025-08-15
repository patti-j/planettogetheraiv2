-- Create sample chat channels and messages
INSERT INTO chat_channels (name, type, description, created_by) VALUES
('General Discussion', 'group', 'General team discussions', 4),
('Production Team', 'group', 'Production line coordination', 4),
('Quality Control', 'group', 'Quality assurance discussions', 4),
('Maintenance Updates', 'group', 'Equipment maintenance coordination', 4)
ON CONFLICT DO NOTHING;

-- Add members to channels (using only existing user ID 4)
INSERT INTO chat_members (channel_id, user_id, role) VALUES
-- General Discussion
(1, 4, 'owner'),
-- Production Team  
(2, 4, 'owner'),
-- Quality Control
(3, 4, 'owner'),
-- Maintenance Updates
(4, 4, 'owner')
ON CONFLICT DO NOTHING;

-- Add sample messages (using only existing user ID 4)
INSERT INTO chat_messages (channel_id, sender_id, content, message_type) VALUES
-- General Discussion messages
(1, 4, 'Good morning everyone! Ready for today''s production goals?', 'text'),
(1, 4, 'Line 2 is running smoothly after yesterday''s maintenance.', 'text'),
(1, 4, 'Quality metrics looking good this morning. All batches passed initial inspection.', 'text'),
(1, 4, 'Equipment diagnostics completed. No issues detected.', 'text'),
(1, 4, 'Great work team! Let''s keep the momentum going.', 'text'),

-- Production Team messages
(2, 4, 'Production schedule update: We''re ahead of target for this week.', 'text'),
(2, 4, 'Line 1 efficiency at 94%. Parameters look optimal.', 'text'),
(2, 4, 'Quality is consistent. Maintaining current settings.', 'text'),
(2, 4, 'Monitoring continues. Will adjust if needed.', 'text'),

-- Quality Control messages
(3, 4, 'New quality checklist implemented for Batch QC-2025-001.', 'text'),
(3, 4, 'Checklist looks comprehensive and thorough.', 'text'),
(3, 4, 'Team training session scheduled for tomorrow at 2 PM.', 'text'),

-- Maintenance Updates messages
(4, 4, 'Scheduled maintenance for Line 2 completed successfully.', 'text'),
(4, 4, 'Production resumed smoothly after maintenance.', 'text'),
(4, 4, 'Next maintenance window scheduled for next Friday.', 'text')
ON CONFLICT DO NOTHING;

-- Update channel last message timestamps
UPDATE chat_channels 
SET last_message_at = (
  SELECT MAX(created_at) 
  FROM chat_messages 
  WHERE chat_messages.channel_id = chat_channels.id
);