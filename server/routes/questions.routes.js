const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
// const authenticate = require("../middleware/authenticate");

let userId = ""; 

//will define questions category 0-4 as there is 5 categories
let currentCategoryIndex = 0;
//represents current question to be displayed
let currentQuestion;
// strike questions count
let strikeAnswersCount = 0;
let strikeOfWrongAnswersCount = 0;

// right anwers by category count
let rightAnswersFromA = 0;
let rightAnswersFromB = 0;
let rightAnswersFromC = 0;
let rightAnswersFromD = 0;
let rightAnswersFromE = 0;
// skipped answers by category
let skippedAnswersFromA = 0;
let skippedAnswersFromB = 0;
let skippedAnswersFromC = 0;
let skippedAnswersFromD = 0;
let skippedAnswersFromE = 0;

// right anwers by category count
let lastIndexFromA = 0;
let lastIndexFromB = 0;
let lastIndexFromC = 0;
let lastIndexFromD = 0;
let lastIndexFromE = 0;

//cache questions from json
let questionsFromJson = [];
//array of arrays sorted by category
let questionsByCategory = [];

///categories of questions
let catA = [];
let catB = [];
let catC = [];
let catD = [];
let catE = [];


//create a question model
const Question = require("../models/question-schema");

const Result = require("../models/result-schema");

//GET mapping get all questions
router.get("/", /*authenticate,*/ (req, res) => {
  //session=req.session;
    //will define questions category 0-4 as there is 5 categories
//   if(!session.paidToken) {
//     res.redirect("/profile");
//   }

  currentCategoryIndex = 0;

  currentQuestion = {};
  strikeAnswersCount = 0;
  strikeOfWrongAnswersCount = 0;

  rightAnswersFromA = 0;
  rightAnswersFromB = 0;
  rightAnswersFromC = 0;
  rightAnswersFromD = 0;
  rightAnswersFromE = 0;

  skippedAnswersFromA = 0;
  skippedAnswersFromB = 0;
  skippedAnswersFromC = 0;
  skippedAnswersFromD = 0;
  skippedAnswersFromE = 0;


  lastIndexFromA = 0;
  lastIndexFromB = 0;
  lastIndexFromC = 0;
  lastIndexFromD = 0;
  lastIndexFromE = 0;


  questionsFromJson = [];

  questionsByCategory = [];

  catA = [];
  catB = [];
  catC = [];
  catD = [];
  catE = [];


  //userId = req.user.user_id;
  //console.log(userId)
    Question.find()
        .exec()
        .then((questions) => {
            questionsFromJson = [];
            console.log("Getting Questions - Success");
            for (var i = 0; i < questions.length; i++) {
                // console.log(questions[i]);
                questionsFromJson.push(questions[i]);
            }
            catA = questionsFromJson.filter(
                (question) => question.question_category == "A"
            );
            catB = questionsFromJson.filter(
                (question) => question.question_category == "B"
            );
            catC = questionsFromJson.filter(
                (question) => question.question_category == "C"
            );
            catD = questionsFromJson.filter(
                (question) => question.question_category == "D"
            );
            catE = questionsFromJson.filter(
                (question) => question.question_category == "E"
            );
            questionsByCategory.push(catA, catB, catC, catD, catE);

            // res.status(200).send(questionsFromJson);
            // res.render('index', { question: catE[0].question_body, answers: catE[0].question_answers });
            currentQuestion = catA[0];
            // res.render("questions", { question: questionsByCategory[0][0] });
            res.send({ question: questionsByCategory[0][0] });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).send("Unable to retrieve data, status - 500");
        });
});

