CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715155659_InitialCreate') THEN
    CREATE TYPE alert_status AS ENUM ('pending', 'confirmed', 'false_alarm', 'resolved');
    CREATE TYPE device_status AS ENUM ('online', 'offline', 'error');
    CREATE TYPE role AS ENUM ('admin', 'ban_giam_hieu', 'giam_thi', 'bao_ve');
    CREATE TYPE sound_type AS ENUM ('scream', 'help', 'threat', 'argument');
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715155659_InitialCreate') THEN
    CREATE TABLE areas (
        id text NOT NULL,
        name text NOT NULL,
        description text,
        created_at timestamp with time zone NOT NULL,
        CONSTRAINT "PK_areas" PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715155659_InitialCreate') THEN
    CREATE TABLE settings (
        key text NOT NULL,
        value text NOT NULL,
        CONSTRAINT "PK_settings" PRIMARY KEY (key)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715155659_InitialCreate') THEN
    CREATE TABLE users (
        id text NOT NULL,
        full_name text NOT NULL,
        email text NOT NULL,
        password_hash text NOT NULL,
        role integer NOT NULL,
        created_at timestamp with time zone NOT NULL,
        CONSTRAINT "PK_users" PRIMARY KEY (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715155659_InitialCreate') THEN
    CREATE TABLE devices (
        id text NOT NULL,
        name text NOT NULL,
        area_id text NOT NULL,
        floor integer NOT NULL,
        position_x double precision NOT NULL,
        position_y double precision NOT NULL,
        status integer NOT NULL,
        battery_level integer NOT NULL,
        last_seen timestamp with time zone NOT NULL,
        CONSTRAINT "PK_devices" PRIMARY KEY (id),
        CONSTRAINT "FK_devices_areas_area_id" FOREIGN KEY (area_id) REFERENCES areas (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715155659_InitialCreate') THEN
    CREATE TABLE alerts (
        id text NOT NULL,
        device_id text NOT NULL,
        timestamp timestamp with time zone NOT NULL,
        sound_type integer NOT NULL,
        confidence_score double precision NOT NULL,
        audio_file_url text,
        status integer NOT NULL,
        handled_by_id text,
        resolved_at timestamp with time zone,
        notes text,
        is_evidence boolean NOT NULL,
        CONSTRAINT "PK_alerts" PRIMARY KEY (id),
        CONSTRAINT "FK_alerts_devices_device_id" FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE,
        CONSTRAINT "FK_alerts_users_handled_by_id" FOREIGN KEY (handled_by_id) REFERENCES users (id)
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715155659_InitialCreate') THEN
    CREATE TABLE alert_logs (
        id text NOT NULL,
        alert_id text NOT NULL,
        action text NOT NULL,
        actor_id text NOT NULL,
        timestamp timestamp with time zone NOT NULL,
        CONSTRAINT "PK_alert_logs" PRIMARY KEY (id),
        CONSTRAINT "FK_alert_logs_alerts_alert_id" FOREIGN KEY (alert_id) REFERENCES alerts (id) ON DELETE CASCADE,
        CONSTRAINT "FK_alert_logs_users_actor_id" FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715155659_InitialCreate') THEN
    CREATE INDEX "IX_alert_logs_actor_id" ON alert_logs (actor_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715155659_InitialCreate') THEN
    CREATE INDEX "IX_alert_logs_alert_id" ON alert_logs (alert_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715155659_InitialCreate') THEN
    CREATE INDEX "IX_alerts_device_id" ON alerts (device_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715155659_InitialCreate') THEN
    CREATE INDEX "IX_alerts_handled_by_id" ON alerts (handled_by_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715155659_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_areas_name" ON areas (name);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715155659_InitialCreate') THEN
    CREATE INDEX "IX_devices_area_id" ON devices (area_id);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715155659_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_users_email" ON users (email);
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260715155659_InitialCreate') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260715155659_InitialCreate', '9.0.0');
    END IF;
END $EF$;
COMMIT;

