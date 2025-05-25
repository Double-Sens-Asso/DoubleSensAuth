📌 DSAuthentificator — Bot Discord de vérification par email

DSAuthentificator est un bot Discord développé pour l'association Double Sens, permettant de vérifier les utilisateurs via leur adresse email, en se basant sur une base de données NocoDB. Il attribue automatiquement un rôle après validation et journalise chaque interaction dans un salon forum dédié.
📦 Fonctionnalités

    🔐 Validation par email via message privé

    ✅ Attribution automatique d’un rôle Discord

    🧾 Intégration avec NocoDB via API v2

    📑 Journalisation détaillée dans un forum Discord, un thread par utilisateur

    📛 Anti-abus : un email et un compte Discord ne peuvent être utilisés qu'une fois

    🧼 Masquage des emails dans les logs pour la confidentialité

⚙️ Configuration

Crée un fichier .env à partir du modèle :


📁 Exemple de fichier .env :

# Token du bot Discord
DISCORD_TOKEN=...

# ID du canal d’inscription
CHANNELID=...

# ID du rôle à attribuer
ROLE_ID=...

# ID du serveur Discord
GUILD_ID=...

# ID du salon forum pour les logs
LOG_FORUM_ID=...

# NocoDB
NOCODB_API_TOKEN=...
NOCODB_API_URL=http://your-nocodb-instance:8080
NOCODB_TABLE_NAME_ID=...
FIELDS=mailMembre
NOCODB_TABLE_NAME_LITTERAL=Membres

🐳 Déploiement avec Docker
📁 Exemple docker-compose.yml :

version: "3.8"
services:
  dsauthentificator:
    image: node:20
    container_name: dsauthentificator
    working_dir: /app
    volumes:
      - .:/app
    command: ["node", "index.js"]
    env_file:
      - .env
    restart: unless-stopped

▶️ Lancement

docker compose up -d

🧪 Arborescence du projet

.
├── index.js              # Point d'entrée
├── discord.js            # Gestion des messages Discord
├── nocodb.js             # Intégration NocoDB
├── logger.js             # Logging avancé (forum/thread)
├── checkmessage.js       # Extraction d’email
├── .env                  # Variables sensibles (non commit)
├── .env.template         # Exemple d’environnement
├── docker-compose.yml    # Lancement avec Docker
└── README.md             # Ce fichier

🚧 Sécurité

    Tous les emails sont masqués ([email masqué]) dans les logs pour éviter les fuites.

    Le bot empêche qu’un compte Discord soit utilisé plusieurs fois.

    Les accès sont basés sur un token API NocoDB sécurisé.


Tout droit réservé - Double-Sens
