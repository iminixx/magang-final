const express = require("express");
const router = express.Router();
const barangController = require("../controllers/barangController");
const { body, validationResult } = require("express-validator");
const attachUser = require("../middleware/attachUser");

const validateBarang = [
  body("nama").notEmpty().withMessage("Nama barang wajib diisi"),
  body("jurusan")
    .notEmpty()
    .withMessage("Jurusan wajib diisi")
    .isIn(["RPL", "DKV", "TKJ"])
    .withMessage("Jurusan tidak valid"),
  body("tipe")
    .notEmpty()
    .withMessage("Tipe wajib diisi")
    .isIn(["habis_pakai", "tidak_habis_pakai"])
    .withMessage("Tipe tidak valid"),

  body("stok")
    .if(body("tipe").equals("habis_pakai"))
    .notEmpty()
    .withMessage("Stok wajib diisi untuk tipe habis_pakai")
    .bail()
    .isInt({ min: 0 })
    .withMessage("Stok harus integer ≥ 0"),
  body("status")
    .if(body("tipe").equals("habis_pakai"))
    .notEmpty()
    .withMessage("Status wajib diisi untuk tipe habis_pakai")
    .bail()
    .isIn(["tersedia", "rusak", "hilang"])
    .withMessage("Status tidak valid"),

  body("units")
    .if(body("tipe").equals("tidak_habis_pakai"))
    .isArray({ min: 1 })
    .withMessage(
      "Units wajib berupa array minimal satu elemen untuk tipe tidak_habis_pakai"
    ),
  body("units.*.kode")
    .if(body("tipe").equals("tidak_habis_pakai"))
    .notEmpty()
    .withMessage("Setiap unit harus memiliki kode"),
  body("units.*.status")
    .if(body("tipe").equals("tidak_habis_pakai"))
    .notEmpty()
    .withMessage("Setiap unit harus memiliki status")
    .bail()
    .isIn(["tersedia", "dipinjam", "rusak", "hilang"])
    .withMessage("Status unit tidak valid"),

  body("maxDurasiPinjam")
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage("maxDurasiPinjam harus bilangan bulat ≥ 1"),

  body("deskripsi").optional().isString(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

router.use(attachUser);
router.get("/search", barangController.searchBarang);
router.get("/", barangController.getAllBarang);
router.post("/", validateBarang, barangController.addBarang);
router.put("/:id", validateBarang, barangController.updateBarang);
router.delete("/:id", barangController.deleteBarang);
router.get("/nextKode", barangController.getNextKodeUnit);
router.post("/import", barangController.importBarangCSV);
router.put("/unit/:kode/kembalikan", barangController.kembalikanUnit);

module.exports = router;
