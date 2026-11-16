let meta = #{
    name: "advent-calendar",
    description: "Build, verify, and merge a single-user neo-brutalist Italian Advent calendar",
    when_to_use: "Build the Elisa advent calendar in this repo: code in parallel, merge, verify, and fix.",
    phases: [
        #{ title: "Fondamenta", detail: "Regole di sblocco, tipi, test e dipendenze" },
        #{ title: "Costruzione", detail: "Regali, stile, componenti e pagina in parallelo" },
        #{ title: "Merge", detail: "Unisci i rami e fai passare test e build" },
        #{ title: "Verifica", detail: "Logica, prodotto, accessibilità, aspetto, testi" },
        #{ title: "Correzioni", detail: "Applica solo i problemi trovati" },
        #{ title: "Conferma", detail: "Test, lint, build e note delle decisioni" },
    ],
};

let report_schema = #{
    "type": "object",
    "required": ["ok", "summary", "branch", "questions"],
    "properties": #{
        "ok": #{ "type": "boolean" },
        "summary": #{ "type": "string" },
        "branch": #{ "type": "string" },
        "questions": #{
            "type": "array",
            "maxItems": 6,
            "items": #{
                "type": "object",
                "required": ["topic", "decision", "ask"],
                "properties": #{
                    "topic": #{ "type": "string" },
                    "decision": #{ "type": "string" },
                    "ask": #{ "type": "string" },
                },
            },
        },
    },
};

let issues_schema = #{
    "type": "object",
    "required": ["issues"],
    "properties": #{
        "issues": #{
            "type": "array",
            "maxItems": 10,
            "items": #{
                "type": "object",
                "required": ["file", "severity", "detail"],
                "properties": #{
                    "file": #{ "type": "string" },
                    "severity": #{ "type": "string" },
                    "detail": #{ "type": "string" },
                },
            },
        },
        "questions": #{
            "type": "array",
            "maxItems": 4,
            "items": #{
                "type": "object",
                "required": ["topic", "decision", "ask"],
                "properties": #{
                    "topic": #{ "type": "string" },
                    "decision": #{ "type": "string" },
                    "ask": #{ "type": "string" },
                },
            },
        },
    },
};

fn is_map(v) {
    type_of(v) == "map"
}

fn is_array(v) {
    type_of(v) == "array"
}

fn agent_output(r) {
    if r == () {
        return ();
    }
    if r.success != true {
        return ();
    }
    if !is_map(r.output) {
        return ();
    }
    r.output
}

fn collect_questions(bucket, r) {
    let output = agent_output(r);
    if output == () {
        return bucket;
    }
    if !is_array(output.questions) {
        return bucket;
    }
    for q in output.questions {
        if is_map(q) && q.topic != () && q.ask != () {
            let decision = "";
            if q.decision != () {
                decision = q.decision;
            }
            bucket.push("- " + q.topic + ": deciso «" + decision + "». Domanda: " + q.ask);
        }
    }
    bucket
}

fn collect_issues(bucket, r, label) {
    if r == () || r.success != true {
        bucket.push(#{
            file: "verifica",
            severity: "high",
            detail: "Il verificatore " + label + " non ha completato la lettura. Ricontrolla quell'area sul codice vero.",
        });
        return bucket;
    }
    let output = agent_output(r);
    if output == () || !is_array(output.issues) {
        bucket.push(#{
            file: "verifica",
            severity: "high",
            detail: "Il verificatore " + label + " non ha restituito una lista di problemi. Ricontrolla quell'area sul codice vero.",
        });
        return bucket;
    }
    for issue in output.issues {
        if is_map(issue) && issue.detail != () && issue.detail != "" {
            let file = label;
            let severity = "high";
            if issue.file != () && issue.file != "" {
                file = issue.file;
            }
            if issue.severity == "low" {
                severity = "low";
            }
            bucket.push(#{ file: file, severity: severity, detail: issue.detail });
        }
    }
    bucket
}

