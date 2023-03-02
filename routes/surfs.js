var express = require("express");
var router = express.Router();
const Surf = require("../models/surfs");
const User = require("../models/users");
const { dateRangeOverlaps } = require("../lib/leaseLibrary");

/* POST surf */
router.post("/surfs", (req, res) => {
  const {
    owner,
    type,
    level,
    name,
    dayPrice,
    pictures,
    placeName,
    latitude,
    longitude,
    availabilities,
    rating,
    deposit
  } = req.body;
  if (!owner || !type) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
  const newSurf = new Surf({
    owner,
    type,
    level,
    name,
    dayPrice,
    pictures,
    placeName,
    latitude,
    longitude,
    availabilities,
    rating,
    deposit
  });
  newSurf.save().then(() => {
    res.json({ result: true });
  });
});

// AFFICHAGE DES SURFS //
/* GET all surfs listing */
router.get("/", (req, res) => {
  Surf.find().then((data) => {
    res.json({ surfs: data });
  });
});

/* GET all surfs listing for a specific user */
router.post("/user", (req, res) => {
  Surf.find({
    owner: req.body.owner
  })
  .then((data) => {
    res.json({ surfs: data });
  });
});

/* POST all surfs for a place and dates 
A SUPPRIMER car nous avons la route recherche filtre ?
router.post("/", (req, res) => {
  const { placeName, availabilities } = req.body;
  if (!placeName) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
  Surf.find({ placeName: { $regex: new RegExp(placeName, "i") } })
  .then((data) => {
      if (data.length > 0) {
        res.json({ result: true, surfs: data });
      } else {
        res.json({ result: false, error: "No surf found" });
      }
    }
  );
});*/


/* GESTION DES FAVORIS 
PUT Add surfs to favorites for an user */
router.put("/addFavorite/:id", (req, res) => {
  if (!req.params.id) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ username: req.body.username, favorites: req.params.id }).then(
    (data) => {
      if (!data) {
        User.findOneAndUpdate(
          { username: req.body.username },
          { $push: { favorites: req.params.id } }
        ).then(() => {
          User.findOne({ username: req.body.username })
            .populate("favorites")
            .then((data) => {
              res.json({ result: true, data });
            });
        });
      } else {
        res.json({ result: false, error: "favorite already added" });
      }
    }
  );
});

/* DELETE/UPDATE surfs from favorites for an user */
router.delete("/removeFavorite/:id", (req, res) => {
  if (!req.params.id) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOneAndUpdate(
    { username: req.body.username },
    { $pull: { favorites: req.params.id } }
    )
    .then(() => {
      User.findOne({ username: req.body.username })
        .populate("favorites")
        .then((data) => {
          res.json({ result: true, data });
        });
    });
  });


// Get all surfs listing from favorites for an user
router.get("/favorites", (req, res) => {
  User.findOne({ username: req.body.username })
    .populate("favorites")
    .then((data) => {
      if (data) {
        res.json({ data });
      } else {
        res.json({ result: false, error: "Favorites not found" });
      }
    });
});



/* PROFIL UTILISATEUR DELETE DE SURF 
DELETE surfs for an owner*/
router.delete("/owner/", (req, res) => {
  Surf.deleteOne({ _id: req.body.id })
  .then((deletedDoc) => {
    if (deletedDoc.deletedCount > 0) {
      /* document successfully deleted
      affichage des surfs restant pour l'utilisateur*/
      Surf.find({
        owner: req.body.owner
      })
      .then((data) => {
        res.json({ result: true, surfs: data });
      });
    } else {
      res.json({ result: false, error: "Surf not found" });
    }
  });
});


/* DELETE surfs for a tenant*/
router.delete("/tenant/", (req, res) => {
  Surf.deleteOne({ _id: req.body.id })
  .then((deletedDoc) => {
    if (deletedDoc.deletedCount > 0) {
      /* document successfully deleted
      affichage des surfs restant pour l'utilisateur*/
      Surf.find({
        owner: req.body.owner
      })
      .then((data) => {
        res.json({ result: true, surfs: data });
      });
    } else {
      res.json({ result: false, error: "Surf not found" });
    }
  });
});


/* RECHERCHE ET FILTRE 
Route POST pour la gestion des recherches de surfs et de filtres */
router.post("/filter", (req, res) => {
  //On déclare 3 variables afin de savoir si on a une valeur dans type et level
  //si non (en cas de tableau vide) on affiche toutes les clefs.
  let type = req.body.type;
  if (type.length < 1) {
    type = { $exists: true };
  }
  let level = req.body.level;
  if (level.length < 1) {
    level = { $exists: true };
  }   
    //On cherche dans la collection Surf les planches qui correspondent aux filtres appliqués
    Surf.find({
    type: type,
    level: level,
    dayPrice: { $lte: req.body.maxPrice},
    rating: { $gte: req.body.minRating },
    placeName: { $regex: new RegExp(req.body.placeName, "i") },    
    })
    //Si la réponse est true on retourne on vérifier la disponibilité
    .then((data) => {     
      if (data) {  
        //Si une date est renvoyée on vérifier la disponibilité avec la fonction dateRangeOverlaps
        if (req.body.availabilities.startDate) {
          let availableSurfs = [];
          for (let surf of data) {
            for (let dateRange of surf.availabilities) {
              if (dateRangeOverlaps(req.body.availabilities, dateRange)) {
                availableSurfs.push(surf);
              }
            }
          }  
          res.json({ data: availableSurfs });
        } else {
          res.json({ data });
        }
      } else {
        res.json({ result: false, error: "not found" });
      }
    });
});



/* RATING
Update rating stars vérifier 
si côté frontend on peut passer dans le name l'username lors de la création d'un surf*/
router.put("/rating", (req, res) => {
  if (!req.body.name) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
/*On cherche le surf en fonction de son nom pour MAJ le rating*/
  Surf.findOneAndUpdate({ 
    name: req.body.name,
    rating: req.body.rating
  })
/*On cherche le surf MAJ pour afficher le résultat*/
    .then(() => {
    Surf.findOne({ name: req.body.name })
    .then((data) => {
    res.json({ result: true, data });
    });
  })
})


module.exports = router;