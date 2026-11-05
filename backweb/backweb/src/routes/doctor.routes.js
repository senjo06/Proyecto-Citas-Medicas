// backend/src/routes/doctor.routes.js
const express = require('express');
const router = express.Router();
const DoctorController = require('../controllers/doctor.controller');

router.get('/', DoctorController.getAll);
router.get('/:id', DoctorController.getById);
router.post('/', DoctorController.create);
router.put('/:id', DoctorController.update);
router.delete('/:id', DoctorController.remove);

module.exports = router;