let spec = "";
spec += "You are building a finished single-user Advent calendar web app in the current git repo (Next.js 16 App Router, React 19, Tailwind 4, TypeScript). The working tree is the product. Do not create a second app.\n";
spec += "The shell is Windows PowerShell. Do not use bash '&&'. Run one command at a time. Git commit messages must be passed with -m. Never open an editor, never rebase, never push, never change git config.\n";
spec += "If anything is ambiguous, choose the option that matches this contract, record it in questions as {topic, decision, ask}, and continue. ask is an Italian question for the human later. Never wait for a person. Never ask a tool to ask the user.\n";
spec += "People: one person, no login, no account, no server data, no analytics, no network calls. Opened doors and the optional simulated date live in localStorage only.\n";
spec += "Language: Italian UI. Campaign year 2026. Doors are 1 through 24 December. A missed day in the past can still be opened. A future day cannot. From 1 January 2027 onward every door stays readable. Before 1 December 2026 every door stays locked.\n";
spec += "Clock: use the viewer's local Date. Midnight local time changes the day. No timezone library.\n";
spec += "Preview: a footer control 'Prova un altro giorno' writes localStorage key elisa-advent-sim-v1 as YYYY-MM-DD (2026-12-01 through 2026-12-24) or removes it for the real date. Key for opened days: elisa-advent-opened-v1, a JSON array of integers.\n";
spec += "When a simulated date is active, show a yellow banner 'Modalità prova: stai guardando il N dicembre 2026.' with button 'Torna a oggi'.\n";
spec += "Visual system is neo-brutalist Christmas, paper not dark mode. Background #FFE7C2 with diagonal stripes #FFD59A. Ink #141414. Cards are #fffdf8 with a 3px solid #141414 border and a hard offset shadow 6px 6px 0 #141414, no blur, no rounded pill aesthetic. Available door fills cycle #FF5A36 #FFE14A #B6F25C #FF9CC3 #9BE3FF #FFFFFF with black text. Locked doors are #F4E2C0 with a thin hatch. Fonts: Archivo Black for titles and numbers, Figtree for text, via next/font/google. Remove the starter dark theme and Geist fonts.\n";
spec += "Motion: door hover lifts the shadow, press sinks it. First open of a door plays a short CSS confetti of squares. Locked click shakes the door and shows a toast 'Si apre il N dicembre.' Respect prefers-reduced-motion: no shake, no confetti, no transforms.\n";
spec += "Copy contract: kicker 'per Elisa · 2026'. h1 'Avvento'. Lede 'Una porta al giorno. Le altre aspettano.' Status before December: 'La prima porta si apre il 1 dicembre 2026.' During 1-24 December: 'Oggi è il N dicembre.' After 24 December 2026, including later years: 'Tutte le porte sono aperte. Rileggile quando vuoi.' Footer quiet line: 'Per cambiare i regali, modifica data/gifts.ts.'\n";
spec += "Door aria-labels: locked 'Giorno N, chiuso. Si apre il N dicembre.' today unopened 'Giorno N, oggi. Apri il regalo.' available unopened 'Giorno N, disponibile. Apri il regalo.' opened 'Giorno N, già aperto. Rileggi il regalo.' Ribbon text 'OGGI' only on today's door. Caption 'Chiuso', 'Apri', or 'Aperto'.\n";
spec += "Gift dialog: role=dialog, aria-modal=true, labelled by the title, Escape closes, backdrop click closes, Tab cycles inside, focus moves to the close button and returns to the door on close. Kind chips: messaggio=Messaggio, attivita=Attività, promessa=Promessa, sorpresa=Sorpresa. Close button text 'Chiudi'.\n";
spec += "Class contract the stylesheet defines and the components use: advent-page, advent-wrap, advent-header, advent-kicker, advent-title, advent-lede, advent-status, advent-grid, door, door-locked, door-available, door-today, door-opened, door-num, door-sticker, door-caption, door-ribbon, is-shaking, toast, dialog-back, dialog-card, dialog-kicker, dialog-title, dialog-body, dialog-actions, btn, sim-banner, preview, preview-grid, confetti, confetti-bit. Available doors set an inline backgroundColor from the six fills by (day - 1) modulo 6. Locked doors do not.\n";
spec += "Grid: 2 columns, 3 from 560px, 4 from 800px, 6 from 1040px. Wrap width min(1120px, calc(100% - 32px)). Door min-height 112px. Every control is a button type=button with a visible focus ring.\n";
spec += "Data contract: lib/types.ts exports GiftKind = messaggio | attivita | promessa | sorpresa and Gift {day, title, body, kind, sticker}. lib/unlock.ts exports CAMPAIGN_YEAR = 2026, isUnlocked(day, now), isToday(day, now), doorState(day, now) returning locked | today | available, unlockLabel(day) returning 'N dicembre', parseSimDate(value) returning a Date at local noon or null. Null in TypeScript is allowed; do not invent a sentinel date. isUnlocked is false outside 1-24. Year after 2026 is unlocked. Year before 2026 is locked. In 2026, months before December are locked. In December 2026 a door is unlocked when today's date number is greater than or equal to the door. isToday is true only on that exact local calendar day in December 2026. parseSimDate rejects impossible dates such as 2026-02-31 and non YYYY-MM-DD strings.\n";
spec += "data/gifts.ts exports gifts and giftByDay(day). lib/storage.ts exports OPENED_KEY, SIM_KEY, readOpened, writeOpened, readSimDate, writeSimDate. Storage access guards against missing window, bad JSON, and values outside 1-24.\n";
spec += "File owners: foundation owns lib/types.ts, lib/unlock.ts, lib/unlock.test.ts, data/gifts.ts stubs, data/gifts.test.ts, and the package.json test script. advent-gifts owns only data/gifts.ts after that, keeping giftByDay and the structural tests passing. advent-styles owns only app/globals.css and app/layout.tsx. advent-components owns only components/Door.tsx, components/GiftDialog.tsx, components/PreviewPanel.tsx. advent-page owns only app/page.tsx, components/CalendarApp.tsx, lib/storage.ts. Do not edit next.config.ts, eslint.config.mjs, tsconfig.json, AGENTS.md, README.md, public files, or DECISIONI.md unless you are the final confirm agent writing DECISIONI.md.\n";
spec += "Next.js 16 has cacheComponents and partialPrefetching already enabled. After npm install, read node_modules/next/dist/docs/ before writing UI and follow it. Do not disable cacheComponents. Do not export a runtime. Do not call cookies, headers, connection, or new Date in a Server Component. app/page.tsx stays a Server Component that only renders CalendarApp. All dates, localStorage, and events live in client components marked use client.\n";
spec += "Tests use node:test and node:assert/strict, run by npm test which must be: node --experimental-strip-types --test lib/unlock.test.ts data/gifts.test.ts. Test imports use a .ts extension. App imports use the @/ alias without an extension. Do not add Vitest, a database, an auth library, or any runtime dependency.\n";
spec += "Tests that must pass: isUnlocked(1, Date 2026-12-01 00:01 local) true; isUnlocked(2, 2026-12-01 23:59) false; isUnlocked(24, 2026-12-24 00:00) true; isUnlocked(1, 2026-11-30) false; isUnlocked(5, 2026-12-31) true; isUnlocked(5, 2027-01-01) true; isUnlocked(5, 2025-12-25) false; isUnlocked(0) and isUnlocked(25) false; isToday(3, 2026-12-03) true; isToday(3, 2026-12-04) false; isToday(3, 2027-12-03) false; doorState matches those cases; parseSimDate('2026-12-03') is local noon on that day; parseSimDate('2026-02-31') and parseSimDate('nope') are null; unlockLabel(1) is '1 dicembre'; unlockLabel(24) is '24 dicembre'. Construct dates with new Date(year, monthIndex, day, hour, minute) so they are local.\n";
spec += "gifts structural test: length 24, days 1 through 24 once each, kinds valid, title body and sticker non-empty, giftByDay(1).day is 1, giftByDay(99) is undefined.\n";
spec += "Layout metadata: title 'Avvento di Elisa', description 'Calendario dell'avvento per una persona sola. Una porta al giorno.', html lang=it. Keep LayoutProps if the existing layout uses it and the docs still support it.\n";
spec += "There is no login and no admin. The preview control is part of the product because December has not started and the owner must be able to look at open doors.\n";
spec += "Git integration is always local branch main. After the slices are combined, merge the result into main. Never push. If main is checked out in another worktree, merge from that worktree with git -C. Do not leave the finished app only on a side branch.\n";
spec += "Your final message must match the requested schema. ok is true only when your assigned work is actually done. summary is 2 to 4 sentences. branch is the branch you committed, or an empty string. questions is an array, empty if you decided nothing beyond this contract.\n";