//when you press submit answer it will trigger this method
router.post("/nextQuestion", /*authenticate,*/ (req, res) => {
    let currentQuestionIndex = questionsByCategory[currentCategoryIndex].indexOf(
        currentQuestion,
        0
    );

    // if answer was correct:
    // * check if it was a last question
    // * check if streak is 3
    // * if none of the above render next question

    //if answer was incorrect:
    // * check if the previous answer was correct. If previus answer was correct keep going in the same category
    // * check if the streak of wrong answers is equal to 2. If streak of two switch category
    // * if answer was incorrect in the beggining then switch.
    if (
        req.body.answer ===
        currentQuestion.question_answers[currentQuestion.right_answer_index]
    ) {
        currentQuestionIndex += 1;
        strikeAnswersCount += 1;
        incrementRightAnswers(currentQuestion);
        if (
            currentQuestionIndex >
            questionsByCategory[currentCategoryIndex].length - 1
        ) {
            // let resultsArr = []; 
            // resultsArr.push(((rightAnswersFromA / questionsByCategory[currentCategoryIndex].length) * 100).toString());
            // resultsArr.push(((rightAnswersFromB / questionsByCategory[currentCategoryIndex].length) * 100).toString());
            // resultsArr.push(((rightAnswersFromC / questionsByCategory[currentCategoryIndex].length) * 100).toString());
            // resultsArr.push(((rightAnswersFromD / questionsByCategory[currentCategoryIndex].length) * 100).toString());
            // resultsArr.push(((rightAnswersFromE / questionsByCategory[currentCategoryIndex].length) * 100).toString());
            const result = new Result({
                user_id: userId,
                results: {
                  catA: ((rightAnswersFromA / questionsByCategory[currentCategoryIndex].length) * 100),
                  catB: ((rightAnswersFromB / questionsByCategory[currentCategoryIndex].length) * 100),
                  catC: ((rightAnswersFromC / questionsByCategory[currentCategoryIndex].length) * 100),
                  catD: ((rightAnswersFromD / questionsByCategory[currentCategoryIndex].length) * 100),
                  catE: ((rightAnswersFromE / questionsByCategory[currentCategoryIndex].length) * 100),
                }
            });
            
            result.save();
            
            //res.render("finish", {
            res.send({
                rightA:
                    (rightAnswersFromA /
                        questionsByCategory[currentCategoryIndex].length) *
                    100,
                rightB:
                    (rightAnswersFromB /
                        questionsByCategory[currentCategoryIndex].length) *
                    100,
                rightC:
                    (rightAnswersFromC /
                        questionsByCategory[currentCategoryIndex].length) *
                    100,
                rightD:
                    (rightAnswersFromD /
                        questionsByCategory[currentCategoryIndex].length) *
                    100,
                rightE:
                    (rightAnswersFromE /
                        questionsByCategory[currentCategoryIndex].length) *
                    100,
            });
            req.session.destroy();
        }
        if (strikeAnswersCount == 3) {
            switchCategory(currentQuestion, currentQuestionIndex - 1);
            currentQuestionIndex = 0;
            //res.render("questions", { question: currentQuestion });
            res.send(currentQuestion);
        } else {
            currentQuestion =
                questionsByCategory[currentCategoryIndex][currentQuestionIndex];
            //res.render("questions", { question: currentQuestion });
            res.send(currentQuestion);
        }
    } else {
        strikeOfWrongAnswersCount += 1;
        strikeAnswersCount += 1;
        if (req.body.answer == "Skip") {
            incrementSkippedAnswers(currentQuestion);
        }
        if (
            currentQuestionIndex ===
            questionsByCategory[currentCategoryIndex].length - 1
        ) {
              const result = new Result({
                user_id: userId,
                results: {
                  catA: ((rightAnswersFromA / questionsByCategory[currentCategoryIndex].length) * 100),
                  catB: ((rightAnswersFromB / questionsByCategory[currentCategoryIndex].length) * 100),
                  catC: ((rightAnswersFromC / questionsByCategory[currentCategoryIndex].length) * 100),
                  catD: ((rightAnswersFromD / questionsByCategory[currentCategoryIndex].length) * 100),
                  catE: ((rightAnswersFromE / questionsByCategory[currentCategoryIndex].length) * 100),
                }
            });

            result.save();
            req.session.destroy();
            res.send()
            // res.render("finish", {
            res.send({
                isDone: true, 
                rightA:
                    (rightAnswersFromA /
                        questionsByCategory[currentCategoryIndex].length) *
                    100,
                rightB:
                    (rightAnswersFromB /
                        questionsByCategory[currentCategoryIndex].length) *
                    100,
                rightC:
                    (rightAnswersFromC /
                        questionsByCategory[currentCategoryIndex].length) *
                    100,
                rightD:
                    (rightAnswersFromD /
                        questionsByCategory[currentCategoryIndex].length) *
                    100,
                rightE:
                    (rightAnswersFromE /
                        questionsByCategory[currentCategoryIndex].length) *
                    100,
            });
        }
        if (strikeAnswersCount - 1 == 0) {
            switchCategory(currentQuestion, currentQuestionIndex);
            currentQuestionIndex = 0;
            //res.render("questions", { question: currentQuestion });

            res.send({ question: currentQuestion });
        }
        if (strikeOfWrongAnswersCount == 2) {
            switchCategory(currentQuestion, currentQuestionIndex);
            currentQuestionIndex = 0;
            //res.render("questions", { question: currentQuestion });
            res.send({ question: currentQuestion });
        }
        if ((strikeAnswersCount > 0) & (strikeAnswersCount < 3)) {
            currentQuestionIndex += 1;
            // strikeAnswersCount += 1;
            currentQuestion =
                questionsByCategory[currentCategoryIndex][currentQuestionIndex];
            //res.render("questions", { question: currentQuestion });
            res.send({ question: currentQuestion });
        }
        if (strikeAnswersCount == 3) {
            switchCategory(currentQuestion, currentQuestionIndex);
            currentQuestionIndex = 0;
            //res.render("questions", { question: currentQuestion });
            res.send({ question: currentQuestion })
        }
    }
});

