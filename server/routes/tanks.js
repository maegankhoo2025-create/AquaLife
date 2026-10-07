// Aquarium CRUD routes: Jun Ying writes the logic in each handler.
// The stubs and hint comments are AI-assisted boilerplate (declare in README.txt).
//
// Every handler currently returns 501 "Not implemented". Replace each one.
// Until Yiming's login is ready, take the owner id from req.body.owner or
// req.query.owner. Later, swap that for the logged-in user (e.g. req.user.id).

const express = require('express');
const Tank = require('../models/Tank');

const router = express.Router();

// GET /api/tanks?owner=<userId>  -> list all tanks belonging to a user
router.get('/', async (req, res) => {
  // Hints: Tank.find({ owner: ... }); respond 200 with the array.
  res.status(501).json({ error: 'Not implemented' });
});

// GET /api/tanks/:id  -> one tank
router.get('/:id', async (req, res) => {
  // Hints: Tank.findById(req.params.id); 404 if null.
  // Watch out: an invalid id string throws a CastError, so respond 400 for that.
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/tanks  body: { owner, name }  -> create a tank
router.post('/', async (req, res) => {
  // Hints: Tank.create({...}); respond 201 with the new tank.
  // A missing name throws a ValidationError, so respond 400 for that.
  res.status(501).json({ error: 'Not implemented' });
});

// PATCH /api/tanks/:id/conditions  body: { temperature?, ph?, waterQuality? }
router.patch('/:id/conditions', async (req, res) => {
  // Hints: only update fields that were sent; keep min/max validation on
  // (look up the runValidators option). 404 if tank not found.
  res.status(501).json({ error: 'Not implemented' });
});

// POST /api/tanks/:id/fish  body: { speciesId, nickname? }  -> add a fish
router.post('/:id/fish', async (req, res) => {
  // Hints: find the tank, push into tank.fish, tank.save(), respond 201.
  // Later: call the compatibility check here before adding.
  res.status(501).json({ error: 'Not implemented' });
});

// DELETE /api/tanks/:id/fish/:fishId  -> remove a fish
router.delete('/:id/fish/:fishId', async (req, res) => {
  // Hints: subdocuments have .deleteOne(); or use $pull.
  res.status(501).json({ error: 'Not implemented' });
});

// DELETE /api/tanks/:id  -> delete a tank
router.delete('/:id', async (req, res) => {
  // Hints: Tank.findByIdAndDelete; 404 if nothing was deleted; else 204.
  res.status(501).json({ error: 'Not implemented' });
});

module.exports = router;