phase("Fondamenta");
let foundation_prompt = spec;
foundation_prompt += "\nYOUR SLICE: foundation, on the current checkout. Do not create a branch. Run git status and git branch --show-current first. Run npm install so Next and the docs are present. Read node_modules/next/dist/docs/ enough to keep the existing Next 16 layout valid.\n";
foundation_prompt += "Create lib/types.ts, lib/unlock.ts, lib/unlock.test.ts, data/gifts.ts, and data/gifts.test.ts. In data/gifts.ts export a valid 24-item stub array (title 'Giorno N', body 'Segnaposto.', sticker a single emoji, kinds cycled) plus giftByDay. The content agent will replace the copy later; structural tests must already pass.\n";
foundation_prompt += "Add the npm test script. Do not add dependencies. Run npm test and fix unlock logic until it passes. Commit only your files and package.json and package-lock.json if npm changed the lockfile, with message 'Add advent unlock rules and gift stubs'. Do not push. Set branch to the current branch name. Set ok true only if the commit exists and npm test exits 0.\n";
let foundation = agent(foundation_prompt, #{
    label: "code:foundation",
    capability_mode: "all",
    output_schema: report_schema,
});
let questions_lines = [];
questions_lines = collect_questions(questions_lines, foundation);
let foundation_output = agent_output(foundation);
if foundation_output == () || foundation_output.ok != true {
    log("Fondamenta incomplete: gli agenti successivi e il merge dovranno chiudere i buchi.");
} else {
    log("Fondamenta committate.");
}

