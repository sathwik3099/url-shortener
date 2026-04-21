-- 🔹 MAIN URL TABLE
CREATE TABLE urls (
    id BIGSERIAL PRIMARY KEY,

    short_code VARCHAR(10) NOT NULL,
    original_url TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NULL,

    click_count BIGINT DEFAULT 0
);

-- 🔥 UNIQUE constraint (better than plain index)
ALTER TABLE urls ADD CONSTRAINT uq_short_code UNIQUE (short_code);

-- 🔥 Fast lookup index (used in redirects)
CREATE INDEX idx_short_code ON urls(short_code);

-- 🔥 Expiry cleanup queries
CREATE INDEX idx_expires_at ON urls(expires_at);

-- 🔥 Active URLs index (PARTIAL INDEX)
-- NOTE: Avoid NOW() in index (not stable)
CREATE INDEX idx_active_urls 
ON urls(short_code) 
WHERE expires_at IS NULL;

-- 🔹 ANALYTICS TABLE
CREATE TABLE url_analytics (
    id BIGSERIAL PRIMARY KEY,
    short_code VARCHAR(10) NOT NULL,
    clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 🔥 Index for analytics queries
CREATE INDEX idx_analytics_shortcode ON url_analytics(short_code);

-- 🔥 Time-based queries (range scans)
CREATE INDEX idx_analytics_time ON url_analytics(clicked_at);

-- 🔥 Composite index (VERY IMPORTANT for real analytics queries)
CREATE INDEX idx_analytics_shortcode_time 
ON url_analytics(short_code, clicked_at);