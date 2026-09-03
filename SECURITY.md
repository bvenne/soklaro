# Security Policy

Bitte Sicherheitsprobleme nicht öffentlich als Issue melden. Nutze die private Security-Advisory-Funktion des späteren Quellcode-Hosts. Da dieses Repository noch keinen endgültigen Host besitzt, dürfen vor Veröffentlichung keine produktiven Geheimnisse oder Zugangsdaten eingetragen werden.

Unterstützt wird jeweils die neueste veröffentlichte Minor-Version. Abhängigkeiten werden im Lockfile gepinnt und vor Releases mit `npm audit --omit=dev` sowie einer Lizenzprüfung geprüft.

Sicherheitsziele: restriktive CSP, nur dokumentierte Netzwerkhosts, keine Inline-Skripte, keine Client-Secrets, minimierte Berechtigungen und explizite Standortfreigabe.
