START TRANSACTION;
CREATE TYPE "AlertStatus" AS ENUM ('pending', 'confirmed', 'false_alarm', 'resolved');
CREATE TYPE "DeviceStatus" AS ENUM ('online', 'offline', 'error');
CREATE TYPE "Role" AS ENUM ('admin', 'ban_giam_hieu', 'giam_thi', 'bao_ve', 'phu_huynh');
CREATE TYPE "SoundType" AS ENUM ('scream', 'help', 'threat', 'argument');
DROP TYPE alert_status;
DROP TYPE device_status;
DROP TYPE role;
DROP TYPE sound_type;

ALTER TABLE users ALTER COLUMN role TYPE "Role";

ALTER TABLE devices ALTER COLUMN status TYPE "DeviceStatus";

ALTER TABLE alerts ALTER COLUMN status TYPE "AlertStatus";

ALTER TABLE alerts ALTER COLUMN sound_type TYPE "SoundType";

CREATE TABLE students (
    id text NOT NULL,
    full_name text NOT NULL,
    parent_id text NOT NULL,
    classroom_id text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    CONSTRAINT "PK_students" PRIMARY KEY (id),
    CONSTRAINT "FK_students_areas_classroom_id" FOREIGN KEY (classroom_id) REFERENCES areas (id) ON DELETE CASCADE,
    CONSTRAINT "FK_students_users_parent_id" FOREIGN KEY (parent_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX "IX_settings_key" ON settings (key);

CREATE INDEX "IX_students_classroom_id" ON students (classroom_id);

CREATE INDEX "IX_students_parent_id" ON students (parent_id);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260717034245_AddParentAndStudent', '9.0.0');

COMMIT;

