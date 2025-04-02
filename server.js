const express = require("express");
const mongoose = require("mongoose");
const moment = require("moment-timezone");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 3000;


app.use(cors());
app.use(express.json());

// เชื่อมต่อกับ MongoDB
mongoose.connect("mongodb+srv://muhammadlutfim:SUjTSNIMjugTrgWq@mydb.16hil.mongodb.net/?retryWrites=true&w=majority&appName=mydb", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log("📌 MongoDB Connected"))
  .catch(err => console.error("❌ MongoDB Connection Error:", err));

// สร้าง Schema
const rfidSchema = new mongoose.Schema({
    uid: String,
    user: String,
    timestamp: {
        type: String,
        default: () => moment().tz("Asia/Bangkok").format("YYYY-MM-DD HH:mm:ss")
    }
});

const RFIDLog = mongoose.model("RFIDLog", rfidSchema);

// ✅ เพิ่มข้อมูล (POST)
app.post("/api/rfid", async (req, res) => {
    try {
        const { uid, user } = req.body;
        const newEntry = new RFIDLog({ uid, user });
        await newEntry.save();
        console.log(`✅ บันทึก RFID: UID=${uid}, User=${user}, Time=${newEntry.timestamp}`);
        res.status(200).json({ message: "Data saved successfully", uid, user, timestamp: newEntry.timestamp });
    } catch (error) {
        console.error("❌ Error saving to MongoDB:", error);
        res.status(500).json({ message: "Error saving data" });
    }
});

// 🔍 ดึงข้อมูลทั้งหมด (GET)
app.get('/api/get', async (req, res) => {
    try {
        let result = await RFIDLog.find();
        res.json(result);
    } catch (error) {
        console.error("❌ Error retrieving data:", error);
        res.status(500).json({ message: "Error retrieving data" });
    }
});

// 🗑 ลบข้อมูลทั้งหมด (DELETE)
app.delete("/api/rfid", async (req, res) => {
    try {
        const result = await RFIDLog.deleteMany({});
        console.log(`🗑 ลบข้อมูลทั้งหมด: ${result.deletedCount} รายการ`);
        res.status(200).json({ message: "All data deleted successfully", deletedCount: result.deletedCount });
    } catch (error) {
        console.error("❌ Error deleting all data:", error);
        res.status(500).json({ message: "Error deleting all data" });
    }
});

// ✏️ แก้ไขข้อมูล (PUT)
app.put("/api/rfid/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { uid, user } = req.body;

        const updatedEntry = await RFIDLog.findByIdAndUpdate(
            id, 
            { uid, user, timestamp: moment().tz("Asia/Bangkok").format("YYYY-MM-DD HH:mm:ss") }, 
            { new: true } // ให้คืนค่าข้อมูลที่ถูกอัปเดตกลับมา
        );

        if (!updatedEntry) {
            return res.status(404).json({ message: "Data not found" });
        }

        console.log(`🔄 แก้ไข RFID: ID=${id}, UID=${uid}, User=${user}, Time=${updatedEntry.timestamp}`);
        res.status(200).json({ message: "Data updated successfully", data: updatedEntry });

    } catch (error) {
        console.error("❌ Error updating data:", error);
        res.status(500).json({ message: "Error updating data" });
    }
});

// 🗑 ลบข้อมูล (DELETE)
app.delete("/api/rfid/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deletedEntry = await RFIDLog.findByIdAndDelete(id);

        if (!deletedEntry) {
            return res.status(404).json({ message: "Data not found" });
        }

        console.log(`🗑 ลบ RFID: ID=${id}`);
        res.status(200).json({ message: "Data deleted successfully" });

    } catch (error) {
        console.error("❌ Error deleting data:", error);
        res.status(500).json({ message: "Error deleting data" });
    }
});

// สร้าง Schema สำหรับบัตรที่อนุญาต
const allowedCardSchema = new mongoose.Schema({
    uid: String,
    user: String
});
const AllowedCard = mongoose.model("AllowedCard", allowedCardSchema);

// ✅ เพิ่มบัตรที่อนุญาต (POST)
app.post("/api/rfid/allowlist", async (req, res) => {
    try {
        const { uid, user } = req.body;
        const existingCard = await AllowedCard.findOne({ uid });

        if (existingCard) {
            return res.status(400).json({ message: "UID นี้มีอยู่แล้ว" });
        }

        const newCard = new AllowedCard({ uid, user });
        await newCard.save();
        res.status(200).json({ message: "บัตรถูกเพิ่มเรียบร้อย", uid, user });
    } catch (error) {
        res.status(500).json({ message: "เกิดข้อผิดพลาด" });
    }
});

// 🔍 ดึงรายการบัตรที่อนุญาต (GET)
app.get("/api/rfid/allowlist", async (req, res) => {
    try {
        const cards = await AllowedCard.find();
        res.json(cards);
    } catch (error) {
        res.status(500).json({ message: "เกิดข้อผิดพลาด" });
    }
});


app.listen(port, () => {
    console.log(`🚀 Server running on ${port}`);
});
