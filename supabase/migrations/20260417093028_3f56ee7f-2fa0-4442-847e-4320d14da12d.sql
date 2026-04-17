-- Schemalägg daglig uppdatering av USD→SEK kurs (06:15 UTC dagligen)
SELECT cron.schedule(
  'update-exchange-rate-daily',
  '15 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://fmvbzhlqzzwzciqgbzgp.supabase.co/functions/v1/update-exchange-rate',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdmJ6aGxxenp3emNpcWdiemdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjExMTMsImV4cCI6MjA3NDg5NzExM30.wLjl4fNlmlsFxQCveTQvAm8FfQHJZcKa2Oi7B6xi1DI'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Trigga en första körning direkt så vi har en kurs att jobba med
SELECT net.http_post(
  url := 'https://fmvbzhlqzzwzciqgbzgp.supabase.co/functions/v1/update-exchange-rate',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdmJ6aGxxenp3emNpcWdiemdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzMjExMTMsImV4cCI6MjA3NDg5NzExM30.wLjl4fNlmlsFxQCveTQvAm8FfQHJZcKa2Oi7B6xi1DI'
  ),
  body := '{}'::jsonb
);