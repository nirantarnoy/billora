ALTER TABLE inventory_transactions
ADD COLUMN stock_in DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'ยอดรับเข้า' AFTER quantity,
ADD COLUMN stock_out DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'ยอดจ่ายออก' AFTER stock_in,
ADD COLUMN value_amount DECIMAL(15, 2) DEFAULT 0.00 COMMENT 'มูลค่ารายการ (Qty * Cost)' AFTER stock_out;
