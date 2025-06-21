require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoute = require("./route/authRoutes");
const userRoutes = require("./route/userRoutes");
const barangRoutes = require("./route/barangRoutes");
const peminjamanRoutes = require("./route/peminjamanRoutes");
const logRoutes = require("./route/logRoutes");
const dashboardRoutes = require("./route/dashboardRoutes");
const siswaRoutes = require("./route/siswaRoutes");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/auth", authRoute);
app.use("/api/users", userRoutes);
app.use("/api/barang", barangRoutes);
app.use("/api/peminjaman", peminjamanRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/siswa", siswaRoutes);

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

app.use("/api/dashboard", dashboardRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
