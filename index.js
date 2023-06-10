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
    const instructorsCollection = client.db('sportsCamp').collection('instructors');


    // find all courses
    app.get('/courses', async(req, res) => {
        const result = await coursesCollection.find().toArray();
        res.send(result);
    })
    
    
    
    // find all courses
    app.get('/instructors', async(req, res) => {
        const result = await instructorsCollection.find().toArray();
        res.send(result);
    })

    // find top courses based of number of students

    











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

