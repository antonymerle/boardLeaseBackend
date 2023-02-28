var express = require("express");
var router = express.Router();
const Surf = require("../models/surfs");
const User = require("../models/users");

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
  });
  newSurf.save().then(() => {
    res.json({ result: true });
  });
});

/* GET all surfs listing */
router.get("/surfs", (req, res) => {
  Surf.find().then((data) => {
    res.json({ surfs: data });
  });
});

/* POST all surfs for a place and dates */
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
});

/* PUT Add surfs to favorites for an user */
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