phase("Costruzione");
let gifts_prompt = spec;
gifts_prompt += "\nYOUR SLICE: branch advent-gifts, isolated worktree. Run git status and git log -1. Then git checkout -B advent-gifts. Edit only data/gifts.ts. Keep giftByDay and the Gift type import. Replace the stubs with these exact 24 gifts. Do not edit the test. Do not change package files. Commit only data/gifts.ts with message 'Write the 24 Italian advent gifts'. Set branch to advent-gifts and ok true only if that commit exists.\n";
gifts_prompt += "Gift 1, messaggio, sticker envelope: title Si comincia. Body: Elisa, questa è la prima porta. Dietro le altre ci sono biglietti, piccole missioni e promesse. Non c'è niente da accedere e niente da dimostrare: se la porta è aperta, il regalo è tuo. Tieniti questo calendario fino a Natale.\n";
gifts_prompt += "Gift 2, attivita, hot beverage: title Cacao delle nove. Body: Stasera prepara una cioccolata calda come la faresti per qualcuno che ti aspetta. Tazza grande, fuoco basso, niente fretta. Se vuoi, aggiungi un pizzico di sale. Bevila vicino a una finestra e guarda fuori per due minuti interi.\n";
gifts_prompt += "Gift 3, sorpresa, star: title Una frase da tenere. Body: Frase di oggi: Puoi arrivare dopo, la luce resta accesa. Scrivila dove la rivedi, su un foglietto nello specchio o nella custodia del telefono. Non spiegarla a nessuno, a meno che ti vada.\n";
gifts_prompt += "Gift 4, attivita, walking: title Dieci minuti di luci. Body: Esci dieci minuti, anche solo fino in fondo alla via. Cerca tre luci che ti piacciono: una vetrina, una finestra, un lampione. Torna a casa e annota solo i colori, non i posti.\n";
gifts_prompt += "Gift 5, messaggio, yellow heart: title Cose che restano. Body: Tre cose che questo calendario dà per vere, anche nei giorni storti: hai tempo per una porta sola, non per tutte insieme. Una cosa piccola conta. E se salti un giorno, la porta ti aspetta, non ti giudica.\n";
gifts_prompt += "Gift 6, attivita, music: title Playlist del plaid. Body: Metti insieme sei canzoni per una sera sotto una coperta. Due lente, due che ti fanno muovere i piedi, due che sembrano una lettera. Niente lista perfetta: se una ti imbarazza un po', è quella giusta. Ascoltale tutte, una volta. Non citare testi protetti.\n";
gifts_prompt += "Gift 7, promessa, ticket: title Un favore in tasca. Body: Questo biglietto vale un favore piccolo, da chiedere quando vuoi: una commissione, un barattolo aperto, una cosa portata su per le scale, venti minuti di compagnia senza consiglio. Non scade a gennaio.\n";
gifts_prompt += "Gift 8, messaggio, moon: title Domani mattina. Body: Se domani ti svegli di malumore, non devi sistemare la giornata intera. Sistema solo la prima mezz'ora: acqua, finestra aperta, una cosa calda. Il resto può arrivare dopo, come le porte di questo calendario.\n";
gifts_prompt += "Gift 9, attivita, cookie: title Biscotti storti. Body: Fai una teglia semplice: 100 g di burro morbido, 50 g di zucchero, 150 g di farina, un pizzico di sale. Impasta, schiaccia i pezzi con una forchetta, 15 minuti a 180 gradi. Vanno bene storti. Se non cucini, comprane uno e dagli un nome.\n";
gifts_prompt += "Gift 10, sorpresa, snowflake: title Indovinello. Body: Non ha gambe e cammina sui tetti, non ha voce e fa zittire la strada. Al mattino è già andata via, ma lascia il davanzale più morbido. La risposta è la neve. Se oggi non nevica, aprila lo stesso: vale come credito.\n";
gifts_prompt += "Gift 11, messaggio, postbox: title Lettera di metà strada. Body: Sei all'undici. Non serve sentirsi natalizi per continuare. Questo calendario non misura quanto sei festosa. Misura solo che sei arrivata fin qui, una porta alla volta. Per oggi basta.\n";
gifts_prompt += "Gift 12, attivita, film: title Film sotto la coperta. Body: Scegli un film che conosci già, così non devi dimostrare niente a nessuno. Regola: coperta, luce bassa, telefono in un'altra stanza per il primo quarto d'ora. Se ti addormenti, il film ha fatto il suo lavoro.\n";
gifts_prompt += "Gift 13, promessa, croissant: title Colazione lenta. Body: Questo buono vale una colazione lenta preparata per te: qualcosa di caldo, un frutto, e il tavolo sparecchiato da qualcun altro. Da riscuotere in un mattino a tua scelta, anche a gennaio inoltrato.\n";
gifts_prompt += "Gift 14, messaggio, candle: title Metà dicembre. Body: Oggi è la porta quattordici, la metà oltre la metà. Accendi una candela o, se non ne hai, una lampada piccola. Spegnila solo quando hai finito di leggere. La fiamma non deve significare niente di solenne.\n";
gifts_prompt += "Gift 15, attivita, note: title Lettera per l'anno prossimo. Body: Scrivi dieci righe a te stessa fra un anno. Niente propositi: solo com'è oggi la luce, cosa ti pesa, cosa ti ha fatto ridere di recente. Chiudi il foglio. Il biglietto di carta si riapre il Natale prossimo; questa porta, invece, puoi rileggerla subito.\n";
gifts_prompt += "Gift 16, sorpresa, gift: title Oggetto già in casa. Body: Il regalo di oggi è già in casa. Cerca una cosa rossa che non usi da un po': un nastro, una tazza, un libro, un calzino solo. Mettila sul tavolo fino a domani. Le cose ferme diventano più gentili se le guardi apposta.\n";
gifts_prompt += "Gift 17, messaggio, herb: title Tre cose vere. Body: Uno: non devi rispondere a tutti oggi. Due: una passeggiata corta conta come uscita. Tre: puoi voler bene a dicembre anche se salti la cena, l'albero o il messaggio di auguri. Tieni queste tre e lascia il resto.\n";
gifts_prompt += "Gift 18, attivita, pencil: title Ritratto dei quattro minuti. Body: Prendi un foglio e una penna. Disegna una persona a cui vuoi bene, in quattro minuti, senza cancellare. Il naso può essere una virgola. Quando il tempo finisce, firmi e lo lasci in vista. Non si rifà.\n";
gifts_prompt += "Gift 19, promessa, no phone: title Sera senza schermo. Body: Un buono per una sera in cui il telefono resta in cucina dopo cena. Al suo posto: carte, un libro, o il soffitto. Se la sera si rompe a metà, il buono non è perso. Si riprende dal punto in cui era rimasto.\n";
gifts_prompt += "Gift 20, messaggio, bell: title Mancano quattro porte. Body: Venti. Da qui si vede la fine, e va bene non avere ancora fatto niente di spettacolare. Le porte che hai aperto restano aperte. Quelle che non hai aperto ti aspettano ancora, senza fare la voce grossa.\n";
gifts_prompt += "Gift 21, attivita, stew: title Menu della vigilia. Body: Scrivi un menu di tre righe per una sera lenta: una cosa da mangiare con le mani, una cosa calda, una cosa dolce che non va preparata. Non deve impressionare nessuno. Deve solo essere facile da volere.\n";
gifts_prompt += "Gift 22, sorpresa, star: title Un desiderio spendibile. Body: Hai un desiderio piccolo da spendere con chi ti sta vicino: una canzone messa senza discussione, la scelta del divano, l'ultima fetta, la strada più lunga per tornare a casa. Dillo ad alta voce. Scade quando lo usi.\n";
gifts_prompt += "Gift 23, messaggio, stocking: title Vigilia della vigilia. Body: Domani è l'ultima porta. Se questa settimana è stata piena, metti una cosa in ordine e lascia stare le altre: il lavandino, o il tavolo, o il letto. Una sola. Poi siediti. Il calendario non chiede di più.\n";
gifts_prompt += "Gift 24, messaggio, tree: title Buon Natale, Elisa. Body: Ultima porta. Buon Natale. Non come slogan: come un posto a tavola tenuto libero anche se arrivi tardi, con le scarpe bagnate e una storia a metà. Questo calendario era solo il corridoio. La stanza è tua. Torna alle porte quando vuoi rileggerle: da oggi restano tutte aperte.\n";
gifts_prompt += "Use real emoji for the stickers. Bodies are Italian, warm, and specific. Do not add lorem, branding, or copyrighted lyrics.\n";

