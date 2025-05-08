const express = require("express");
const router = express.Router();
const axios = require("axios");
const cheerio = require("cheerio");
const auth = require("../middleware/auth");
const Bookmark = require("../models/Bookmark");

// GET all bookmarks
router.get("/", auth, async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.userId }).sort({ createdAt: -1 });
    res.json(bookmarks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch bookmarks" });
  }
});

// POST: Add a bookmark
router.post("/", auth, async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    // 1. Fetch metadata from the target URL
    const { data } = await axios.get(url, { timeout: 5000 });
    const $ = cheerio.load(data);

    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text().trim() ||
      "No Title";

    const favicon = $('link[rel~="icon"]').attr("href") || "/favicon.ico";
    const fullFavicon = favicon.startsWith("http")
      ? favicon
      : new URL(favicon, url).href;

    // 2. Use r.jina.ai to summarize
    const summaryRes = await axios.get(`https://r.jina.ai/${url}`);
    const summary = summaryRes.data || "No summary available";

    // 3. Save to database
    const bookmark = await Bookmark.create({
      user: req.userId,
      url,
      title,
      favicon: fullFavicon,
      summary,
    });

    res.status(201).json(bookmark);
  } catch (err) {
    console.error("Error fetching metadata or summary:", err?.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch metadata or summary" });
  }
});

// DELETE a bookmark by ID
router.delete("/:id", auth, async (req, res) => {
  try {
    const id = req.params.id.trim(); // Trim the newline or spaces
    const bookmark = await Bookmark.findOne({ _id: id, user: req.userId });

    if (!bookmark) {
      return res.status(404).json({ error: "Bookmark not found" });
    }

    await bookmark.deleteOne();
    res.status(204).send();
  } catch (err) {
    console.error("Error deleting bookmark:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
