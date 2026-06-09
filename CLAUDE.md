# CLAUDE.md — Workshop Manager

## Co to jest
Webowa aplikacja do zarządzania narzędziami specjalistycznymi w warsztatach serwisowych Autotramp/Contractus Agro.
Mechanicy i doradcy serwisowi mogą wydawać, przyjmować, zamawiać i śledzić narzędzia między oddziałami.

## Jak uruchomić lokalnie
```
cd C:\Projekty\workshop-manager
npm run dev        # http://localhost:5173
npm run build      # produkcja
npm run lint       # typecheck
```

## Deploy
- **Repo:** https://github.com/mkakarekoo-cmyk/workshop-manager
- **Hosting:** GitHub Pages / AI Studio (https://ai.studio/apps/2148df2e-dd21-41f0-bb19-04941697989f)
- Push na `main` → automatyczny deploy

## Tech Stack
- **React 19** + **TypeScript** + **Vite**
- **Supabase** — baza danych + autentykacja
- **Lucide React** — ikony
- Brak CSS frameworka (inline Tailwind-like klasy)

## Supabase
- URL: `https://cuctnnsgvxhomxobpchi.supabase.co`
- Klucz publishable w `supabase.ts` (nie commitować klucza service_role!)
- Tabele: `profiles`, `tools`, `tool_logs`, `tool_reservations`, `branches`

## Struktura plików
```
App.tsx              ← główna logika: auth, routing, powiadomienia
supabase.ts          ← klient Supabase
types.ts             ← wszystkie typy TS
index.tsx            ← entry point
components/
  Login.tsx          ← ekran logowania
  Header.tsx         ← górny pasek: powiadomienia, refresh, wyloguj
  Sidebar.tsx        ← nawigacja modułów
  Toast.tsx          ← system toastów
  OrderRequestModal.tsx  ← modal zapotrzebowania na narzędzie
  ChangePasswordModal.tsx
  FleetRedirect.tsx
modules/
  ToolsModule.tsx    ← GŁÓWNY: baza narzędzi, moje narzędzia
  DashboardModule.tsx ← statystyki (tylko ADMINISTRATOR)
  UsersModule.tsx    ← zarządzanie użytkownikami
  ScheduleModule.tsx ← grafik
  FleetModule.tsx    ← flota (podłączona do App.tsx; tabele: vehicles, van_drawers, van_inventory_items)
  WorkshopModule.tsx ← szafki i sprzęt warsztatowy
```

## Oddziały (MOCK_BRANCHES w App.tsx)
| ID | Nazwa | Lokalizacja |
|----|-------|-------------|
| 1 | Porosły (HUB) | Porosły |
| 2 | Karniewo | Karniewo |
| 3 | Łomża | Łomża |
| 4 | Brzozów | Brzozów |
| 5 | Suwałki | Suwałki |
| 6 | Serwis Porosły | Porosły |

## Role użytkowników
- **ADMINISTRATOR** — pełny dostęp, widzi wszystkie oddziały, symulacja oddziałów
- **DORADCA SERWISOWY** — zarządza narzędziami swojego oddziału, akceptuje zamówienia
- **MECHANIK** — widzi narzędzia swojego oddziału, może zamawiać

## Role i oddziały
Role i oddziały wszystkich użytkowników są przechowywane w tabeli `profiles` w Supabase.
Admin email pochodzi z zmiennej środowiskowej `VITE_ADMIN_EMAIL` (w `.env.local`, nie commitować).

## Statusy narzędzi (ToolStatus)
`WOLNE` | `ZAJĘTE` | `W DRODZE` | `KONSERWACJA` | `ZAREZERWOWANE`

## Akcje w tool_logs
`WYDANIE` | `PRZYJĘCIE` | `PRZESUNIĘCIE` | `KONSERWACJA` | `REZERWACJA` | `ZAMÓWIENIE` | `ODMOWA`

## System zamówień (Order Request)
1. Oddział B zamawia narzędzie z oddziału A → log `ZAMÓWIENIE`
2. Doradca oddziału A dostaje powiadomienie (toast + kolejka)
3. Akceptacja → narzędzie zmienia status na `W DRODZE`
4. Odmowa → log `ODMOWA`
5. Przetworzone ID zapamiętywane w `localStorage`

## Powiadomienia
- Polling co 30 sekund (`fetchNotifications`)
- Toast jednorazowo per ID w sesji (`notifiedOrderIds` ref)
- `lastReadAt` — timestamp ostatniego odczytu → is_read

## Ważne uwagi
- Brak Tailwind — klasy CSS pisane inline jako string
- WorkshopModule — częściowo zaimplementowana
- Zmienne środowiskowe: `VITE_ADMIN_EMAIL` i `VITE_SUPABASE_URL` w `.env.local` (nie commitować)
