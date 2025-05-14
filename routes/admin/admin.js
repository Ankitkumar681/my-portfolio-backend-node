const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const Education = require("../../models/Education");
const Experience = require("../../models/Experience");
const router = express.Router();
const authMiddleware = require('../../middlewares/auth');


// Ensure folders exist
["uploads/images", "uploads/pdfs", "uploads/videos"].forEach((folder) => {
  if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
});

// Helper to delete old file
const deleteOldFile = (filePath) => {
  if (!filePath) return;
  const fullPath = path.join(__dirname, "../../", filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = file.mimetype;
    let dir = "uploads/others";

    if (type.startsWith("image/")) dir = "uploads/images";
    else if (type === "application/pdf") dir = "uploads/pdfs";
    else if (type.startsWith("video/")) dir = "uploads/videos";

    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/\s+/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({ storage });

// POST: Update or Create Profile
router.post(
  "/update-profile", authMiddleware, 
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "profilePic2", maxCount: 1 },
    { name: "resumePdf", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized: Missing user ID" });
      }

      const {
        name,
        phoneNumber,
        degree,
        birthday,
        address,
        experience,
        aboutText
      } = req.body;

      if (!name) {
        return res.status(400).json({ message: "Name is required" });
      }

      const profilePic = req.files["profilePic"]?.[0]?.filename || null;
      const profilePic2 = req.files["profilePic2"]?.[0]?.filename || null;
      const resumePdf = req.files["resumePdf"]?.[0]?.filename || null;
      const video = req.files["video"]?.[0]?.filename || null;

      let profile = await Profile.findOne({ userId });
      const user = await User.findById(userId);

      if (profile) {
        // Delete old files if new ones are uploaded
        if (profilePic && profile.profilePic) deleteOldFile(profile.profilePic);
        if (profilePic2 && profile.profilePic2) deleteOldFile(profile.profilePic2);
        if (resumePdf && profile.pdf) deleteOldFile(profile.pdf);
        if (video && profile.video) deleteOldFile(profile.video);

        // Update existing profile
        profile.name = name;
        profile.profilePic = profilePic ? `/uploads/images/${profilePic}` : profile.profilePic;
        profile.profilePic2 = profilePic2 ? `/uploads/images/${profilePic2}` : profile.profilePic2;
        profile.pdf = resumePdf ? `/uploads/pdfs/${resumePdf}` : profile.pdf;
        profile.video = video ? `/uploads/videos/${video}` : profile.video;
        profile.aboutText = aboutText || profile.aboutText;

        await profile.save();
      } else {
        // Create new profile
        profile = new Profile({
          userId,
          name,
          profilePic: profilePic ? `/uploads/images/${profilePic}` : null,
          profilePic2: profilePic2 ? `/uploads/images/${profilePic2}` : null,
          pdf: resumePdf ? `/uploads/pdfs/${resumePdf}` : null,
          video: video ? `/uploads/videos/${video}` : null,
          aboutText,
        });
        await profile.save();
      }

      // Update user model details
      if (user) {
        user.name = name || user.name;
        user.phoneNumber = phoneNumber || user.phoneNumber;
        user.degree = degree || user.degree;
        user.birthday = birthday || user.birthday;
        user.address = address || user.address;
        user.experience = experience || user.experience;
        await user.save();
      }

      res.status(200).json({ message: "Profile saved successfully", data: profile });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// GET: Fetch Profile
router.get("/get-profile", async (req, res) => {
  try {
    let userId = req.user?.id;

    if (!userId) {
      const user = await User.findOne();
      userId = user?.id;
    }

    const profile = await Profile.findOne({ userId });
    const user = await User.findById(userId);

    if (!profile || !user) {
      return res.status(404).json({ message: "Profile or user not found" });
    }

    res.status(200).json({
      message: "Profile data fetched successfully",
      data: {
        name: profile.name,
        email: user.email,
        profilePic: profile.profilePic,
        profilePic2: profile.profilePic2 || '',
        pdf: profile.pdf,
        video: profile.video,
        aboutText: profile.aboutText || '',
        phoneNumber: user.phoneNumber || '',
        degree: user.degree || '',
        birthday: user.birthday || '',
        address: user.address || '',
        experience: user.experience || '',
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post('/add-education', authMiddleware, async (req, res) => {
  try {
    let newData = req.body;

    // console.log("Incoming body:", newData);

    // Normalize to array
    if (!Array.isArray(newData)) {
      if (typeof newData === 'object' && newData !== null) {
        newData = [newData];
      } else {
        return res.status(400).json({ error: "Invalid education data format" });
      }
    }

    // Inject userId into each object
    const userId = req.user.id;
    const educationWithUser = newData.map(entry => ({
      ...entry,
      userId,
    }));

    // Validate each object (optional but recommended)
    for (const edu of educationWithUser) {
      if (!edu.degreeName || !edu.collegeName || !edu.fromYear || !edu.toYear) {
        return res.status(400).json({ error: "Each education object must include degreeName, collegeName, fromYear, and toYear" });
      }
    }

    // Delete old entries for this user
    await Education.deleteMany({ userId });

    // Insert new ones
    const inserted = await Education.insertMany(educationWithUser);
    res.status(200).json(inserted);

  } catch (err) {
    console.error("Error in add-education:", err);
    res.status(500).json({ error: err.message });
  }
});


router.get('/get-education', async (req, res) => {
  try {
    const data = await Education.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/get-experience', async (req, res) => {
  try {
    const data = await Experience.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/add-experience', authMiddleware, async (req, res) => {
  try {
    let newData = req.body;

    // console.log("Incoming body:", newData);

    // Normalize to array
    if (!Array.isArray(newData)) {
      if (typeof newData === 'object' && newData !== null) {
        newData = [newData];
      } else {
        return res.status(400).json({ error: "Invalid Experience data format" });
      }
    }

    // Inject userId into each object
    const userId = req.user.id;
    const experienceWithUser = newData.map(entry => ({
      ...entry,
      userId,
    }));

    // Validate each object (optional but recommended)
    for (const exp of experienceWithUser) {
      if (!exp.designation || !exp.companyName || !exp.fromTime || !exp.toTime) {
        return res.status(400).json({ error: "Each Experience object must include Disignation, Company Name and Time." });
      }
    }

    // Delete old entries for this user
    await Experience.deleteMany({ userId });

    // Insert new ones
    const inserted = await Experience.insertMany(experienceWithUser);
    res.status(200).json(inserted);

  } catch (err) {
    console.error("Error in add-education:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
