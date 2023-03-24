var express = require("express");
const { verifyJWT } = require("../lib/leaseLibrary");
var router = express.Router();
const Surf = require("../models/surfs");
const User = require("../models/users");
const { dateRangeOverlaps } = require("../lib/leaseLibrary");


// Route qui permet d'afficher tous les surfs pour un ID user
router.get("/displayListing", verifyJWT, (req, res) => {

  const { email } = req.user;
    
  User.findOne({ email })
  .then((data) => {
    if (!data) {
      res.json({ result: false });
    return;
  }
  Surf.find({owner : data._id})
  .then((listingData) => {
    res.json({ result: true, listingData });
  })
})

})

// Route qui permet de supprimer un surf pour un ID user
router.delete("/deleteListing", verifyJWT, (req, res) => {
  
  const { email } = req.user;

  User.findOne({ email })
  .then((data) => {
    console.log("etape 1", data)
    if (!data) {
      res.json({ result: false });
    return;
  }
  Surf.deleteOne(
    {_id : req.body._id}
    )
  .then((deleteListing) => { console.log("delete", deleteListing)
    if (deleteListing) {
    res.json({ result: true, deleteListing });
  } else {
    res.json({ result: false, error: 'Listing not found' });
  }
})
})
})
  

  
/* POST d'un nouveau surf via la page Rent */
router.post("/surfs", verifyJWT, (req, res) => {
 
  const { email } = req.user;

  const {
    type, //select sur page "Rent"
    level, //select sur page "Rent"
    name, //input sur page "Rent"
    dayPrice, //select sur page "Rent"
    pictures, //upload sur page "Rent"
    placeName, //input sur page "Rent"
    latitude,
    longitude,
    availabilities,
  } = req.body;

  if (!type || !level || !name || !dayPrice || !pictures || !placeName || !availabilities) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
/*On cherche l'utisateur via son email et si on trouve
 on prend son objectId en tant que valeur de owner*/
  User.findOne({ email })
  .then((data) => {
  if (data) {
    const owner = data._id
  const newSurf = new Surf({
    owner: owner,
    type,
    level,
    name,
    dayPrice,
    pictures,
    placeName,
    latitude,
    longitude,
    availabilities,
    rating : 0,
    deposit : 200,
  });

  newSurf.save().then((data) => {
    res.json({ result: true, data });
  });
  } else {
    res.json({ result: false, error : "user not found"});
  }
});
})

// AFFICHAGE DES SURFS //
/* GET all surfs listing */
router.get("/", (req, res) => {
  Surf.find().then((data) => {
    res.json({ surfs: data });
  });
});

/* GESTION DES FAVORIS 
PUT Add / Remove surfs favorites for an user */
router.put("/addFavorite/:id", verifyJWT, (req, res) => {
  
  const { email } = req.user;

  if (!req.params.id) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ email })
    .populate("favorites")
    .then((data) => {
      if (!data) {
        res.json({ result: false });
      return;
    }
      if (data.favorites.find((surf) => surf._id == req.params.id)) {
        console.log("surf déjà présent dans favoris");

        User.findOneAndUpdate(
          { email },
          {
            $pull: {
              favorites: req.params.id,
            },
          }
        ).then(() =>
          User.findOne({ email })
            .populate("favorites")
            .then((updatedUser) =>
              res.json({ result: true, data: updatedUser.favorites })
            )
        );
      } else {
        console.log("surf non présent dans favoris");
        User.findOneAndUpdate(
          { email },
          {
            $push: {
              favorites: req.params.id,
            },
          }
        ).then(() =>
          User.findOne({ email })
            .populate("favorites")
            .then((updatedUser) =>
              res.json({ result: true, data: updatedUser.favorites })
            )
        );
      }
    });
});

// Get all surfs listing from favorites for an user
router.get("/favorites", verifyJWT, (req, res) => {
  
  const { email } = req.user;
  User.findOne({ email })
    .populate("favorites")
    .then((favoritesDb) => {
      if (favoritesDb) {
        res.json({ data: favoritesDb.favorites });
      } else {
        res.json({ result: false, error: "Favorites not found" });
      }
    });
});

/* RECHERCHE ET FILTRE 
Route POST pour la gestion des recherches de surfs et de filtres */
router.post("/filter", (req, res) => {
  //On déclare 2 variables afin de savoir si on a une valeur dans type et level
  //si non (en cas de tableau vide) on affiche toutes les clefs.
  /*When <boolean> is true, $exists matches the documents that contain the field, including documents where the field value is null. 
  If <boolean> is false, the query returns only the documents that do not contain the field. */
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
    dayPrice: { $lte: req.body.maxPrice },
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
Update rating stars*/
router.put("/rating/:id", verifyJWT, (req, res) => {
  
  const { email } = req.user;
  
  if (!req.params.id || !req.body.rating) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ email }).then((data) => {
    if (data) {
      /*On cherche le surf en fonction de son nom pour MAJ le rating*/
      Surf.findOneAndUpdate({
        _id: req.params.id,
        rating: req.body.rating,
      })
        /*On cherche le surf MAJ pour afficher le résultat*/
        .then((majRating) => {
          res.json({ result: true, majRating });
        });
    } else {
      res.json({ result: false, error: "user not found" });
    }
  });
});

/* Renvoyer un surf par rapport a son ID*/
router.get("/:id", (req, res) => {
  if (!req.params.id) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  Surf.findOne({ _id: req.params.id }).then((data) => {
    if (data) {
      res.json({ result: true, data });
    } else {
      res.json({ result: false, error: "No surf found" });
    }
  });
});


/**
 * @name POST: /surfs/ownerName
 * @desc Route returning the name of a surf's owner.
 * @param {{surfId: String}} - surfId
 * @returns {{result: Boolean, data: String | null, error: String | null}}
 */

router.post("/owner/name", async (req, res) => {
  console.log(req.body.surfId);

  if (!req.body.surfId)
    return res.json({ result: false, error: "surfId missing." });

  try {
    const surf = await Surf.findById(req.body.surfId);
    const owner = await User.findById(surf.owner);
    res.json({ result: true, data: owner.firstname });
  } catch (error) {
    res.json({ result: false, error });
  }
});

module.exports = router;
