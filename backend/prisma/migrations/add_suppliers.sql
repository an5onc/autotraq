-- Add Supplier table
CREATE TABLE IF NOT EXISTS suppliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  country VARCHAR(100) DEFAULT 'USA',
  website VARCHAR(255),
  tax_id VARCHAR(50),
  payment_terms VARCHAR(50) DEFAULT 'NET30',
  shipping_method VARCHAR(100),
  account_number VARCHAR(100),
  notes TEXT,
  minimum_order_amount DECIMAL(10, 2) DEFAULT 0,
  lead_time_days INT DEFAULT 7,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  rating DECIMAL(3, 2) DEFAULT 5.0,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  INDEX idx_supplier_status (status),
  INDEX idx_supplier_name (name),
  INDEX idx_supplier_code (code)
);

-- Add Purchase Order table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INT NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  subtotal DECIMAL(10, 2) NOT NULL,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  expected_delivery_date DATE,
  received_date DATE,
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  INDEX idx_po_number (po_number),
  INDEX idx_po_status (status),
  INDEX idx_po_supplier (supplier_id)
);

-- Add Purchase Order Items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  purchase_order_id INT NOT NULL,
  part_id INT NOT NULL,
  quantity INT NOT NULL,
  unit_cost DECIMAL(10, 2) NOT NULL,
  total_cost DECIMAL(10, 2) NOT NULL,
  received_quantity INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (part_id) REFERENCES parts(id),
  INDEX idx_po_items_order (purchase_order_id),
  INDEX idx_po_items_part (part_id)
);

-- Add Quality Issues table for tracking supplier issues
CREATE TABLE IF NOT EXISTS quality_issues (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  purchase_order_id INT,
  part_id INT,
  issue_type VARCHAR(50),
  description TEXT,
  severity VARCHAR(20) DEFAULT 'MEDIUM',
  resolution TEXT,
  resolved_at TIMESTAMP NULL,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
  FOREIGN KEY (part_id) REFERENCES parts(id),
  INDEX idx_quality_supplier (supplier_id),
  INDEX idx_quality_severity (severity)
);

-- Add supplier_id to parts table for preferred supplier
ALTER TABLE parts
ADD COLUMN IF NOT EXISTS supplier_id INT,
ADD COLUMN IF NOT EXISTS last_ordered DATE,
ADD FOREIGN KEY (supplier_id) REFERENCES suppliers(id);