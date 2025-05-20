const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
app.use(cors({ origin: ["https://book-recommender-steel.vercel.app", "http://localhost:3000"] }));
const PORT = process.env.PORT || 4000;

app.get("/recommend", async (req, res) => {
  const { genre, subgenre } = req.query;

  if (!genre) {
    return res.status(400).json({ error: "Genre is required" });
  }

  const trySearch = async (query) => {
    const searchUrl = `https://www.goodreads.com/search?q=${encodeURIComponent(query)}`;
    console.log("Searching Goodreads:", searchUrl);

    try {
      const response = await axios.get(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        timeout: 10000,
      });

      const $ = cheerio.load(response.data);
      const books = [];

      $("tr[itemtype='http://schema.org/Book']").each((i, el) => {
        try {
          const title = $(el).find("a.bookTitle span").text().trim();
          const author = $(el).find("a.authorName span").text().trim();
          let cover = $(el).find("img").attr("src") || "";

          // Enlarge the image if possible
          cover = cover.replace(/_S[XY]\d+_/, "_SY475_");

          if (title && author && cover) {
            books.push({ title, author, cover });
          }
        } catch (innerErr) {
          console.warn("Book parsing failed:", innerErr.message);
        }
      });

      console.log(`Found ${books.length} books for query: "${query}"`);
      return books;
    } catch (err) {
      console.error("Scraping error:", err.message);
      return [];
    }
  };

  let books = await trySearch(`${genre} ${subgenre || ""}`);

  if (books.length === 0 && subgenre) {
    books = await trySearch(genre);
  }

  if (books.length === 0) {
    console.warn("No books found. Sending fallback.");
    return res.status(200).json({
      title: "No Match Found",
      author: "BookBot",
      cover: "https://via.placeholder.com/150?text=No+Book+Found",
    });
  }

  const randomBook = books[Math.floor(Math.random() * books.length)];
  return res.json(randomBook);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
