-- Create user if not exists
DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'stocksim') THEN
      CREATE USER stocksim WITH PASSWORD 'password';
   END IF;
END
$$;

-- Create database
CREATE DATABASE stocksim OWNER stocksim;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE stocksim TO stocksim;
