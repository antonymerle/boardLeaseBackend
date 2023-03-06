var express = require("express");
const { verifyJWT } = require("../lib/leaseLibrary");
var router = express.Router();
const Surf = require("../models/surfs");
const User = require("../models/users");
const { dateRangeOverlaps } = require("../lib/leaseLibrary");
const uniqid = require('uniqid');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

/* POST surf */
router.post("/surfs", verifyJWT,(req, res) => {
  const user = req.user;
  const { email } = req.user;

  const {
    type, //select sur page "Rent"
    level, //select sur page "Rent"
    name, //input sur page "Rent"
    dayPrice, //select sur page "Rent"
   // pictures, //upload sur page "Rent"
    placeName, 
    latitude,
    longitude,
    availabilities, 
  } = req.body;


  /*if (!owner || !type || !name || !availabilities) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }*/

  User.findOne({ email })
  .then((data) => {
  if (data) {

  const newSurf = new Surf({
    owner: email,
    type,
    level,
    name,
    dayPrice,
    pictures : "test",
    placeName,
    latitude,
    longitude,
    availabilities,
    rating : 0,
    deposit : 200,
  });
  newSurf.save().then(() => {
    res.json({ result: true });
  });
  } else {
    res.json({ result: false, error : "user not found"});
  }
  })
});

// AFFICHAGE DES SURFS //
/* GET all surfs listing */
router.get("/", (req, res) => {
  Surf.find().then((data) => {
    res.json({ surfs: data });
  });
});

/* Renvoyer un surf par rapport a son ID*/
router.post("/:id",(req, res) => {

  if (!req.params.id) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  Surf.findOne({ _id : req.params.id })
    .then((data) => {
    if (data) {
    res.json({ result: true, data })
    } else {
    res.json({ result: false, error: "No surf found" })
    }
});
})

/* GESTION DES FAVORIS 
PUT Add / Remove surfs favorites for an user */
router.put("/addFavorite/:id", verifyJWT, (req, res) => {
  const user = req.user;
  const { email } = req.user;

  if (!req.params.id) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ email })
    .populate("favorites")
    .then((data) => {
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
  const user = req.user;
  const { email } = req.user;

  User.findOne({ email })
    .populate("favorites")
    .then((favoritesDb) => {
      if (favoritesDb) {
        res.json({ data : favoritesDb.favorites });
      } else {
        res.json({ result: false, error: "Favorites not found" });
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
  const user = req.user;
  const { email } = req.user;

  if (!req.params.id || !req.body.rating) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }

  User.findOne({ email })
  .then((data) => {
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
    res.json({ result: false, error : "user not found"});
  }
  })
});

//Route pour upload une image sur cloudinary
router.post('/upload', async (req, res) => {
  const photoPath = `./tmp/${uniqid()}.jpg`;
  const resultMove = await req.files.photoFromFront.mv(photoPath);
  
  if(!resultMove) {
      const resultCloudinary = await cloudinary.uploader.upload(photoPath);
      fs.unlinkSync(photoPath);
      res.json({ result: true, url: resultCloudinary.secure_url });
  } else {
      res.json({ result: false, error: resultCopy });
  }
});

module.exports = router;
