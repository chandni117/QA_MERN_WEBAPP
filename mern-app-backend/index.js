const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
require('dotenv').config();
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 5000;

// Define a schema and model for questions
const commentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  text: { type: String, required: true },
}, { timestamps: true });

const questionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  question: { type: String, required: true },
  comments: [commentSchema],
}, { timestamps: true });

const Question = mongoose.model('Question', questionSchema);

async function startServer() {
  try {
    // Connect to MongoDB
    //const uri = process.env.MONGO_URI;
    console.log("MongoDB URI:", process.env.MONGO_URI);
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // GET route for fetching questions
    app.get('/questions', async (req, res) => {
      try {
        const questions = await Question.find(); // Fetch all questions
        res.status(200).send(questions);
      } catch (error) {
        console.error('Error fetching questions:', error);
        res.status(500).send({ message: 'Error fetching questions', error });
      }
    });

    // POST route for adding a question
    app.post('/questions', async (req, res) => {
      const { name, question } = req.body;

      try {
        const newQuestion = new Question({ name, question, comments: [] }); // Initialize with an empty comments array
        await newQuestion.save();
        res.status(201).send(newQuestion);
      } catch (error) {
        console.error('Error saving question:', error);
        res.status(500).send({ message: 'Error saving question', error });
      }
    });

    // POST route for adding comments
    app.post('/questions/:id/comments', async (req, res) => {
      const { id } = req.params;
      const { name, text } = req.body;

      try {
        const question = await Question.findById(id);
        if (!question) {
          return res.status(404).send({ message: 'Question not found' });
        }
        question.comments.push({ name, text });
        await question.save();
        console.log("Updated Question with Comments: ", question);
        res.status(200).send(question);
      } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).send({ message: 'Error adding comment', error });
      }
    });
    // PUT route for editing a question
    app.put('/questions/:id', async (req, res) => {
      const { id } = req.params;
      const { question, user } = req.body; // Assume the user name is passed in the body
    
      const existingQuestion = await Question.findById(id);
      if (existingQuestion.name !== user) {
        return res.status(403).send('You can only edit your own questions.');
      }
    
      existingQuestion.question = question;
      await existingQuestion.save();
      res.send(existingQuestion);
    });

    // DELETE route for deleting a question
    app.delete('/questions/:id', async (req, res) => {
      const { id } = req.params;
      const { user } = req.body; // Ensure user is passed in the request body
    
      const existingQuestion = await Question.findById(id);
      if (existingQuestion.name !== user) {
        return res.status(403).send('You can only delete your own questions.');
      }
    
      await Question.findByIdAndDelete(id);
      res.send({ message: 'Question deleted successfully' });
    });
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

// Call the async function to start the server
startServer();