function switchCategory(currentQ, currentQI) {
    rememberIndexBeforeSwitching(currentQ, currentQI);

    strikeOfWrongAnswersCount = 0;
    strikeAnswersCount = 0;
    currentCategoryIndex += 1;
    if (currentCategoryIndex > questionsByCategory.length - 1) {
        currentCategoryIndex = 0;
    }
    let currentQuestionCategory =
        questionsByCategory[currentCategoryIndex][0].question_category;

    if (currentQI > questionsByCategory[currentCategoryIndex].length - 1) {
      const result = new Result({
        user_id: userId,
        results: {
          catA: ((rightAnswersFromA / questionsByCategory[currentCategoryIndex].length) * 100),
          catB: ((rightAnswersFromB / questionsByCategory[currentCategoryIndex].length) * 100),
          catC: ((rightAnswersFromC / questionsByCategory[currentCategoryIndex].length) * 100),
          catD: ((rightAnswersFromD / questionsByCategory[currentCategoryIndex].length) * 100),
          catE: ((rightAnswersFromE / questionsByCategory[currentCategoryIndex].length) * 100),
        }
    });

        result.save();
        req.session.destroy();
        //res.render("finish", {
        res.send({
            rightA:
                (rightAnswersFromA /
                    questionsByCategory[currentCategoryIndex].length) *
                100,
            rightB:
                (rightAnswersFromB /
                    questionsByCategory[currentCategoryIndex].length) *
                100,
            rightC:
                (rightAnswersFromC /
                    questionsByCategory[currentCategoryIndex].length) *
                100,
            rightD:
                (rightAnswersFromD /
                    questionsByCategory[currentCategoryIndex].length) *
                100,
            rightE:
                (rightAnswersFromE /
                    questionsByCategory[currentCategoryIndex].length) *
                100,
        });
    } else {
        currentQuestion =
            questionsByCategory[currentCategoryIndex][
                getRightQuestionIndex(currentQuestionCategory)
            ];
        console.log("currentQ: " + currentQ);
    }
}

function getRightQuestionIndex(category) {
    let currentQI = 0;
    if (category === "A") {
        currentQI = lastIndexFromA;
    }
    if (category === "B") {
        currentQI = lastIndexFromB;
    }
    if (category === "C") {
        currentQI = lastIndexFromC;
    }
    if (category === "D") {
        currentQI = lastIndexFromD;
    }
    if (category === "E") {
        currentQI = lastIndexFromE;
    }
    return currentQI;
}

function rememberIndexBeforeSwitching(currentQuestion, indexToRemember) {
    if (currentQuestion.question_category == "A") {
        lastIndexFromA = indexToRemember + 1;
    }
    if (currentQuestion.question_category == "B") {
        lastIndexFromB = indexToRemember + 1;
    }
    if (currentQuestion.question_category == "C") {
        lastIndexFromC = indexToRemember + 1;
    }
    if (currentQuestion.question_category == "D") {
        lastIndexFromD = indexToRemember + 1;
    }
    if (currentQuestion.question_category == "E") {
        lastIndexFromE = indexToRemember + 1;
    }

    // console.log("___________________________________");
    // console.log("catA last index: " + lastIndexFromA);
    // console.log("catB last index: " + lastIndexFromB);
    // console.log("catC last index: " + lastIndexFromC);
    // console.log("catD last index: " + lastIndexFromD);
    // console.log("catE last index: " + lastIndexFromE);
}

function incrementRightAnswers(rightAnsweredQuestion) {
    if (rightAnsweredQuestion.question_category === "A") {
        rightAnswersFromA += 1;
    }
    if (rightAnsweredQuestion.question_category === "B") {
        rightAnswersFromB += 1;
    }
    if (rightAnsweredQuestion.question_category === "C") {
        rightAnswersFromC += 1;
    }
    if (rightAnsweredQuestion.question_category === "D") {
        rightAnswersFromD += 1;
    }
    if (rightAnsweredQuestion.question_category === "E") {
        rightAnswersFromE += 1;
    }

    console.log("___________________________________");
    console.log("catA last index: " + rightAnswersFromA);
    console.log("catB last index: " + rightAnswersFromB);
    console.log("catC last index: " + rightAnswersFromC);
    console.log("catD last index: " + rightAnswersFromD);
    console.log("catE last index: " + rightAnswersFromE);
}

function incrementSkippedAnswers(skippedAnsweredQuestion) {
    if (skippedAnsweredQuestion.question_category === "A") {
        skippedAnswersFromA += 1;
    }
    if (skippedAnsweredQuestion.question_category === "B") {
        skippedAnswersFromB += 1;
    }
    if (skippedAnsweredQuestion.question_category === "C") {
        skippedAnswersFromC += 1;
    }
    if (skippedAnsweredQuestion.question_category === "D") {
        skippedAnswersFromD += 1;
    }
    if (skippedAnsweredQuestion.question_category === "E") {
        skippedAnswersFromE += 1;
    }
    console.log("___________________________________");
    console.log("catA last index: " + skippedAnswersFromA);
    console.log("catB last index: " + skippedAnswersFromB);
    console.log("catC last index: " + skippedAnswersFromC);
    console.log("catD last index: " + skippedAnswersFromD);
    console.log("catE last index: " + skippedAnswersFromE);
}

module.exports = router;