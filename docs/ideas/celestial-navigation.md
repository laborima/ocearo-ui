# Idée : naviguer avec les étoiles

> Statut : idée, non planifiée. Suite du ciel nocturne livré en 2.1.0 ([#13](https://github.com/laborima/ocearo-ui/issues/13)).

## À quoi servent les étoiles en navigation

| Usage | Principe | Précision nécessaire | Ce qu'il faut |
|---|---|---|---|
| **Tenir un cap la nuit** | On barre sur une étoile basse placée dans la direction du cap, au lieu de fixer le compas | quelques degrés | ses yeux |
| **Contrôler le compas** | L'azimut d'un astre est connu exactement : on le compare au relèvement lu au compas, ce qui donne la déviation | ~1° | un compas de relèvement |
| **Latitude par la Polaire** | Sa hauteur au-dessus de l'horizon donne la latitude, à environ 1° près | ~1′ | un sextant, au crépuscule |
| **Point astronomique** | Chaque hauteur mesurée donne une droite de hauteur, et 3 étoiles donnent un point | ~0,1′ | un sextant, l'heure exacte, le calcul de la droite |

Contrainte importante : **au sextant, on ne vise les étoiles qu'au crépuscule nautique**, quand le soleil est entre −6° et −12°. Il faut voir à la fois l'étoile et l'horizon. En pleine nuit, l'horizon a disparu ; les étoiles servent alors seulement au cap.

## Proposition : une fiche « étoile » au toucher

On touche une étoile dans le ciel 3D et une fiche s'ouvre, comme celle des navires AIS. Elle contient :

### 1. Identification

- Le nom, la constellation et la magnitude, avec un mot d'aide : « l'étoile la plus brillante du ciel », « dans le prolongement de la Grande Ourse »…

### 2. Pour tenir le cap

- **L'azimut vrai (Zn)** et le relèvement par rapport à l'étrave : « 12° à bâbord de l'étrave ».
- La mention « Bonne étoile de cap » si elle est basse (moins de 30° de hauteur) et proche du cap suivi.
- Le délai avant qu'elle ne s'écarte de plus de 5° : « change d'étoile dans ~18 min ». C'est le vrai piège de la méthode, puisque l'étoile se déplace. Seule la Polaire ne bouge pas.

### 3. Pour régler le sextant

- **La hauteur calculée (Hc)**, puis la **hauteur à afficher au sextant** pour trouver l'étoile directement :

  ```
  Hs = Hc + dépression + réfraction − correction d'index
  ```

  La dépression vaut environ 1,76′ × √(hauteur d'œil en m), soit 2,8′ pour 2,5 m d'œil.
- Une consigne pratique : « Affiche 34°12′, vise au 247°, balaie l'horizon. »
- Pour la Polaire, la latitude correspondante, pour comprendre le lien entre les deux.

### 4. Pour vérifier le compas

- On saisit le relèvement lu au compas. La fiche répond : « déviation 3° W au cap 110 ». On peut l'enregistrer dans une courbe de déviation.

## Fonctions complémentaires

- **Planificateur de crépuscule** : l'heure du crépuscule nautique, matin et soir, et les 3 ou 4 étoiles conseillées. On les choisit entre 15° et 70° de hauteur, bien réparties en azimut (idéalement à 120° les unes des autres), et elles sont surlignées dans le ciel 3D.
- **Saisie d'une visée** : la hauteur lue au sextant (Hs) et l'heure exacte. L'app calcule l'intercept et trace la droite de hauteur sur la carte. Avec 2 ou 3 droites, on obtient le point.
- **Mode entraînement** : le GPS donne la vraie position, donc l'app peut dire « ton point est à 1,8 M de la position GPS ». C'est un excellent moyen d'apprendre, et ça évite de laisser croire que l'outil remplace le GPS.

## Points de vigilance

- **Précision** : le calcul actuel est juste à quelques minutes d'arc près. C'est largement suffisant pour le cap, le compas et le pré-réglage du sextant. Pour calculer une droite de hauteur, il faut descendre sous 0,1′ et vérifier contre l'Almanach nautique.
- **Nouveaux réglages** : la hauteur d'œil et l'erreur d'index du sextant. La température et la pression, qui servent à la réfraction, peuvent venir de Signal K.
- **Soleil et Lune** : ils sont visés de jour, et il faut ajouter le demi-diamètre et, pour la Lune, la parallaxe. On peut faire une étape à part, avec la méridienne du soleil.
- **Lisibilité** : la fiche doit rester rouge et sobre en thème nuit. Sur téléphone, elle se place dans la colonne du bas, comme celle des navires.

## Ordre de mise en œuvre proposé

1. Fiche étoile : identification, azimut, relèvement par rapport à l'étrave et « bonne étoile de cap ». C'est simple et utile à tous.
2. Hauteur à afficher au sextant et planificateur de crépuscule.
3. Contrôle du compas et courbe de déviation.
4. Saisie de visée, droite de hauteur et point, avec le mode entraînement.
