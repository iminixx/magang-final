const express = require("express");
const router = express.Router();
const siswaController = require("../controllers/siswaController");

router.get("/", siswaController.getAll);
router.get("/filter", siswaController.getByJurusanKelas);
router.post("/", siswaController.create);
router.put("/:id", siswaController.update);
router.delete("/:id", siswaController.delete);
router.post("/validate-pin", siswaController.validatePin);
router.post("/import", siswaController.importCSV);
router.post("/batch-delete", siswaController.batchDelete);
router.post("/batch-update", siswaController.batchUpdate);

module.exports = router;
