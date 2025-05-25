# 🤝 Contribuer au projet DSAuthentificator

Merci de ton intérêt pour l’amélioration de **DSAuthentificator**, le bot Discord de validation sécurisé pour la communauté **Double Sens** !

> ℹ️ Ce projet est **privé** et soumis à des contributions restreintes. Si tu fais partie des personnes autorisées, voici comment participer efficacement.

---

## 🧪 Pré-requis

Avant de commencer :

- Node.js **v20+**
- Docker et Docker Compose (optionnel mais recommandé pour les tests)
- Un compte Discord avec accès au serveur Double Sens (pour les tests réels)
- Accès à l’interface **NocoDB** (pour vérifier la structure des données)

---

## 🚀 Démarrage rapide en local

```bash
git clone https://github.com/doublesens/DSAuthentificator.git
cd DSAuthentificator

cp .envtemplate .env
# → Configure les valeurs dans .env

npm install
npm start
