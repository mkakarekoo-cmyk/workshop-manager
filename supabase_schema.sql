
-- 1. Tabela oddziałów
CREATE TABLE IF NOT EXISTS public.branches (
    id SERIAL PRIMARY KEY,
    name text NOT NULL,
    location text,
    email text
);

-- 2. Aktualizacja danych oddziałów zgodnie z Twoją nową listą
INSERT INTO public.branches (id, name, location, email)
VALUES 
(1, 'Porosły (HUB)', 'Porosły', 'andrzej.chlabicz@contractus.com.pl, mateusz.kakareko@contractus.com.pl'),
(2, 'Karniewo', 'Karniewo', 'serwis.karniewo@contrantus.com.pl'),
(3, 'Łomża', 'Łomża', 'mateusz.nicikowski@contractus.com.pl'),
(4, 'Brzozów', 'Brzozów', 'paulina.zlotkowska@contractus.com.pl, serwis@contractus.com.pl'),
(5, 'Suwałki', 'Suwałki', 'serwis.suwalki@contractus.com.pl'),
(6, 'Serwis Porosły', 'Porosły', 'adam.wnorowski@contractus.com.pl')
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email, name = EXCLUDED.name;

-- 3. Rozszerzenie tabeli profili użytkowników
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'MECHANIK',
ADD COLUMN IF NOT EXISTS branch_id integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'AKTYWNY',
ADD COLUMN IF NOT EXISTS email text;

-- 4. Tabela logów narzędzi (historia i powiadomienia)
CREATE TABLE IF NOT EXISTS public.tool_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tool_id uuid REFERENCES public.tools(id) ON DELETE CASCADE,
    action text NOT NULL,
    from_branch_id integer REFERENCES public.branches(id),
    to_branch_id integer REFERENCES public.branches(id),
    notes text,
    operator_id uuid,
    created_at timestamp with time zone DEFAULT now()
);

-- 5. Tabela rezerwacji dla modułu Grafik
CREATE TABLE IF NOT EXISTS public.tool_reservations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tool_id uuid REFERENCES public.tools(id) ON DELETE CASCADE,
    branch_id integer REFERENCES public.branches(id),
    start_date date NOT NULL,
    end_date date NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    operator_id uuid
);
