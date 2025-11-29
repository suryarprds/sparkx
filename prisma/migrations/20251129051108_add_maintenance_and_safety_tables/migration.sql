-- CreateTable
CREATE TABLE "robots" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "serial_number" TEXT NOT NULL,
    "firmware_version" TEXT,
    "hardware_version" TEXT,
    "status" TEXT NOT NULL,
    "operational_mode" TEXT,
    "current_task" TEXT,
    "location" TEXT,
    "country" TEXT,
    "state" TEXT,
    "region" TEXT,
    "battery_capacity_kwh" REAL,
    "max_payload_kg" REAL,
    "operating_temp_min_c" INTEGER,
    "operating_temp_max_c" INTEGER,
    "manufactured_date" DATETIME,
    "deployment_date" DATETIME,
    "last_maintenance_date" DATETIME,
    "next_maintenance_date" DATETIME,
    "warranty_expiry_date" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "last_seen_at" DATETIME,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "decommissioned_at" DATETIME
);

-- CreateTable
CREATE TABLE "robot_telemetry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "robot_id" TEXT NOT NULL,
    "battery_percentage" REAL NOT NULL,
    "battery_voltage" REAL,
    "battery_current" REAL,
    "battery_temperature_c" REAL,
    "charging_status" BOOLEAN NOT NULL DEFAULT false,
    "estimated_runtime_minutes" INTEGER,
    "cpu_load_percentage" REAL,
    "memory_usage_percentage" REAL,
    "disk_usage_percentage" REAL,
    "temperature_c" REAL,
    "signal_strength" REAL,
    "wifi_strength" TEXT,
    "cellular_strength" TEXT,
    "network_latency_ms" INTEGER,
    "latitude" REAL,
    "longitude" REAL,
    "altitude_m" REAL,
    "speed_mps" REAL,
    "heading_degrees" REAL,
    "recorded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "robot_telemetry_robot_id_fkey" FOREIGN KEY ("robot_id") REFERENCES "robots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "robot_sensors" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "robot_id" TEXT NOT NULL,
    "imu_roll" REAL,
    "imu_pitch" REAL,
    "imu_yaw" REAL,
    "accel_x" REAL,
    "accel_y" REAL,
    "accel_z" REAL,
    "gyro_x" REAL,
    "gyro_y" REAL,
    "gyro_z" REAL,
    "lidar_status" TEXT,
    "lidar_scan_rate_hz" INTEGER,
    "lidar_detected_obstacles" INTEGER,
    "lidar_min_distance_m" REAL,
    "lidar_max_range_m" REAL,
    "lidar_points_per_scan" INTEGER,
    "ambient_temperature_c" REAL,
    "humidity_percentage" REAL,
    "air_pressure_hpa" REAL,
    "air_quality_index" INTEGER,
    "ambient_light_lux" INTEGER,
    "sound_level_db" REAL,
    "ultrasonic_front_cm" REAL,
    "ultrasonic_rear_cm" REAL,
    "ultrasonic_left_cm" REAL,
    "ultrasonic_right_cm" REAL,
    "recorded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "robot_sensors_robot_id_fkey" FOREIGN KEY ("robot_id") REFERENCES "robots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "robot_cameras" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "robot_id" TEXT NOT NULL,
    "camera_name" TEXT NOT NULL,
    "camera_type" TEXT,
    "camera_position" TEXT,
    "status" TEXT NOT NULL,
    "fps" INTEGER,
    "resolution_width" INTEGER,
    "resolution_height" INTEGER,
    "exposure_time_ms" REAL,
    "gain" REAL,
    "white_balance" INTEGER,
    "frames_captured" INTEGER NOT NULL DEFAULT 0,
    "last_frame_at" DATETIME,
    "recorded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "robot_cameras_robot_id_fkey" FOREIGN KEY ("robot_id") REFERENCES "robots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "robot_joints" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "robot_id" TEXT NOT NULL,
    "joint_name" TEXT NOT NULL,
    "joint_type" TEXT,
    "joint_index" INTEGER,
    "current_position_deg" REAL,
    "target_position_deg" REAL,
    "velocity_deg_per_sec" REAL,
    "acceleration_deg_per_sec2" REAL,
    "current_torque_nm" REAL,
    "max_torque_nm" REAL,
    "load_percentage" REAL,
    "temperature_c" REAL,
    "status" TEXT,
    "error_code" TEXT,
    "min_position_limit_deg" REAL,
    "max_position_limit_deg" REAL,
    "recorded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "robot_joints_robot_id_fkey" FOREIGN KEY ("robot_id") REFERENCES "robots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "robot_alerts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "robot_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "error_code" TEXT,
    "is_acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_at" DATETIME,
    "acknowledged_by" TEXT,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" DATETIME,
    "resolved_by" TEXT,
    "resolution_notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "robot_alerts_robot_id_fkey" FOREIGN KEY ("robot_id") REFERENCES "robots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "robot_diagnostics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "robot_id" TEXT NOT NULL,
    "overall_health_score" REAL,
    "health_status" TEXT,
    "uptime_hours" REAL,
    "uptime_percentage" REAL,
    "total_runtime_hours" REAL,
    "mission_success_rate" REAL,
    "error_count_24h" INTEGER,
    "warning_count_24h" INTEGER,
    "storage_total_gb" INTEGER,
    "storage_used_gb" INTEGER,
    "storage_available_gb" INTEGER,
    "packets_sent" INTEGER,
    "packets_received" INTEGER,
    "bytes_sent" INTEGER,
    "bytes_received" INTEGER,
    "network_errors" INTEGER,
    "packet_loss_percent" REAL,
    "network_latency_ms" INTEGER,
    "uptime_seconds" INTEGER,
    "upload_rate_mbps" REAL,
    "download_rate_mbps" REAL,
    "total_uploaded_bytes" BIGINT,
    "total_downloaded_bytes" BIGINT,
    "recorded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "robot_diagnostics_robot_id_fkey" FOREIGN KEY ("robot_id") REFERENCES "robots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "maintenance_schedules" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "robot_id" TEXT NOT NULL,
    "maintenance_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduled_date" DATETIME NOT NULL,
    "estimated_duration_hours" REAL,
    "priority" TEXT,
    "status" TEXT NOT NULL,
    "started_at" DATETIME,
    "completed_at" DATETIME,
    "performed_by" TEXT,
    "actual_duration_hours" REAL,
    "parts_replaced" TEXT,
    "total_cost" REAL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "maintenance_schedules_robot_id_fkey" FOREIGN KEY ("robot_id") REFERENCES "robots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "network_handoffs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "robot_id" TEXT NOT NULL,
    "from_network" TEXT NOT NULL,
    "to_network" TEXT NOT NULL,
    "reason" TEXT,
    "duration_ms" INTEGER,
    "occurred_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "network_handoffs_robot_id_fkey" FOREIGN KEY ("robot_id") REFERENCES "robots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "battery_health_history" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "robot_id" TEXT NOT NULL,
    "health_percentage" REAL NOT NULL,
    "cycle_count" INTEGER NOT NULL,
    "capacity_mah" INTEGER NOT NULL,
    "recorded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "battery_health_history_robot_id_fkey" FOREIGN KEY ("robot_id") REFERENCES "robots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "charge_history" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "robot_id" TEXT NOT NULL,
    "cycle_number" INTEGER NOT NULL,
    "charge_level" REAL NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "temperature_c" REAL NOT NULL,
    "charged_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "charge_history_robot_id_fkey" FOREIGN KEY ("robot_id") REFERENCES "robots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "component_health" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "robot_id" TEXT NOT NULL,
    "component_name" TEXT NOT NULL,
    "health_percentage" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "hours_remaining" REAL NOT NULL,
    "last_replaced_at" DATETIME,
    "recorded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "component_health_robot_id_fkey" FOREIGN KEY ("robot_id") REFERENCES "robots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "predictive_alerts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "robot_id" TEXT NOT NULL,
    "component_name" TEXT NOT NULL,
    "prediction" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "confidence_percent" INTEGER NOT NULL,
    "estimated_days" INTEGER NOT NULL,
    "recommended_action" TEXT NOT NULL,
    "is_acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "predictive_alerts_robot_id_fkey" FOREIGN KEY ("robot_id") REFERENCES "robots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "robot_configurations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "robot_id" TEXT NOT NULL,
    "config_key" TEXT NOT NULL,
    "config_value" TEXT,
    "config_type" TEXT,
    "category" TEXT,
    "description" TEXT,
    "is_editable" BOOLEAN NOT NULL DEFAULT true,
    "requires_restart" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "updated_by" TEXT,
    CONSTRAINT "robot_configurations_robot_id_fkey" FOREIGN KEY ("robot_id") REFERENCES "robots" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "robots_serial_number_key" ON "robots"("serial_number");

