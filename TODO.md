

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





-------------------

Idée :

In the anchored mode with the default boat yould it be possible to detach the anchor from the 3D boat and put it in the ground  with a line indicate the anchor cord wuth a text indicating the recommanded cord lenght in function of the depth

Qd je dezoom à un momemnt je ne vois plus le bateau
La vue 3D metéo ne s'affiche pas


Recommandations rapides (RPI-friendly) :

3D : monter ThreeDMainView uniquement quand la vue BOAT/SPLIT est active ; désactiver shadows/postprocess lourds ; zéro allocation par frame ; limiter lights.
AIS : rendre le layer vraiment lazy (charge uniquement quand vue AIS/radar) et throttle les updates (500–1000 ms).
Assets : vérifier que tous les assets (HDR/GLB) sont servis depuis le bon préfixe (/ocearo-ui) pour éviter retries 404 qui plombent le temps de chargement. Compresser HDR/GLB si possible.
Images : ajouter alt ou alt="" sur toutes les images pour faire passer l’audit accessibilité.
Cache statique : définir un cache long pour _next et assets sur le serveur (si possible) pour les visites répétées.


Voici les optimisations ciblées pour la vue Dashboard (RPI-friendly) :

Charger moins de composants en mémoire
Widgets lourds en lazy/dynamic import (BoatWidget3D, AISRadarWidget, WeatherWidget/TideWidget si data lente). Exemple : const BoatWidget3D = dynamic(() => import('./widgets/BoatWidget3D'), { ssr: false, loading: () => <div>Loading…</div> });
Ne pas monter AISProvider tant que l’onglet Navigation n’est pas actif (ou monter seulement quand fullscreen AIS). @app/components/dashboard/Dashboard.js#136-187
3D dans Dashboard (BoatWidget3D)
Idéalement, ne monte pas la 3D dans l’onglet Navigation par défaut : soit la conditionner à un clic (bouton “Afficher 3D”), soit à un debounce (ex. 300–500 ms après sélection de l’onglet) pour éviter les pics CPU au switch.
AIS
Dans Dashboard, throttler les updates AIS à 500–1000 ms et limiter le nombre de cibles affichées (échantillonnage si > N). Cela évite que l’onglet Navigation fasse chuter les FPS.
Animations Framer Motion
Réduire les transitions (stagger/opacity) pour cet onglet sur RPI : passer duration de 0.5 à 0.2 et/ou retirer staggerChildren. @app/components/dashboard/Dashboard.js#27-58,71-126
Accessibilité/alt
Ajouter alt ou alt="" sur les images utilisées par les widgets (si existant) pour supprimer l’audit accessibilité.
Cache et données
Si les widgets appellent des APIs météo/tides/AIS : mémoriser les réponses quelques secondes (cache in-memory) pour éviter des appels multiples au tab switch.
Action rapide que je peux appliquer :

Passer BoatWidget3D et AISRadarWidget en dynamic import (lazy) et ne les monter que quand onglet Navigation est actif.
Réduire les durées des animations/stagger dans Dashboard.
Ajouter throttle sur AISProvider (si exposé) et limiter le nombre de cibles rendues.

Vérifier que les objets Three.js statiques ne sont pas recréés à chaque update (meshes, matériaux, textures). Idéal : créer une seule fois, matrixAutoUpdate = false, updateMatrix().
S’assurer que les textures HDR/GLB sont chargées une seule fois (cache du loader) et libérées si la vue est démontée (dispose() sur géométrie/matériaux/texture si besoin).
AIS : throttle des updates (500–1000 ms) et nettoyage des entités retirées (pas de résidus dans les arrays/Maps).



Avoir une vue voiles pour remplacer sail configuration

Liste des voiles possible 
Choix recommandé  (appliqué)
Voile / ris actuel 
Vue 3D recommandé ou actuel
-> Module vison détection automatique
-> Conseil chariot et tension

-> Stockage regardé le module sailsconfiguration