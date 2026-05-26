-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. TENANTS / ORGANIZATIONS
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255),
    subscription_tier VARCHAR(50) DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'pro', 'teams', 'enterprise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. USERS & MEMBERSHIPS
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(organization_id, user_id)
);

-- 3. INTEGRATIONS & OAUTH CREDENTIALS
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL, -- 'gmail', 'slack', 'notion', 'google_sheets'
    encrypted_credentials BYTEA NOT NULL, -- Encrypted JSON string (access token, refresh token)
    encryption_iv BYTEA NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(organization_id, provider)
);

-- 4. WORKFLOWS (Graphs)
CREATE TABLE IF NOT EXISTS workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    trigger_type VARCHAR(100) NOT NULL, -- 'webhook', 'schedule', 'app_event'
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused')),
    version INTEGER DEFAULT 1 NOT NULL,
    nodes JSONB NOT NULL DEFAULT '[]'::jsonb, -- React Flow node schema representation
    edges JSONB NOT NULL DEFAULT '[]'::jsonb, -- React Flow edge schema representation
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. WORKFLOW RUNS & EXECUTION HISTORY
CREATE TABLE IF NOT EXISTS workflow_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'paused_approval')),
    trigger_payload JSONB DEFAULT '{}'::jsonb,
    current_node_id VARCHAR(255),
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    execution_context JSONB DEFAULT '{}'::jsonb -- Shared state containing variables passed between nodes
);

-- 6. NODE EXECUTION AUDIT LOGS
CREATE TABLE IF NOT EXISTS node_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_run_id UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
    node_id VARCHAR(255) NOT NULL,
    node_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failed', 'running', 'waiting')),
    input_data JSONB DEFAULT '{}'::jsonb,
    output_data JSONB DEFAULT '{}'::jsonb,
    error TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 7. SYSTEM LEVEL OPERATIONAL MEMORY (pgvector)
CREATE TABLE IF NOT EXISTS operational_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    category VARCHAR(100) DEFAULT 'general', -- 'lead_profile', 'business_rules', 'workflow_context'
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- Designed for OpenAI text-embedding-3-small
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- INDEXING STRATEGY
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_workflows_org ON workflows(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow ON workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_org_status ON workflow_runs(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_node_executions_run ON node_executions(workflow_run_id);
CREATE INDEX IF NOT EXISTS idx_operational_memories_embedding ON operational_memories USING hnsw (embedding vector_cosine_ops);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE node_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_memories ENABLE ROW LEVEL SECURITY;

-- Helper security function to get current organization context
CREATE OR REPLACE FUNCTION get_user_organizations()
RETURNS TABLE (org_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT organization_id FROM memberships 
    WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organization Policies
CREATE POLICY org_access ON organizations 
    FOR ALL USING (id IN (SELECT get_user_organizations()));

-- Workflow Policies
CREATE POLICY workflow_access ON workflows 
    FOR ALL USING (organization_id IN (SELECT get_user_organizations()));

-- Run Access Policies
CREATE POLICY run_access ON workflow_runs 
    FOR ALL USING (organization_id IN (SELECT get_user_organizations()));

-- Memory Access Policies
CREATE POLICY memory_access ON operational_memories 
    FOR ALL USING (organization_id IN (SELECT get_user_organizations()));

-- Cosine similarity matching RPC function for pgvector search
CREATE OR REPLACE FUNCTION match_operational_memories (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  filter_org_id uuid
) RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    om.id,
    om.content,
    1 - (om.embedding <=> query_embedding) AS similarity
  FROM operational_memories om
  WHERE om.organization_id = filter_org_id AND 1 - (om.embedding <=> query_embedding) > match_threshold
  ORDER BY om.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
