# Decisioni prese al posto tuo

Queste scelte tengono in piedi il calendario senza interromperti. Se vuoi cambiarle, dillo e le aggiorno.

## Già decise

- Interfaccia in italiano, dedicata a Elisa, campagna 2026.
- Porte dal 1 al 24 dicembre, sblocco alla mezzanotte ora locale. I giorni già passati si possono aprire. Dal 2027 si rileggono tutte.
- Nessun login e nessun server. Le porte aperte stanno in localStorage.
- I 24 regali sono testi originali segnaposto in data/gifts.ts, da sostituire se vuoi messaggi, link o foto tuoi.
- Nel piè di pagina c'è 'Prova un altro giorno', perché a novembre le porte vere sono ancora chiuse.
- Nessun suono, nessun deploy, nessun tema scuro.

## Scelte fatte dagli agenti

- api-pagina: deciso «Door accetta sia status/onOpen/onLocked sia state/shaking/onClick. Se PreviewPanel riceve solo simDate e onPick, gestisce da sé l'apertura e scrive date 2026-12-GG.». Domanda: I controlli devono restare compatibili con CalendarApp (state, onClick, simDate, onPick) oppure basta l'API del contratto?
- anteprima-chiusura: deciso «Con il pannello aperto il pulsante «Prova un altro giorno» resta visibile. Esc e un clic fuori chiudono. «Data reale» ha aria-pressed quando nessun giorno è attivo.». Domanda: Il pannello «Prova un altro giorno» deve chiudersi con Esc e un clic fuori, oppure solo scegliendo un giorno o la data reale?
- colore-oggi: deciso «Ogni porta non bloccata, oggi compreso, usa il colore di (giorno - 1) modulo 6. Le porte chiuse non impostano backgroundColor.». Domanda: La porta di oggi deve usare lo stesso colore ciclico delle porte disponibili?
- Props dei componenti: deciso «CalendarApp importa i named export Door, GiftDialog e PreviewPanel da @/components/Door, GiftDialog e PreviewPanel. Door riceve day, sticker, state, opened, shaking e onClick. GiftDialog si monta solo da aperto con gift e onClose. PreviewPanel riceve simDate (YYYY-MM-DD o null) e onPick.». Domanda: Queste props vanno bene, o Door, GiftDialog e PreviewPanel usano nomi o export diversi?
- focus dopo Torna a oggi: deciso «Il focus torna sul pulsante stabile «Prova un altro giorno», che resta montato quando il banner si chiude.». Domanda: Quando esci dalla modalità prova con «Torna a oggi», va bene che il focus finisca su «Prova un altro giorno»?

## Domande per dopo

1. I testi dei regali vanno bene, o li vuoi sostituire con regali veri?
2. La dedica 'per Elisa' e l'ultima porta 'Buon Natale, Elisa' usano il nome giusto?
3. Lo sblocco a mezzanotte, con i giorni passati ancora apribili, è quello che volevi?
4. La modalità prova nel piè di pagina la vuoi visibile, nascosta, o tolta?
5. Vuoi un suono all'apertura, o il silenzio va bene?
6. La teniamo solo in locale, o la pubblichiamo da qualche parte?
