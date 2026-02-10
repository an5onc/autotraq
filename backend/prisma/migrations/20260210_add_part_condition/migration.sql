-- Add part condition enum and field
ALTER TABLE `parts` ADD COLUMN `condition` ENUM('NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'POOR', 'CORE', 'SALVAGE', 'UNKNOWN') NOT NULL DEFAULT 'UNKNOWN';
