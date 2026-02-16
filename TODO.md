

Je travaille sur le projet ocearo-ui (interface 3D de voilier basée sur Three.js / react-three-fiber avec données SignalK).

Actuellement :
- La grand-voile est déjà affichée en 3D.
- La voile d’avant (foc / génois) n’est pas encore générée.
- Il n’y a pas de gestion des ris.
- Il n’y a pas de visualisation de tension dynamique.
- Il n’y a pas de sliders pour simuler les réglages.

Je veux étendre la vue 3D avec les fonctionnalités suivantes :

--------------------------------------------------
1) Génération complète de la voile d’avant
--------------------------------------------------

- Générer dynamiquement un mesh de foc/génois :
    - Triangle entre étai, pont et mât.
    - BufferGeometry subdivisée.
- Ajouter gestion du creux (camber).
- Ajouter ouverture/fermeture selon angle au vent (TWA/AWA).
- Lier la rotation au chariot de foc.

Donne :
- Code complet de génération du mesh.
- Fonction updateJibTrim(windData, jibCarPosition).

--------------------------------------------------
2) Gestion des RIS dans la grand-voile
--------------------------------------------------

Je veux pouvoir :
- Appliquer 0, 1 ou 2 ris.
- Réduire la hauteur de la voile.
- Modifier dynamiquement la géométrie (pas juste masquer visuellement).
- Ajouter ligne de ris visible sur la voile.

Logique simplifiée :
- TWS > 18 kt → 1 ris
- TWS > 25 kt → 2 ris

Donne :
- Fonction applyReef(level)
- Code pour recalculer la géométrie proprement
- Sans recréer le mesh à chaque frame (update vertices uniquement)

--------------------------------------------------
3) Visualisation des tensions (couleurs dynamiques)
--------------------------------------------------

Je veux afficher des lignes 3D représentant :
- Écoute grand-voile
- Écoute foc
- Hale-bas / vang
- Cunningham

Couleur basée sur tension (0 → 1) :

- 0.0 → Vert (pas de tension)
- 0.5 → Orange (tension moyenne)
- 1.0 → Rouge (très forte tension)

Implémentation souhaitée :
- ShaderMaterial avec uniform tension
- Interpolation couleur dans le fragment shader
OU
- Mise à jour dynamique du material color

Donne :
- Fonction computeTension(windData, sailTrim)
- Code shader si recommandé
- Mise à jour performante (pas de recréation de material)

--------------------------------------------------
4) Ajout de 3 sliders UI
--------------------------------------------------

Je veux 3 sliders :

1. Grand-voile chariot (0 → 1)
2. Foc chariot (0 → 1)
3. Tension générale (0 → 1)

Contraintes :
- Connectés à l’état global (Redux / Zustand / store existant)
- Mise à jour en temps réel dans la scène 3D
- Animation fluide

Donne :
- Composant React des sliders
- Connexion au state
- Hook useSailTrim()

--------------------------------------------------
5) Fonction principale orchestratrice
--------------------------------------------------

Je veux une fonction centrale :

updateSailTrim({
   tws,
   twa,
   awa,
   mainCar,
   jibCar,
   tension
})

Cette fonction doit :
- Ajuster creux et twist
- Appliquer ris si nécessaire
- Mettre à jour les couleurs des lignes
- Recalculer géométrie sans drop FPS

--------------------------------------------------
Contraintes techniques importantes
--------------------------------------------------

- Performance temps réel
- Pas de re-création de mesh à chaque frame
- Utiliser BufferGeometry et modifier position attribute
- Compatible mobile
- Code structuré, propre, prêt à intégrer dans ocearo-ui

Avant tout analyse ce qui est déjà fait dans ocearo-ui pour comprendre l'architecture existante.