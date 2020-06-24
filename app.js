const express = require("express");
const ejs = require("ejs");
const _ = require("lodash");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const questionData = require(__dirname + "/custom/customQuestions.js");
const rules = require(__dirname + "/custom/customRules.js");
const topics = require(__dirname + "/custom/customTopics.js");
// import express from "express";
// import ejs from "ejs";
// import _ from "lodash";
// import {questionData} from "./questionData.js";

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
mongoose.connect("mongodb://localhost:27017/festivitiesQuizDB", {useNewUrlParser: true, useUnifiedTopology: true});


const buttonSchema = new mongoose.Schema({
  name: String
});
const Button = mongoose.model("Button", buttonSchema);


const scoreSchema = new mongoose.Schema({
  team: String,
  score: Number
});
const Score = mongoose.model("Score", scoreSchema);

Score.find(function(err, scores){
  if (!err){
    if (scores.length === 0){
      const newScoreA = new Score({
        team: "A",
        score: 0
      });
      newScoreA.save();
      const newScoreB = new Score({
        team: "B",
        score: 0
      });
      newScoreB.save();
    }
  }
});


var qnNoToEdit = "";
var scoreA = 0;
var scoreB = 0;


app.get("/", function(req, res) {

  Score.find(function(err, scores){
    if (err){
      console.log(err);
    } else {
      scoreA = scores[0].score;
      scoreB = scores[1].score;
    }
  });

  Button.deleteMany({name: qnNoToEdit}, function(err){
    if (err){
      console.log(err);
    } else {
      // console.log("Entry removed");
      qnNoToEdit = "";
    }
  });

  Button.find(function(err, buttons){
    if (err){
      console.log(err);
    } else {
      res.render("home", {topics: topics, buttonList: buttons, qnNoToEdit: qnNoToEdit, scoreA: scoreA, scoreB: scoreB});
    }
  });
});


app.get("/rules", function(req, res) {
  res.render("rules", {rulesArray: rules});
})


app.get("/question/:questionNo", function(req, res) {

  const reqQn = req.params.questionNo;

  questionData.forEach(function(question){
    if (question.questionNo === reqQn) {
      const displayedQ = question.questionQ;
      const displayedA = question.questionA;
      res.render("question", {questionNo: _.capitalize(reqQn), question: displayedQ, answer: displayedA});
    }
  });

  function disableButton(reqQn){
    const newButton = new Button({
      name: reqQn
    });
    newButton.save();
    // Button.updateOne({name: reqQn}, {name: reqQn}, {upsert: true});
  }
  disableButton(reqQn);
});


app.post("/scores", function(req, res) {
  const teamName = Object.keys(req.body)[0];

  if (teamName === "teamA") {
    Score.updateOne({team: "A"}, {team: "A", score: req.body.teamA}, function(err){
      if (!err){
        console.log("Successfully updated");
        res.redirect("/");
      }
    });
  } else if (teamName === "teamB") {
    Score.updateOne({team: "B"}, {team: "B", score: req.body.teamB}, function(err){
      if (!err){
        console.log("Successfully updated");
        res.redirect("/");
      }
    });
  }
});


app.post("/powerup", function(req, res) {

  function disableButton(reqPowerup){
    const newButton = new Button({
      name: reqPowerup
    });
    newButton.save();
    // Button.updateOne({name: reqQn}, {name: reqQn}, {upsert: true});
  }
  disableButton(req.body.name);
  res.redirect("/");
});


app.post("/edit", function(req, res) {
  qnNoToEdit = req.body.qnToEdit;
  res.redirect("/");
});


app.post("/reset", function(req, res) {

  Button.deleteMany({}, function(err){
    if (!err){
      console.log("All button entries removed");

      Score.updateMany({$or: [{team: "A"}, {team: "B"}]}, {$set: {score: 0}}, function(err){
        if (!err){
          console.log("All scores resetted");

          res.redirect("/");
        }
      });
    }
  });
});


app.listen(3000, function(){
  console.log("Server is running on port 3000");
});
