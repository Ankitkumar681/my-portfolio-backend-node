const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const nodemailer = require("nodemailer");
const Profile = require("../../models/Profile");
const User = require("../../models/User");
const Education = require("../../models/Education");
const Experience = require("../../models/Experience");
const router = express.Router();
const authMiddleware = require("../../middlewares/auth");
const Skill = require("../../models/Skill");
const Service = require("../../models/Service");
const Technology = require("../../models/Technology");
const Blog = require("../../models/Blog");
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
  "/update-profile",
  authMiddleware,
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
        return res
          .status(401)
          .json({ message: "Unauthorized: Missing user ID" });
      }

      const {
        name,
        phoneNumber,
        degree,
        birthday,
        address,
        experience,
        aboutText,
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
        if (profilePic2 && profile.profilePic2)
          deleteOldFile(profile.profilePic2);
        if (resumePdf && profile.pdf) deleteOldFile(profile.pdf);
        if (video && profile.video) deleteOldFile(profile.video);

        // Update existing profile
        profile.name = name;
        profile.profilePic = profilePic
          ? `/uploads/images/${profilePic}`
          : profile.profilePic;
        profile.profilePic2 = profilePic2
          ? `/uploads/images/${profilePic2}`
          : profile.profilePic2;
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

      res
        .status(200)
        .json({ message: "Profile saved successfully", data: profile });
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
        profilePic2: profile.profilePic2 || "",
        pdf: profile.pdf,
        video: profile.video,
        aboutText: profile.aboutText || "",
        phoneNumber: user.phoneNumber || "",
        degree: user.degree || "",
        birthday: user.birthday || "",
        address: user.address || "",
        experience: user.experience || "",
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post("/add-education", authMiddleware, async (req, res) => {
  try {
    let newData = req.body;

    // console.log("Incoming body:", newData);

    // Normalize to array
    if (!Array.isArray(newData)) {
      if (typeof newData === "object" && newData !== null) {
        newData = [newData];
      } else {
        return res.status(400).json({ error: "Invalid education data format" });
      }
    }

    // Inject userId into each object
    const userId = req.user.id;
    const educationWithUser = newData.map((entry) => ({
      ...entry,
      userId,
    }));

    // Validate each object (optional but recommended)
    for (const edu of educationWithUser) {
      if (!edu.degreeName || !edu.collegeName || !edu.fromYear || !edu.toYear) {
        return res
          .status(400)
          .json({
            error:
              "Each education object must include degreeName, collegeName, fromYear, and toYear",
          });
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

router.get("/get-education", async (req, res) => {
  try {
    const data = await Education.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get("/get-experience", async (req, res) => {
  try {
    const data = await Experience.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/add-experience", authMiddleware, async (req, res) => {
  try {
    let newData = req.body;

    // console.log("Incoming body:", newData);

    // Normalize to array
    if (!Array.isArray(newData)) {
      if (typeof newData === "object" && newData !== null) {
        newData = [newData];
      } else {
        return res
          .status(400)
          .json({ error: "Invalid Experience data format" });
      }
    }

    // Inject userId into each object
    const userId = req.user.id;
    const experienceWithUser = newData.map((entry) => ({
      ...entry,
      userId,
    }));

    // Validate each object (optional but recommended)
    for (const exp of experienceWithUser) {
      if (
        !exp.designation ||
        !exp.companyName ||
        !exp.fromTime ||
        !exp.toTime
      ) {
        return res
          .status(400)
          .json({
            error:
              "Each Experience object must include Disignation, Company Name and Time.",
          });
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
router.get("/get-skill", async (req, res) => {
  try {
    const data = await Skill.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/add-skill", authMiddleware, async (req, res) => {
  try {
    let newData = req.body;
    // Normalize to array
    // console.log("Incoming body:", newData);
    if (!Array.isArray(newData)) {
      if (typeof newData === "object" && newData !== null) {
        newData = [newData];
      } else {
        return res.status(400).json({ error: "Invalid Skill data format" });
      }
    }
    // Inject userId into each object
    const userId = req.user.id;
    const skillWithUser = newData.map((entry) => ({
      ...entry,
      userId,
    }));
    // Validate each object (optional but recommended)
    for (const skill of skillWithUser) {
      if (!skill.name || !skill.percentage || !skill.color) {
        return res
          .status(400)
          .json({
            error: "Each Skill object must include Name, Percentage and Color.",
          });
      }
    }

    // Delete old entries for this user
    await Skill.deleteMany({ userId });
    // Insert new ones
    const inserted = await Skill.insertMany(skillWithUser);
    res.status(200).json(inserted);
  } catch (err) {
    console.error("Error in add-skill:", err);
    res.status(500).json({ error: err.message });
  }
});
router.get("/get-services", async (req, res) => {
  try {
    const data = await Service.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/add-services", authMiddleware, async (req, res) => {
  try {
    let newData = req.body;
    // Normalize to array
    // console.log("Incoming body:", newData);
    if (!Array.isArray(newData)) {
      if (typeof newData === "object" && newData !== null) {
        newData = [newData];
      } else {
        return res.status(400).json({ error: "Invalid Skill data format" });
      }
    }
    // Inject userId into each object
    const userId = req.user.id;
    const serviceWithUser = newData.map((entry) => ({
      ...entry,
      userId,
    }));
    // Validate each object (optional but recommended)
    for (const service of serviceWithUser) {
      if (!service.title || !service.description) {
        return res
          .status(400)
          .json({
            error: "Each Service object must include Title and Description.",
          });
      }
    }

    // Delete old entries for this user
    await Service.deleteMany({ userId });
    // Insert new ones
    const inserted = await Service.insertMany(serviceWithUser);
    res.status(200).json(inserted);
  } catch (err) {
    console.error("Error in add-services:", err);
    res.status(500).json({ error: err.message });
  }
});
router.post(
  "/add-technology",
  authMiddleware,
  upload.array("images"),
  async (req, res) => {
    try {
      const userId = req.user.id;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: "No images provided." });
      }

      // Remove previous entries for the user (if desired)
      const oldTech = await Technology.find({ userId });
      for (const tech of oldTech) {
        if (tech.image) deleteOldFile(tech.image);
      }
      await Technology.deleteMany({ userId });

      // Save new entries
      const newTechs = req.files.map((file) => ({
        userId,
        image: `/uploads/images/${file.filename}`,
      }));

      const inserted = await Technology.insertMany(newTechs);
      res
        .status(200)
        .json({ message: "Technologies added successfully", data: inserted });
    } catch (err) {
      console.error("Error in add-technology:", err);
      res.status(500).json({ error: err.message });
    }
  }
);
router.get("/get-technology", async (req, res) => {
  try {
    const data = await Technology.find().select("image -_id");
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post("/contact", async (req, res) => {
  const { name, email, subject, message } = req.body;

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER, // Use the email from .env
      pass: process.env.EMAIL_PASS, // Use the password from .env
    },
  });

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: `Portfolio Message: ${subject}`,
    text: `From: ${name}\nEmail: ${email}\n\n${message}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Message sent successfully" });
  } catch (err) {
    res.status(500).json({ error: "Message failed to send" });
  }
});
router.post(
  "/add-blog",
  authMiddleware,
  upload.fields([
    { name: "thumbnail", maxCount: 1 },
    { name: "images", maxCount: 10 },
  ]),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const { title, description } = req.body;

      if (!title || !description) {
        return res
          .status(400)
          .json({ error: "Title and Description are required." });
      }

      const thumbnail = req.files["thumbnail"]?.[0]?.filename
        ? `/uploads/images/${req.files["thumbnail"][0].filename}`
        : null;

      const images = (req.files["images"] || []).map(
        (file) => `/uploads/images/${file.filename}`
      );

      if (!thumbnail) {
        return res.status(400).json({ error: "Thumbnail image is required." });
      }

      const blog = new Blog({
        userId,
        title,
        thumbnail,
        images,
        description,
      });

      await blog.save();
      res.status(200).json({ message: "Blog saved successfully", data: blog });
    } catch (err) {
      console.error("Error adding blog:", err);
      res.status(500).json({ error: err.message });
    }
  }
);
router.get('/homepage-blogs', async (req, res) => {
  try {
    const blogs = await Blog.find({}, 'title thumbnail createdAt').sort({ createdAt: -1 }).limit(6);
    // 'title thumbnail createdAt' means only these fields are selected.
    // MongoDB automatically includes _id, so you get id as well.

    res.status(200).json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
router.get("/blog/:id", async (req, res) => {
  try {
    const blogId = req.params.id;

    const blog = await Blog.findById(blogId).lean();

    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    res.status(200).json(blog);
  } catch (err) {
    console.error("Error fetching blog:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/get-blogs", async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 }); // latest first
    res.json(blogs);
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({ message: "Server error fetching blogs." });
  }
});
const deleteFile = async (filePath) => {
  if (!filePath) return;
  
  try {
    // If filePath is relative, convert to absolute path
    // Adjust `uploads` or your base folder accordingly
    const absolutePath = path.isAbsolute(filePath) 
      ? filePath 
      : path.join(__dirname, "..", "uploads", filePath);
    
    // Check if file exists before deleting
    await fs.access(absolutePath);
    
    await fs.unlink(absolutePath);
    console.log(`Deleted file: ${absolutePath}`);
  } catch (error) {
    if (error.code === "ENOENT") {
      console.warn(`File not found (already deleted?): ${filePath}`);
    } else {
      console.error(`Failed to delete file ${filePath}:`, error);
    }
  }
};

router.delete("/delete-blog/:id", async (req, res) => {
  try {
    const blogId = req.params.id;
    const blog = await Blog.findById(blogId);
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });

    // Await deletions
    if (blog.thumbnail) {
      await deleteFile(blog.thumbnail);
    }

    if (Array.isArray(blog.images)) {
      for (const imgPath of blog.images) {
        await deleteFile(imgPath);
      }
    }

    await Blog.findByIdAndDelete(blogId);
    res.json({ success: true, message: "Blog and related files deleted successfully" });
  } catch (error) {
    console.error("Error deleting blog:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
module.exports = router;
