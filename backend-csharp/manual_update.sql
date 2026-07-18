ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'phu_huynh';

CREATE TABLE IF NOT EXISTS students (
    id text NOT NULL,
    full_name text NOT NULL,
    parent_id text NOT NULL,
    classroom_id text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    CONSTRAINT "PK_students" PRIMARY KEY (id),
    CONSTRAINT "FK_students_areas_classroom_id" FOREIGN KEY (classroom_id) REFERENCES areas (id) ON DELETE CASCADE,
    CONSTRAINT "FK_students_users_parent_id" FOREIGN KEY (parent_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "IX_students_classroom_id" ON students (classroom_id);
CREATE INDEX IF NOT EXISTS "IX_students_parent_id" ON students (parent_id);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260717034245_AddParentAndStudent', '9.0.0') ON CONFLICT DO NOTHING;
