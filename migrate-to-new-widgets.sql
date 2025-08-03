-- Migration script to create new clean widget system and migrate existing data

-- Create new clean widget and dashboard tables
CREATE TABLE IF NOT EXISTS widgets (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('chart', 'metric', 'table', 'list', 'gauge', 'progress', 'alert', 'map', 'timeline')),
  target_platform TEXT NOT NULL DEFAULT 'both' CHECK (target_platform IN ('mobile', 'desktop', 'both')),
  data_source TEXT NOT NULL,
  data_query JSONB DEFAULT '{}',
  visualization JSONB DEFAULT '{}',
  layout JSONB NOT NULL,
  settings JSONB DEFAULT '{}',
  description TEXT,
  category TEXT,
  tags JSONB DEFAULT '[]',
  created_by INTEGER NOT NULL DEFAULT 1,
  is_shared BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dashboards (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  target_platform TEXT NOT NULL DEFAULT 'both' CHECK (target_platform IN ('mobile', 'desktop', 'both')),
  layout JSONB NOT NULL,
  configuration JSONB DEFAULT '{"widgets": []}',
  theme JSONB DEFAULT '{"name": "default"}',
  category TEXT,
  tags JSONB DEFAULT '[]',
  created_by INTEGER NOT NULL DEFAULT 1,
  is_shared BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for the new tables
CREATE INDEX IF NOT EXISTS widgets_type_idx ON widgets(type);
CREATE INDEX IF NOT EXISTS widgets_platform_idx ON widgets(target_platform);
CREATE INDEX IF NOT EXISTS widgets_category_idx ON widgets(category);
CREATE INDEX IF NOT EXISTS widgets_created_by_idx ON widgets(created_by);
CREATE INDEX IF NOT EXISTS widgets_active_idx ON widgets(is_active);

CREATE INDEX IF NOT EXISTS dashboards_platform_idx ON dashboards(target_platform);
CREATE INDEX IF NOT EXISTS dashboards_category_idx ON dashboards(category);
CREATE INDEX IF NOT EXISTS dashboards_created_by_idx ON dashboards(created_by);
CREATE INDEX IF NOT EXISTS dashboards_active_idx ON dashboards(is_active);
CREATE INDEX IF NOT EXISTS dashboards_default_idx ON dashboards(is_default);

-- Migrate existing unified_widgets to new widgets table
INSERT INTO widgets (
  title, 
  type, 
  target_platform, 
  data_source,
  data_query,
  visualization,
  layout,
  settings,
  description,
  category,
  tags,
  created_by,
  is_shared,
  is_template,
  is_active,
  created_at,
  updated_at
)
SELECT 
  title,
  CASE 
    WHEN widget_type = 'kpi' THEN 'metric'
    WHEN widget_type = 'chart' THEN 'chart'
    WHEN widget_type = 'table' THEN 'table'
    WHEN widget_type = 'list' THEN 'list'
    WHEN widget_type = 'gauge' THEN 'gauge'
    WHEN widget_type = 'progress' THEN 'progress'
    WHEN widget_type = 'alert' THEN 'alert'
    WHEN widget_type = 'timeline' THEN 'timeline'
    ELSE 'metric'
  END as type,
  target_platform,
  data_source,
  jsonb_build_object(
    'filters', COALESCE(filters, '{}'),
    'groupBy', group_by,
    'orderBy', CASE WHEN sort_by IS NOT NULL THEN sort_by ELSE NULL END,
    'limit', "limit",
    'aggregation', aggregation
  ) as data_query,
  jsonb_build_object(
    'chartType', chart_type,
    'colors', COALESCE(colors, '[]'),
    'thresholds', COALESCE(thresholds, '[]'),
    'displayFormat', 'number'
  ) as visualization,
  jsonb_build_object(
    'width', (size->>'width')::integer,
    'height', (size->>'height')::integer,
    'x', (position->>'x')::integer,
    'y', (position->>'y')::integer
  ) as layout,
  jsonb_build_object(
    'refreshInterval', refresh_interval,
    'autoRefresh', true,
    'clickAction', CASE 
      WHEN drill_down_target IS NOT NULL THEN 
        jsonb_build_object(
          'type', 'drill_down',
          'target', drill_down_target,
          'params', COALESCE(drill_down_params, '{}')
        )
      ELSE NULL
    END
  ) as settings,
  description,
  category,
  COALESCE(tags, '[]'),
  created_by,
  is_shared,
  is_template,
  true as is_active,
  created_at,
  updated_at
FROM unified_widgets
WHERE id IS NOT NULL;

-- Create some sample dashboards based on existing dashboard_configs
INSERT INTO dashboards (
  title,
  description,
  target_platform,
  layout,
  configuration,
  category,
  is_default,
  created_by
)
VALUES 
(
  'Factory Overview',
  'Real-time production metrics and equipment status',
  'both',
  '{"type": "grid", "columns": 12, "rowHeight": 100, "margin": [10, 10]}',
  '{"widgets": []}',
  'operational',
  true,
  1
),
(
  'Production Planning',
  'Schedule management and resource allocation',
  'desktop',
  '{"type": "grid", "columns": 12, "rowHeight": 80}',
  '{"widgets": []}',
  'planning',
  false,
  1
),
(
  'Quality Control',
  'Quality metrics and testing results',
  'both',
  '{"type": "grid", "columns": 12, "rowHeight": 100}',
  '{"widgets": []}',
  'quality',
  false,
  1
),
(
  'Mobile Dashboard',
  'Mobile-optimized production overview',
  'mobile',
  '{"type": "responsive", "columns": 2, "rowHeight": 120}',
  '{"widgets": []}',
  'mobile',
  false,
  1
),
(
  'Executive Summary',
  'High-level KPIs and performance metrics',
  'desktop',
  '{"type": "grid", "columns": 16, "rowHeight": 60}',
  '{"widgets": []}',
  'executive',
  false,
  1
);

-- Update dashboard configurations to include widget references
UPDATE dashboards SET configuration = jsonb_build_object(
  'widgets', 
  CASE 
    WHEN title = 'Factory Overview' THEN
      jsonb_build_array(
        jsonb_build_object('widgetId', 1, 'x', 0, 'y', 0, 'w', 6, 'h', 2),
        jsonb_build_object('widgetId', 2, 'x', 6, 'y', 0, 'w', 6, 'h', 3),
        jsonb_build_object('widgetId', 3, 'x', 0, 'y', 2, 'w', 6, 'h', 3),
        jsonb_build_object('widgetId', 4, 'x', 6, 'y', 3, 'w', 6, 'h', 3)
      )
    WHEN title = 'Production Planning' THEN
      jsonb_build_array(
        jsonb_build_object('widgetId', 1, 'x', 0, 'y', 0, 'w', 12, 'h', 2),
        jsonb_build_object('widgetId', 2, 'x', 0, 'y', 2, 'w', 8, 'h', 4)
      )
    WHEN title = 'Quality Control' THEN
      jsonb_build_array(
        jsonb_build_object('widgetId', 3, 'x', 0, 'y', 0, 'w', 12, 'h', 4)
      )
    WHEN title = 'Mobile Dashboard' THEN
      jsonb_build_array(
        jsonb_build_object('widgetId', 1, 'x', 0, 'y', 0, 'w', 2, 'h', 1),
        jsonb_build_object('widgetId', 2, 'x', 0, 'y', 1, 'w', 2, 'h', 2)
      )
    ELSE '[]'
  END
)
WHERE title IN ('Factory Overview', 'Production Planning', 'Quality Control', 'Mobile Dashboard');

-- Clean up and add better titles/descriptions for migrated widgets
UPDATE widgets SET 
  title = CASE 
    WHEN title = 'Production Overview' THEN 'Production Overview'
    WHEN title = 'Equipment Status' THEN 'Equipment Status'
    WHEN title = 'Quality Metrics' THEN 'Quality Dashboard'
    WHEN title = 'Mobile Production Status' THEN 'Mobile Production Status'
    WHEN title = 'Inventory Levels' THEN 'Inventory Tracking'
    ELSE title
  END,
  description = CASE
    WHEN title = 'Production Overview' THEN 'Real-time overview of production metrics including active orders, efficiency, and output'
    WHEN title = 'Equipment Status' THEN 'Current operational status of all manufacturing equipment and resources'
    WHEN title = 'Quality Metrics' THEN 'Quality control dashboard showing test results, defect rates, and compliance metrics'
    WHEN title = 'Mobile Production Status' THEN 'Mobile-optimized view of current production status and key metrics'
    WHEN title = 'Inventory Levels' THEN 'Real-time inventory levels across all materials and finished goods'
    ELSE description
  END,
  category = CASE
    WHEN title LIKE '%Production%' THEN 'production'
    WHEN title LIKE '%Equipment%' OR title LIKE '%Resource%' THEN 'equipment'
    WHEN title LIKE '%Quality%' THEN 'quality'
    WHEN title LIKE '%Inventory%' THEN 'inventory'
    ELSE category
  END
WHERE id IS NOT NULL;

-- Add some useful tags to the widgets
UPDATE widgets SET tags = CASE
  WHEN category = 'production' THEN '["production", "kpi", "real-time"]'
  WHEN category = 'equipment' THEN '["equipment", "status", "monitoring"]'
  WHEN category = 'quality' THEN '["quality", "compliance", "testing"]'
  WHEN category = 'inventory' THEN '["inventory", "materials", "stock"]'
  ELSE '["general"]'
END::jsonb
WHERE tags = '[]'::jsonb;