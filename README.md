# Ninhache.com V4 (Backend / Admin)

This is the backend and admin API for the portfolio.
For the main frontend website, see the [Ninhachedotcomv4-seo](https://github.com/Ninhache/Ninhachedotcomv4-seo) repository.

## Docker

Lancer le tout
```sh
docker compose up --build
```

Init la base:
```sh
docker compose exec backend npx prisma migrate dev
```

## Liste des tâches

### TODO
- Project

### Done
- Contact
- Experiences
- Media
- Resume
- Skill
- Tags

## Rappel

Projets:
- Tags technique (JS, TS, ...)
- Tags qualificatif (ecole, personnel, web, ...)
- Nom
- Date
- Description
- Media (Image, Vidéo) -> potentiellement plusieurs?
- Lien GIT
- Lien pour visiter


Compétences:
- Nom
- Image
- Lien WIKI ?
- Tags de rangement (design, front, back, ...)


Expériences pro:
- Date
- Titre
- Nom
- Description
- Tags technique (JS, TS, ...)
- Lien site


Contact:
- Image
- URL
- Texte


Resume:
Lien vers le CV je suppose

