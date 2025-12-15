// test/books.test.js
const mongoose = require("mongoose");
const request = require("supertest");
const { expect } = require("chai"); // Destructure expect from chai
require("dotenv").config();

// Import app and model
const app = require("../app"); 
const Book = require("../models/Book");

describe("Books API & Model", () => {
  // 1. Connect to TEST DB before running any tests
  before(async () => {
    // If connection is already open, disconnect (avoids hot reload issues)
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(process.env.MONGODB_TEST_URI);
  });

  // 2. Clean the database after every single test case
  afterEach(async () => {
    await Book.deleteMany({});
  });

  // 3. Close connection after all tests finish
  after(async () => {
    await mongoose.connection.close();
  });

  // --- UNIT TESTS: MODEL LOGIC ---
  describe("Model Validation Logic", () => {
    it("should default copiesAvailable to copiesTotal if missing", async () => {
      const bookData = {
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        isbn: "9780547928227",
        copiesTotal: 10,
        // copiesAvailable omitted
      };

      const book = await Book.create(bookData);
      
      expect(book.copiesAvailable).to.equal(10);
      expect(book.copiesAvailable).to.equal(book.copiesTotal);
    });

   it("should throw validation error if copiesAvailable > copiesTotal", async () => {
      const bookData = {
        title: "Bad Math",
        author: "Unknown",
        isbn: "00000",
        copiesTotal: 5,
        copiesAvailable: 100, // Invalid
      };

      let error = null;
      try {
        const createdBook = await Book.create(bookData);
        // If we reach here, the book was created (which is BAD)
        console.log("⚠️ TEST FAILED: Book was created unexpectedly:", createdBook); 
      } catch (err) {
        error = err;
      }

      // Check if error exists
      expect(error).to.exist; 
      
      // If error exists, check the message
      if (error) {
         // The error could be a generic validation error or our custom error
         // Mongoose errors are usually inside error.errors['fieldName']
         const msg = error.errors?.copiesAvailable?.message || error.message;
         expect(msg).to.include("cannot exceed");
      }
    });
  });

  // --- INTEGRATION TESTS: API ENDPOINTS ---
  describe("GET /api/books", () => {
    it("should return an empty array initially", async () => {
      const res = await request(app).get("/api/books");
      
      expect(res.status).to.equal(200);
      expect(res.body).to.be.an("array");
      expect(res.body.length).to.equal(0);
    });

    it("should return a list of books", async () => {
      // Seed DB
      await Book.create({ title: "Book A", author: "Auth A", isbn: "123", copiesTotal: 2 });
      await Book.create({ title: "Book B", author: "Auth B", isbn: "456", copiesTotal: 2 });

      const res = await request(app).get("/api/books");
      
      expect(res.status).to.equal(200);
      expect(res.body.length).to.equal(2);
      expect(res.body[0]).to.have.property("title");
    });

    it("should search books by text index (title/author)", async () => {
      // Seed DB with specific keywords
      await Book.create([
        { title: "React Design Patterns", author: "Dev A", isbn: "1", copiesTotal: 1 },
        { title: "Cooking 101", author: "Chef B", isbn: "2", copiesTotal: 1 }
      ]);

      // Search for "React"
      const res = await request(app).get("/api/books?search=React");
      
      expect(res.status).to.equal(200);
      expect(res.body.length).to.equal(1);
      expect(res.body[0].title).to.equal("React Design Patterns");
    });
  });

  describe("GET /api/books/:id", () => {
    it("should return a specific book by ID", async () => {
      const book = await Book.create({ 
        title: "Single Book", author: "Me", isbn: "777", copiesTotal: 5 
      });

      const res = await request(app).get(`/api/books/${book._id}`);
      
      expect(res.status).to.equal(200);
      expect(res.body.title).to.equal("Single Book");
      expect(res.body.isbn).to.equal("777");
    });

    it("should return 404 for invalid/non-existent ID", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/books/${fakeId}`);
      
      expect(res.status).to.equal(404);
      expect(res.body.message).to.equal("Not found");
    });
  });
});