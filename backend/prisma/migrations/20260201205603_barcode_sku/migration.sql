-- AlterTable
ALTER TABLE `parts` ADD COLUMN `barcode_data` TEXT NULL,
    ADD COLUMN `sku_decoded` TEXT NULL;

-- CreateTable
CREATE TABLE `make_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `make` VARCHAR(191) NOT NULL,
    `code` CHAR(2) NOT NULL,

    UNIQUE INDEX `make_codes_make_key`(`make`),
    UNIQUE INDEX `make_codes_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `model_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `make` VARCHAR(191) NOT NULL,
    `model` VARCHAR(191) NOT NULL,
    `code` CHAR(3) NOT NULL,

    UNIQUE INDEX `model_codes_make_model_key`(`make`, `model`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` CHAR(2) NOT NULL,
    `description` TEXT NULL,

    UNIQUE INDEX `system_codes_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `component_codes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `system_code` CHAR(2) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` CHAR(2) NOT NULL,

    UNIQUE INDEX `component_codes_system_code_code_key`(`system_code`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
