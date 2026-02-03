-- AlterTable: Add barcode login and creator tracking to users
ALTER TABLE `users` ADD COLUMN `login_barcode` VARCHAR(191) NULL,
    ADD COLUMN `created_by_id` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `users_login_barcode_key` ON `users`(`login_barcode`);

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE `role_requests` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `requestedRole` ENUM('admin', 'manager', 'fulfillment', 'viewer') NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'DENIED') NOT NULL DEFAULT 'PENDING',
    `reason` TEXT NULL,
    `decided_by_id` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `decidedAt` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `role_requests` ADD CONSTRAINT `role_requests_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `role_requests` ADD CONSTRAINT `role_requests_decided_by_id_fkey` FOREIGN KEY (`decided_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
