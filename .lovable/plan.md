

# Kontrastfix: Anvand samma system som Statistik-sidan

## Sammanfattning

Statistik-sidan anvander klasserna `dashboard-heading-dark` och `dashboard-subheading-dark` som automatiskt byter farg mellan svart (ljust lage) och vitt (morkt lage). Samma system ska appliceras pa alla komponenter dar text forsvinner i ljust lage.

## Berorda filer och andringar

### 1. HeroBanner (`src/components/ui/HeroBanner.tsx`)

Tar bort hardkodad `text-white` fran wrappern och applicerar temamedvetna klasser:

- Titel (`h2`): lagg till `dashboard-heading-dark`
- Undertitel (`p`): lagg till `dashboard-subheading-dark`
- "Dagens fokus"-text: `dashboard-subheading-dark`
- Quick action-titlar: `dashboard-heading-dark`
- Quick action-undertitlar: `dashboard-subheading-dark`
- Ikonbakgrunder och action-bakgrunder: `bg-black/5 dark:bg-white/20`
- Kalenderikon-bakgrund: `bg-black/5 dark:bg-white/20`
- Ta bort `text-white` fran wrapperns className

### 2. Kontosidans tabs (`src/pages/AccountPage.tsx`)

Rubriken anvander redan `dashboard-heading-dark` / `dashboard-subheading-dark` (korrekt). Problemet ar flikarna:

- TabsList bakgrund: `bg-black/5 dark:bg-white/10`
- TabsList border: `border-black/10 dark:border-white/20`
- TabsTrigger inaktiv text: `text-foreground/60 dark:text-white/70`
- TabsTrigger aktiv bakgrund: `data-[state=active]:bg-black/10 dark:data-[state=active]:bg-white/20`
- TabsTrigger aktiv text: `data-[state=active]:text-foreground dark:data-[state=active]:text-white`

### 3. ChatSidebar (`src/components/ai/ChatSidebar.tsx`)

Alla hardkodade vita farger byts:

- Borders: `border-border dark:border-white/10`
- "Historik"-text: `text-foreground/70 dark:text-white/70`
- Knappfargerna: `text-foreground/60 dark:text-white/60`, hover `text-foreground dark:text-white`
- "Laddar..." och "Inga konversationer"-text: `text-muted-foreground dark:text-white/40`
- Aktiv konversation: `bg-black/10 dark:bg-white/15 text-foreground dark:text-white`
- Inaktiv konversation: `text-foreground/60 dark:text-white/60`
- Ikoner/bakgrunder: `bg-black/5 dark:bg-white/10`

### 4. DashboardFooter (`src/components/DashboardFooter.tsx`)

Hela footern anvander hardkodade vita farger:

- Footer border: `border-border dark:border-white/10`
- Container text: `text-muted-foreground dark:text-white/70`
- Rubriker (h3): `dashboard-heading-dark` istallet for `text-white`
- Brodtext (p-taggar): arver fran containern (muted-foreground)
- Hover-farg pa lankar: `hover:text-foreground dark:hover:text-white`
- Copyright-border: `border-border dark:border-white/10`

## Ingen logik andras

Samtliga andringar ar rena CSS-klassbyte. Ingen funktionalitet eller struktur paverkas.
