-- Создание cron job для ежедневного дублирования задач
-- Включаем необходимые расширения
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Создаем cron job, который запускается каждый день в 00:01
SELECT cron.schedule(
  'duplicate-daily-tasks',
  '1 0 * * *', -- каждый день в 00:01
  $$
  SELECT
    net.http_post(
        url:='https://ggxbrxqpjafvytpdhxrs.supabase.co/functions/v1/duplicate-daily-tasks',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdneGJyeHFwamFmdnl0cGRoeHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NDYxNDQsImV4cCI6MjA2NzMyMjE0NH0.CyouuQYeb3nsZ0xbrzC7sFF3bUl6MvgjqQnaRWiz3OY"}'::jsonb,
        body:='{"trigger": "cron"}'::jsonb
    ) as request_id;
  $$
);