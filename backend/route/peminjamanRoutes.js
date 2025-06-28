const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const peminjamanController = require("../controllers/peminjamanController");

const validatePeminjaman = [
  body("barang")
    .notEmpty()
    .withMessage("Field barang wajib diisi")
    .isMongoId()
    .withMessage("barang harus berupa ObjectId"),
  body("peminjamType")
    .notEmpty()
    .withMessage("Field peminjamType wajib diisi")
    .isIn(["siswa", "lainnya"])
    .withMessage("peminjamType harus 'siswa' atau 'lainnya'"),

  body("peminjamSiswa")
    .if(body("peminjamType").equals("siswa"))
    .notEmpty()
    .withMessage("peminjamSiswa wajib diisi jika peminjamType 'siswa'")
    .isMongoId()
    .withMessage("peminjamSiswa harus berupa ObjectId"),

  body("peminjamNama")
    .if(body("peminjamType").equals("lainnya"))
    .notEmpty()
    .withMessage("peminjamNama wajib diisi jika peminjamType 'lainnya'"),
  body("peminjamAsal")
    .if(body("peminjamType").equals("lainnya"))
    .notEmpty()
    .withMessage("peminjamAsal wajib diisi jika peminjamType 'lainnya'"),

  body("isConsumable")
    .notEmpty()
    .withMessage("Field isConsumable wajib diisi")
    .isBoolean()
    .withMessage("isConsumable harus boolean"),

  body("jumlah")
    .if(body("isConsumable").equals("true"))
    .notEmpty()
    .withMessage("jumlah wajib diisi jika isConsumable true")
    .bail()
    .isInt({ min: 1 })
    .withMessage("jumlah harus integer ≥ 1"),

  body("unitKodes")
    .if(body("isConsumable").equals("false"))
    .isArray({ min: 1 })
    .withMessage(
      "unitKodes wajib array minimal satu elemen jika isConsumable false"
    ),
  body("unitKodes.*")
    .if(body("isConsumable").equals("false"))
    .isString()
    .withMessage("Setiap elemen unitKodes harus string kode unit"),

  body("keterangan").optional().isString(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

router.get("/", peminjamanController.getAll);
router.get("/history", peminjamanController.getHistory);

router.post("/", validatePeminjaman, peminjamanController.create);

router.put("/approve/:id", peminjamanController.approve);
router.put("/reject/:id", peminjamanController.reject);

router.put("/:id/return", peminjamanController.returnItem);

router.delete("/:id", peminjamanController.delete);

module.exports = router;
