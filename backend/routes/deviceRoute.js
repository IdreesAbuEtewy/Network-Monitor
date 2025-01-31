const express = require("express");
const validateToken = require("../middleware/validateTokenHandler");
const {
    getDevice,
    getDevices,
    addDevice,
    updateDevice,
    deleteDevice,
    scanNetwork,
    restartDevice,
    shutdownDevice,
    configureDevice,
} = require("../controllers/deviceController");

const router = express.Router();

router.get('/:id', validateToken, getDevice);
router.get('/', validateToken, getDevices);
router.post('/', validateToken, addDevice);
router.post("/scan", validateToken, scanNetwork);
router.put('/:id', validateToken, updateDevice);
router.delete('/:id', validateToken, deleteDevice);

// New routes for device control
router.post('/:id/restart', validateToken, restartDevice);
router.post('/:id/shutdown', validateToken, shutdownDevice);
router.post('/:id/configure', validateToken, configureDevice);

module.exports = router;