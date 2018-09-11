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
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();