-- CreateIndex
CREATE INDEX "robots_status_idx" ON "robots"("status");

-- CreateIndex
CREATE INDEX "robots_country_state_region_idx" ON "robots"("country", "state", "region");

-- CreateIndex
CREATE INDEX "robots_model_status_idx" ON "robots"("model", "status");

-- CreateIndex
CREATE INDEX "robot_telemetry_robot_id_recorded_at_idx" ON "robot_telemetry"("robot_id", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "robot_telemetry_robot_id_battery_percentage_idx" ON "robot_telemetry"("robot_id", "battery_percentage");

-- CreateIndex
CREATE UNIQUE INDEX "robot_telemetry_robot_id_recorded_at_key" ON "robot_telemetry"("robot_id", "recorded_at");

-- CreateIndex
CREATE INDEX "robot_sensors_robot_id_recorded_at_idx" ON "robot_sensors"("robot_id", "recorded_at");

-- CreateIndex
CREATE INDEX "robot_cameras_robot_id_idx" ON "robot_cameras"("robot_id");

-- CreateIndex
CREATE INDEX "robot_joints_robot_id_recorded_at_idx" ON "robot_joints"("robot_id", "recorded_at");

-- CreateIndex
CREATE INDEX "robot_joints_robot_id_joint_name_idx" ON "robot_joints"("robot_id", "joint_name");

-- CreateIndex
CREATE INDEX "robot_joints_status_idx" ON "robot_joints"("status");

-- CreateIndex
CREATE INDEX "robot_alerts_robot_id_created_at_idx" ON "robot_alerts"("robot_id", "created_at");

-- CreateIndex
CREATE INDEX "robot_alerts_severity_is_resolved_idx" ON "robot_alerts"("severity", "is_resolved");

-- CreateIndex
CREATE INDEX "robot_alerts_is_acknowledged_is_resolved_idx" ON "robot_alerts"("is_acknowledged", "is_resolved");

-- CreateIndex
CREATE INDEX "robot_alerts_robot_id_severity_is_resolved_idx" ON "robot_alerts"("robot_id", "severity", "is_resolved");

-- CreateIndex
CREATE INDEX "robot_diagnostics_robot_id_recorded_at_idx" ON "robot_diagnostics"("robot_id", "recorded_at");

-- CreateIndex
CREATE INDEX "maintenance_schedules_robot_id_scheduled_date_idx" ON "maintenance_schedules"("robot_id", "scheduled_date");

-- CreateIndex
CREATE INDEX "maintenance_schedules_status_scheduled_date_idx" ON "maintenance_schedules"("status", "scheduled_date");

-- CreateIndex
CREATE INDEX "maintenance_schedules_robot_id_status_idx" ON "maintenance_schedules"("robot_id", "status");

-- CreateIndex
CREATE INDEX "network_handoffs_robot_id_occurred_at_idx" ON "network_handoffs"("robot_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "battery_health_history_robot_id_recorded_at_idx" ON "battery_health_history"("robot_id", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "charge_history_robot_id_charged_at_idx" ON "charge_history"("robot_id", "charged_at" DESC);

-- CreateIndex
CREATE INDEX "charge_history_robot_id_cycle_number_idx" ON "charge_history"("robot_id", "cycle_number");

-- CreateIndex
CREATE INDEX "component_health_robot_id_recorded_at_idx" ON "component_health"("robot_id", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "component_health_robot_id_component_name_idx" ON "component_health"("robot_id", "component_name");

-- CreateIndex
CREATE INDEX "predictive_alerts_robot_id_created_at_idx" ON "predictive_alerts"("robot_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "predictive_alerts_severity_is_acknowledged_idx" ON "predictive_alerts"("severity", "is_acknowledged");

-- CreateIndex
CREATE INDEX "robot_configurations_category_idx" ON "robot_configurations"("category");

-- CreateIndex
CREATE INDEX "robot_configurations_robot_id_category_idx" ON "robot_configurations"("robot_id", "category");

-- CreateIndex
CREATE UNIQUE INDEX "robot_configurations_robot_id_config_key_key" ON "robot_configurations"("robot_id", "config_key");
