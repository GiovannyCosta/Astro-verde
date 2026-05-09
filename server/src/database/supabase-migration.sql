-- @module supabase-migration
-- @description Estrutura para leituras reais, logs e fila de comandos ESP.
-- @hardware esp32/esp8266
-- @mode real

CREATE TABLE IF NOT EXISTS sensor_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  sensor text NOT NULL,
  value jsonb NOT NULL,
  source text DEFAULT 'real',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level text NOT NULL,
  category text NOT NULL,
  message text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS esp_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  command text NOT NULL,
  payload jsonb,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  sent_at timestamptz,
  ack_at timestamptz
);

ALTER PUBLICATION supabase_realtime ADD TABLE sensor_readings;
ALTER PUBLICATION supabase_realtime ADD TABLE system_logs;
