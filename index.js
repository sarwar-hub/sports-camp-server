const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
require('dotenv').config(); 

const { MongoClient, ServerApiVersion } = require('mongodb');

app.get('/', async(req, res) => {
    res.send('sports-camp server runing');
})









const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.nb3yaqn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const coursesCollection = client.db('sportsCamp').collection('courses');
    const usersCollection = client.db('sportsCamp').collection('users');
    const selectedCollection = client.db('sportsCamp').collection('selected');


    // find current user
    app.get('/currentUser', async(req,  res) => {
        const userEmail = req.query.email;
        const query = {email: userEmail};
        const result = await usersCollection.findOne(query);
        res.send(result);
    })

    // find all courses
    app.get('/courses', async(req, res) => {
        const result = await coursesCollection.find().toArray();
        res.send(result);
    })
    
    
    
    // find all instructors
    app.get('/instructors', async(req, res) => {
        const query = {role: "instructor"}
        const result = await usersCollection.find(query).toArray();
        res.send(result);
    })

    // find top courses based of number of students
    app.get('/topCourses', async(req, res) => {
        const result = await coursesCollection.find().sort({numberOfStudents: -1}).toArray();
        const slicedResult = result.slice(0, 6);
        res.send(slicedResult);
    })

    // find top instructors based of number of students
    app.get('/topInstructors', async(req, res) => {
        const query = {role: "instructor"}
        const result = await usersCollection.find(query).sort({numberOfStudents: -1}).toArray();
        const slicedResult = result.slice(0, 6);
        res.send(slicedResult);
    })



    


    // add an user
    app.post('/users', async(req, res) => {
        const userInfo = req.body;
        const user = {
            name: userInfo.name,
            email: userInfo.email,
            photo: userInfo.photo,
            role: userInfo.role
        }

        const result = await usersCollection.insertOne(user);
        res.send(result);
    })



    // add seleceted items
    app.post('/selectedItems', async(req, res) => {
      const itemInfo = req.body;
      const result = await selectedCollection.insertOne(itemInfo);
      res.send(result);
    })



    // get selected items for sepecific user
    app.get('/selectedItems', async(req, res) => {
      const userEmail = req.query.email;
      const query = {userEmail: userEmail};
      const result = await selectedCollection.find(query).toArray();
      res.send(result);
    })




    // add new course
    app.post('/courses', async(req, res) => {
      const data = req.body;
      const courseInfo = {
        courseName: data.courseName,
        thumbnail: data.thumbnail,
        availableSeats: data.seats,
        courseFee: data.fee,
        instructorName: data.instructor,
        instructorEmail: data.email,
        status: "pending",
        students: 0,
      }
      const result = await coursesCollection.insertOne(courseInfo);
      res.send(result);
      
    })



    // get courses by specific instructor
    app.get('/coursesByInstructor', async(req, res) => {
      const instructorEmail = req.query.email;
      const query = {instructorEmail: instructorEmail};
      const result = await coursesCollection.find(query).toArray();
      res.send(result);
      console.log(result);
    })
    











    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);










app.listen(port, () => {
    console.log(`server is running on port ${port}`);
})

