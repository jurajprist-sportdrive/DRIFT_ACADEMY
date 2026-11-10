DRIFT ACADEMY – ADMIN V5

Súbory skopírujte do koreňa projektu C:\drift-academy so zachovaním štruktúry.
Pred prepísaním zálohujte pôvodné súbory.

admin.html                  -> C:\drift-academy\admin.html
vzorove-emaily.html         -> C:\drift-academy\vzorove-emaily.html
netlify/functions/*.js      -> C:\drift-academy\netlify\functions\

DÔLEŽITÉ: _mail.js je súčasťou aktualizácie, aby sa e-maily odosielali podľa upravených šablón.
Ak projekt obsahuje iné zmeny v _mail.js alebo _shared.js, pred prepísaním ich porovnajte.

Nasadenie:
cd /d C:\drift-academy
netlify deploy --prod --skip-functions-cache

Tlač PDF: vyberte dátum cez kalendár a konkrétne auto. V tlačovom okne použite "Uložiť ako PDF".
Stránka vzorových e-mailov: /vzorove-emaily.html; vyžaduje prihlásenie v administrácii.
V5 mení iba automatické e-maily: prijatie dopytu, prijatie rezervácie, notifikáciu administrátorovi a potvrdenie rezervácie. Iné e-maily sa v dodaných podkladoch nenašli.