let styles_prompt = spec;
styles_prompt += "\nYOUR SLICE: branch advent-styles, isolated worktree. git checkout -B advent-styles. Edit only app/globals.css and app/layout.tsx. Read both files first. Read the Next font docs under node_modules/next/dist/docs if present; if node_modules is missing you may npm install but you must not commit package files or node_modules.\n";
styles_prompt += "Implement the full visual contract: page background, header, grid, doors, ribbon, toast, dialog, buttons, preview panel, sim banner, confetti keyframes, focus-visible, and prefers-reduced-motion. Wire Archivo Black and Figtree through next/font CSS variables named --font-archivo and --font-figtree. Titles and door numbers use Archivo. Body text uses Figtree. html lang=it. Delete the starter dark-mode variables and the Geist setup. Do not edit app/page.tsx. Commit only the two files with message 'Style the neo-brutalist advent shell'. branch is advent-styles. ok true only if the commit exists.\n";

let components_prompt = spec;
components_prompt += "\nYOUR SLICE: branch advent-components, isolated worktree. git checkout -B advent-components. Create only components/Door.tsx, components/GiftDialog.tsx, and components/PreviewPanel.tsx. Do not create CalendarApp, storage, or page files, even if imports would be missing in this worktree. They are merged later.\n";
components_prompt += "Door props: day, status locked|today|available, opened, sticker, onOpen(day), onLocked(day). It is a button. It computes the aria-label from the contract. It shows the number, the sticker when opened, the caption, and the OGGI ribbon when status is today. Locked clicks call onLocked. Other clicks call onOpen. Add class is-shaking briefly on a locked click only when prefers-reduced-motion is false.\n";
components_prompt += "GiftDialog props: gift object or null, and onClose. Render nothing when gift is null. Implement the focus trap without a library. Show the day label, the kind chip, the sticker, the title, the body, and Chiudi.\n";
components_prompt += "PreviewPanel props: open, onClose, onPickDay(day), onUseRealDate, activeDay number or null. When open is false, render a button 'Prova un altro giorno' that calls a prop onToggle. Add onToggle to the props. When open, render the preview card with 24 day buttons and 'Data reale'. Active day uses aria-pressed.\n";
components_prompt += "Export function Door, GiftDialog, and PreviewPanel. Use the class names from the contract. Do not invent a second visual system and do not add a CSS file. Commit only those three files with message 'Add advent door, dialog, and preview controls'. branch is advent-components.\n";

