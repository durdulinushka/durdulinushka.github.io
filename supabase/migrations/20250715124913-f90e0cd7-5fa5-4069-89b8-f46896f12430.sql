-- Включаем расширения для cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Создаем cron job для дублирования ежедневных задач каждый день в 6:00 утра
SELECT cron.schedule(
  'duplicate-daily-tasks',
  '0 6 * * *', -- каждый день в 6:00 утра
  $$
  SELECT
    net.http_post(
        url:='https://ggxbrxqpjafvytpdhxrs.supabase.co/functions/v1/duplicate-daily-tasks',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdneGJyeHFwamFmdnl0cGRoeHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NDYxNDQsImV4cCI6MjA2NzMyMjE0NH0.CyouuQYeb3nsZ0xbrzC7sFF3bUl6MvgjqQnaRWiz3OY"}'::jsonb,
        body:='{"source": "cron"}'::jsonb
    ) as request_id;
  $$
);