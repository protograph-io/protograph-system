-- Create a table for Public prototypes
create table prototypes (
  id uuid DEFAULT extensions.uuid_generate_v4(),
  fork_id uuid references prototypes DEFAULT null,
  code text,
  previews text[],
  is_notable boolean NOT NULL DEFAULT FALSE,
  is_hidden boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT current_timestamp,

  primary key (id)
);

-- STEP 1 : Definition
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Step 3: Create the trigger
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON prototypes
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

alter table prototypes enable row level security;

create policy "Public prototypes are viewable by everyone."
  on prototypes for select
  using ( true );

create policy "Public prototypes are insertable by everyone."
  on prototypes for insert
  with check ( true );

create policy "Public prototypes are updateable by everyone."
  on prototypes for update
  using ( true );