let page_prompt = spec;
page_prompt += "\nYOUR SLICE: branch advent-page, isolated worktree. git checkout -B advent-page. Write only app/page.tsx, components/CalendarApp.tsx, and lib/storage.ts. Do not create Door, GiftDialog, or PreviewPanel in this branch.\n";
page_prompt += "app/page.tsx is a server component that renders CalendarApp and nothing from the Next starter. No images, no external links.\n";
page_prompt += "lib/storage.ts implements the storage contract with window guards.\n";
page_prompt += "CalendarApp is a client component. It loads opened days and the sim date after mount, so the server render matches a locked-safe first paint and then updates. It derives now from parseSimDate when a valid sim date exists, otherwise from a stateful clock refreshed each minute and when the tab becomes visible. It computes doorState for each gift. Opening an available or today door adds the day to localStorage only the first time and then shows GiftDialog; confetti runs only on that first open. Reopening does not repeat confetti. A locked door sets a toast and clears it after 2400ms. PreviewPanel picks 2026-12-DD or clears the sim date. Render header, status, sim banner, grid, dialog, toast, confetti bits, preview, and the quiet footer line. Import Door, GiftDialog, and PreviewPanel from @/components and the data helpers from @/data/gifts and @/lib/unlock and @/lib/storage. Those component files may be absent in this worktree; still import them. Do not stub them here.\n";
page_prompt += "Commit only those three files with message 'Wire the advent calendar page'. branch is advent-page. ok true only if the commit exists.\n";

let built = parallel([
    #{ prompt: gifts_prompt, label: "code:gifts", capability_mode: "all", isolation_worktree: true, output_schema: report_schema },
    #{ prompt: styles_prompt, label: "code:styles", capability_mode: "all", isolation_worktree: true, output_schema: report_schema },
    #{ prompt: components_prompt, label: "code:components", capability_mode: "all", isolation_worktree: true, output_schema: report_schema },
    #{ prompt: page_prompt, label: "code:page", capability_mode: "all", isolation_worktree: true, output_schema: report_schema },
]);

let build_labels = ["gifts", "styles", "components", "page"];
let bi = 0;
for r in built {
    let build_label = "slice";
    if bi < build_labels.len() {
        build_label = build_labels[bi];
    }
    questions_lines = collect_questions(questions_lines, r);
    let bout = agent_output(r);
    if bout == () || bout.ok != true {
        log("Ramo incompleto: " + build_label);
    } else {
        log("Ramo pronto: " + build_label);
    }
    bi += 1;
}

phase("Merge");
let merge_prompt = spec;
merge_prompt += "\nYOUR SLICE: combine the slice branches, then always merge the result into local branch main. Never push. Never open an editor. Use git merge --no-edit.\n";
merge_prompt += "First, on the current checkout, merge in this order: advent-styles, advent-gifts, advent-components, advent-page. If a branch is missing, inspect git branch --list and git worktree list and merge the branch that has the work. If a slice never committed, write the missing files yourself and commit them.\n";
merge_prompt += "Then merge into main. Run git worktree list. If main is checked out in another worktree, commit any finished work on this branch, then from that worktree run git merge --no-edit of this branch. If main is free, check it out here and merge this branch into it. Do not rebase. Do not force. If main has other commits, keep those changes and keep the advent app.\n";
merge_prompt += "Resolve conflicts in favor of the contract: keep foundation unlock logic, keep the literary gifts over stubs, keep the class contract, keep all component files, keep CalendarApp as the only page.\n";
merge_prompt += "Then run npm test, npm run lint, and npm run build in the main worktree. Fix failures with new commits on main. Do not push. Do not disable tests to make them pass. Set ok true only if all three commands exit 0 and main contains the calendar. branch must be main. summary names the merge into main.\n";
let merged = agent(merge_prompt, #{
    label: "merge",
    capability_mode: "all",
    output_schema: report_schema,
});
questions_lines = collect_questions(questions_lines, merged);
let merge_output = agent_output(merged);
if merge_output == () || merge_output.ok != true {
    log("Merge non confermato: la verifica deve cercare i buchi rimasti.");
} else {
    log("Merge confermato da test, lint e build.");
}

