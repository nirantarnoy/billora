-- Add source_platform column to inventory_transactions
ALTER TABLE inventory_transactions 
ADD COLUMN source_platform VARCHAR(50) DEFAULT 'web' AFTER reference_no;

-- Update existing records (optional, assuming they are from web)
UPDATE inventory_transactions SET source_platform = 'web' WHERE source_platform IS NULL;
