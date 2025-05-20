const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");

const app = express();
app.use(cors({
  origin: "https://book-recommender-steel.vercel.app"
}));
const PORT = 4000;

app.get("/recommend", async (req, res) => {
  const { genre, subgenre } = req.query;
  if (!genre) {
    return res.status(400).json({ error: "Genre is required" });
  }

  const trySearch = async (query) => {
    const searchUrl = `https://www.goodreads.com/search?q=${encodeURIComponent(book.title + " " + book.author)}`;
    try {
      const response = await axios.get(searchUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0" 
        }
      });

      const $ = cheerio.load(response.data);
      const books = [];

      $("tr[itemtype='http://schema.org/Book']").each((i, el) => {
        const title = $(el).find("a.bookTitle span").text().trim();
        const author = $(el).find("a.authorName span").text().trim();
        let cover = $(el).find("img").attr("src");
        cover = cover?.replace(/_S[XY]\d+_/, "_SY475_");

        if (title && author && cover) {
          books.push({ title, author, cover });
        }
      });

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
    return res.status(404).json({ error: "No books found for your query" });
  }

  const randomBook = books[Math.floor(Math.random() * books.length)];
  res.json(randomBook);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});