phase("Verifica");
let logic_prompt = spec;
logic_prompt += "\nYou are a skeptical verifier. Read lib/unlock.ts and the tests with read_file. Run npm test. Do not edit files. Report an issue for every broken unlock rule, weak test, or failing command. Empty issues is allowed only after you have read the code and seen npm test exit 0. Severity high when a door would open early, stay locked after its day, or tests fail. Cite the file and the rule.\n";
let product_prompt = spec;
product_prompt += "\nYou are a skeptical product verifier. Read app/page.tsx, components/CalendarApp.tsx, lib/storage.ts, and the preview component. Do not edit. Check: no login, no network fetch, localStorage keys match the contract, past December days open, future days do not, preview date is 2026-12-DD, confetti only on first open, toast on locked doors, Italian status lines, server page does not read the clock. File a high issue for each broken product rule. Empty issues only if you read those files and each rule holds.\n";
let a11y_prompt = spec;
a11y_prompt += "\nYou are a skeptical accessibility verifier. Read the components and globals.css. Do not edit. Check button types, aria-labels, dialog semantics, focus return, Escape, tab trap, focus-visible, reduced motion, and black text on the loud fills. File concrete issues with file names. Empty issues only after reading the implementation.\n";
let visual_prompt = spec;
visual_prompt += "\nYou are a skeptical visual verifier. Read app/globals.css and app/layout.tsx. Do not edit. Check the neo-brutalist contract: paper background, hard shadows, 3px borders, Archivo Black plus Figtree, no dark-mode flip, no leftover Geist, class contract present, grid breakpoints, confetti and shake disabled under reduced motion. File concrete issues. Empty issues only after reading the CSS.\n";
let content_prompt = spec;
content_prompt += "\nYou are a skeptical content verifier. Read data/gifts.ts. Do not edit. There must be 24 gifts, days 1 through 24, Italian bodies, no stub title 'Giorno N', no body containing Segnaposto, no lorem, no copyrighted lyrics, and day 24 addresses Elisa. File a high issue for each missing or stub gift. Empty issues only if you read all 24.\n";

let verdicts = parallel([
    #{ prompt: logic_prompt, label: "verify:logic", capability_mode: "execute", output_schema: issues_schema },
    #{ prompt: product_prompt, label: "verify:product", capability_mode: "read-only", output_schema: issues_schema },
    #{ prompt: a11y_prompt, label: "verify:a11y", capability_mode: "read-only", output_schema: issues_schema },
    #{ prompt: visual_prompt, label: "verify:visual", capability_mode: "read-only", output_schema: issues_schema },
    #{ prompt: content_prompt, label: "verify:content", capability_mode: "read-only", output_schema: issues_schema },
]);

let issues = [];
let vlabels = ["logic", "product", "a11y", "visual", "content"];
let vi = 0;
for v in verdicts {
    let vlabel = "verify";
    if vi < vlabels.len() {
        vlabel = vlabels[vi];
    }
    issues = collect_issues(issues, v, vlabel);
    questions_lines = collect_questions(questions_lines, v);
    vi += 1;
}
log(issues.len().to_string() + " problemi raccolti dalla verifica");

if issues.len() > 0 {
    phase("Correzioni");
    let fix_prompt = spec;
    fix_prompt += "\nYOUR SLICE: fix the current checkout. Do not create a branch and do not push. Read the cited files before editing. Fix every issue below. Do not add features. Do not weaken tests. Then run npm test, npm run lint, and npm run build. Commit the fixes with message 'Fix advent calendar verification findings'. ok is true only if those three commands exit 0 after your fixes.\n\nISSUES:\n";
    fix_prompt += json_encode(issues);
    let fixed = agent(fix_prompt, #{
        label: "fix",
        capability_mode: "all",
        output_schema: report_schema,
    });
    questions_lines = collect_questions(questions_lines, fixed);
    let fix_output = agent_output(fixed);
    if fix_output == () || fix_output.ok != true {
        log("Correzioni non confermate.");
    } else {
        log("Correzioni committate.");
    }
} else {
    log("Verifica pulita: nessuna correzione.");
}

