-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Insights table: Core claims/facts managed by the system
CREATE TABLE IF NOT EXISTS insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim TEXT UNIQUE NOT NULL,
  support_count INTEGER DEFAULT 0,
  conflict_count INTEGER DEFAULT 0,
  last_mention TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'verified', -- 'verified', 'contested'
  embedding vector(1024) -- Voyage AI voyage-3 default
);

-- Evidence table: Supporting or conflicting data for insights
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id UUID REFERENCES insights(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL, -- 'support', 'conflict'
  content TEXT NOT NULL,
  source_uuid UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for similarity searches
CREATE INDEX ON insights USING hnsw (embedding vector_cosine_ops);
