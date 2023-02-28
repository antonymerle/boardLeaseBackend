var express = require("express");
var router = express.Router();
const Surf = require("../models/surfs");
const User = require("../models/users");

/* POST surf */
router.post('/surfs', (req, res) => {
    const { owner, type, level, name, dayPrice, pictures, placeName, latitude, longitude, availabilities} = req.body;
    if (!owner || !type) {
      res.json({ result: false, error: 'Missing or empty fields' });
      return;
    }
    const newSurf = new Surf({ owner, type, level, name, dayPrice, pictures, placeName, latitude, longitude, availabilities });
    newSurf.save().then(() => {
    res.json({ result: true });
    })
})

/* GET all surfs listing 
router.get("/surfs", (req, res, next) => {
  Surf.find().then((data) => {
    res.json({ surfs: data });
  });
});*/


/* GET all surfs for a place and dates */
router.get("/", (req, res) => {
    const { placeName, availabilities } = req.body;
  if (!placeName) {
    res.json({ result: false, error: "Missing or empty fields" });
    return;
  }
  Surf.find({ placeName:{ $regex: new RegExp(placeName, "i")}})
    .then((data) => {
    if (data) {
      res.json({ result: true, surfs: data });
    } else {
      res.json({ result: false, error: "No surf found" });
    }
  });
});



/* GET Add surfs to favorites  A MODIFIER */ 
router.put("/addFavorite/:id", (req, res) => {
  Surf.findOne({ _id: req.params.id }).then((data) => {
    if (data) {
      res.json({ result: true, addFavorite: data });
    } else {
      res.json({ result: false, error: "Surf not found" });
    }
  });
});


// Get all surfs listing from favorites for an user
router.get("/favorites", (req, res, next) => {
    User.find({ username: req.body.username })
    .populate('favorites')
    .then((data) => {
      res.json({ favorites: data.favorites });
    });
  });

/* DELETE surfs for an owner*/
router.delete("/owner/:id", (req, res) => {
  Surf.deleteOne({ _id: req.params.id }).then((deletedDoc) => {
    if (deletedDoc.deletedCount > 0) {
      // document successfully deleted
      Surf.find().then((data) => {
        res.json({ result: true, surfs: data });
      });
    } else {
      res.json({ result: false, error: "Surf not found" });
    }
  });
});

/* DELETE surfs for a tenant*/
router.delete("/tenant/:id", (req, res) => {
    Surf.deleteOne({ _id: req.params.id }).then((deletedDoc) => {
      if (deletedDoc.deletedCount > 0) {
        // document successfully deleted
        Surf.find().then((data) => {
          res.json({ result: true, surfs: data });
        });
      } else {
        res.json({ result: false, error: "Surf not found" });
      }
    });
  });
  

module.exports = router;