phase("Conferma");
let notes = "# Decisioni prese al posto tuo\n\n";
notes += "Queste scelte tengono in piedi il calendario senza interromperti. Se vuoi cambiarle, dillo e le aggiorno.\n\n";
notes += "## Già decise\n\n";
notes += "- Interfaccia in italiano, dedicata a Elisa, campagna 2026.\n";
notes += "- Porte dal 1 al 24 dicembre, sblocco alla mezzanotte ora locale. I giorni già passati si possono aprire. Dal 2027 si rileggono tutte.\n";
notes += "- Nessun login e nessun server. Le porte aperte stanno in localStorage.\n";
notes += "- I 24 regali sono testi originali segnaposto in data/gifts.ts, da sostituire se vuoi messaggi, link o foto tuoi.\n";
notes += "- Nel piè di pagina c'è 'Prova un altro giorno', perché a novembre le porte vere sono ancora chiuse.\n";
notes += "- Nessun suono, nessun deploy, nessun tema scuro.\n\n";
notes += "## Scelte fatte dagli agenti\n\n";
if questions_lines.len() == 0 {
    notes += "- Nessuna scelta extra oltre al contratto.\n";
} else {
    for line in questions_lines {
        notes += line + "\n";
    }
}
notes += "\n## Domande per dopo\n\n";
notes += "1. I testi dei regali vanno bene, o li vuoi sostituire con regali veri?\n";
notes += "2. La dedica 'per Elisa' e l'ultima porta 'Buon Natale, Elisa' usano il nome giusto?\n";
notes += "3. Lo sblocco a mezzanotte, con i giorni passati ancora apribili, è quello che volevi?\n";
notes += "4. La modalità prova nel piè di pagina la vuoi visibile, nascosta, o tolta?\n";
notes += "5. Vuoi un suono all'apertura, o il silenzio va bene?\n";
notes += "6. La teniamo solo in locale, o la pubblichiamo da qualche parte?\n";

let confirm_prompt = spec;
confirm_prompt += "\nYOUR SLICE: final confirm on the current checkout. Write DECISIONI.md with exactly the markdown below, then run npm test, npm run lint, and npm run build. If a command fails, fix the cause and commit with message 'Confirm the advent calendar'. Do not delete product behavior to silence a failure. Do not push. ok is true only if DECISIONI.md exists and all three commands exit 0. branch is the current branch.\n\nMARKDOWN:\n";
confirm_prompt += notes;
let confirm = agent(confirm_prompt, #{
    label: "confirm",
    capability_mode: "all",
    output_schema: report_schema,
});
questions_lines = collect_questions(questions_lines, confirm);

let final_ok = false;
let confirm_output = agent_output(confirm);
if confirm_output != () && confirm_output.ok == true {
    final_ok = true;
    log("Conferma riuscita.");
} else {
    log("Prima conferma non riuscita. Secondo giro.");
    phase("Correzioni");
    let confirm_summary = "nessun riepilogo";
    if confirm_output != () && confirm_output.summary != () {
        confirm_summary = confirm_output.summary;
    }
    let fix2_prompt = spec;
    fix2_prompt += "\nThe final confirm failed. Read the summary, inspect the repo, and fix the app so npm test, npm run lint, and npm run build all exit 0. Keep DECISIONI.md. Do not push. Commit on the current branch with message 'Fix advent calendar confirm failures'. ok true only if the three commands pass.\n\nSUMMARY:\n";
    fix2_prompt += confirm_summary;
    let fixed2 = agent(fix2_prompt, #{
        label: "fix:confirm",
        capability_mode: "all",
        output_schema: report_schema,
    });
    questions_lines = collect_questions(questions_lines, fixed2);
    phase("Conferma");
    let confirm2_prompt = spec;
    confirm2_prompt += "\nRun npm test, npm run lint, and npm run build. Fix only if they fail, then rerun. Keep DECISIONI.md. Do not push. ok is true only if all three exit 0. summary must include the command results.\n";
    let confirm2 = agent(confirm2_prompt, #{
        label: "confirm:again",
        capability_mode: "all",
        output_schema: report_schema,
    });
    questions_lines = collect_questions(questions_lines, confirm2);
    let confirm2_output = agent_output(confirm2);
    if confirm2_output != () && confirm2_output.ok == true {
        final_ok = true;
        log("Seconda conferma riuscita.");
    } else {
        log("Seconda conferma non riuscita.");
    }
}

let scratch_id = write_scratch_file("decisioni.md", notes);
if final_ok {
    complete(#{
        ok: true,
        summary: "Calendario dell'avvento pronto: merge, verifica e conferma completati.",
        notes: scratch_id,
    });
} else {
    complete(#{
        ok: false,
        summary: "Il calendario non ha superato la conferma finale. Vedi le note e il riepilogo degli agenti.",
        notes: scratch_id,
    });
}
