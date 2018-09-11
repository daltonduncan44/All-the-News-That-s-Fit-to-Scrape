var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");
var request = require("request");
// Require all models
//var db = require("./models");

var PORT = 8080;

var Note = require("./models/Note.js");
var Article = require("./models/Article.js");

// Initialize Express
var app = express();
// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));


// Connect to the Mongo DB
mongoose.connect("mongodb://localhost/scraperNoteHW", { useNewUrlParser: true });
var db = mongoose.connection;



// Routes

// A GET request to scrape the echojs website
app.get("/scrape", function(req, res) {
  // First, we grab the body of the html with request
  request("http://www.espn.com/nba/team/_/name/orl/orlando-magic", function(error, response, html) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(html);
    // Now, we grab every h1 within an article tag, and do the following:
    $("article h1").each(function(i, element) {

      // Save an empty result object
      var result = {};

      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this).children("a").text();
      result.link = $(this).children("a").attr("href");

      // Create a new Article using the `result` object built from scraping
      // This effectively passes the result object to the entry (and the title and link)
      var entry = new Article(result);
      console.log(entry);
      // Now, save that entry to the db
      entry.save(function(err, doc) {
        // Log  errors
        if (err) {
          console.log(err);
        }
        // Or log doc
        else {
          console.log(doc);
        }
      });

    });
  });
  // If we were able to successfully scrape and save an Article, send a message to the client
  res.send("Scrape Complete");
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every doc in the Articles collection
  Article.find({}, function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Or send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  Article.findOne({ "_id": req.params.id })
  // ..and populate all of the notes associated with it
  .populate("note")
  // now, execute our query
  .exec(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise, send the doc to the browser as a json object
    else {
      res.json(doc);
    }
  });
});


// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  var newNote = new Note(req.body);

  // And save the new note the db
  newNote.save(function(error, doc) {
    // Log any errors
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      // Use the article id to find and update it's note
      Article.findOneAndUpdate({ "_id": req.params.id }, { "note": doc._id })
      // Execute the above query
      .exec(function(err, doc) {
        // Log any errors
        if (err) {
          console.log(err);
        }
        else {
          // Or send the document to the browser
          res.send(doc);
        }
      });
    }
  });
});

// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });