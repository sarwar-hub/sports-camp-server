const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.get('/', async (req, res) => {
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

// middleware to verify token
const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({ error: 'Unauthorized access' })
  }
  const token = authorization.split(' ')[1];

  // verify token
  jwt.verify(token, process.env.SECRET_TOKEN, (error, decoded) => {
    if (error) {
      return res.status(401).send({ error: 'Unauthorized access' })
    }
    req.decoded = decoded;
    next();
  })
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();

    const coursesCollection = client.db('sportsCamp').collection('courses');
    const usersCollection = client.db('sportsCamp').collection('users');
    const selectedCollection = client.db('sportsCamp').collection('selected');
    const enrolledCollection = client.db('sportsCamp').collection('enrolledCourses');


    // generate token
    app.post('/jwt', async (req, res) => {
      const body = req.body;
      const token = jwt.sign(body, process.env.SECRET_TOKEN, { expiresIn: '1h' })
      res.send({ token });
    })


    // get all users
    app.get('/users', async (req, res) => {
      const result = await usersCollection.find().toArray();
      res.send(result);
    })


    // find current user
    app.get('/currentUser', async (req, res) => {
      const userEmail = req.query.email;
      const query = { email: userEmail };
      const result = await usersCollection.findOne(query);
      res.send(result);
    })


    // find all courses
    app.get('/courses', async (req, res) => {
      const result = await coursesCollection.find().toArray();
      res.send(result);
    })


    // find all instructors
    app.get('/instructors', async (req, res) => {
      const query = { role: "instructor" }
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    })


    // find top courses based of number of students
    app.get('/topCourses', async (req, res) => {
      const result = await coursesCollection.find().sort({ students: -1 }).toArray();
      const slicedResult = result.slice(0, 6);
      res.send(slicedResult);
    })


    // find top instructors based of number of students
    app.get('/topInstructors', async (req, res) => {
      const query = { role: "instructor" }
      const result = await usersCollection.find(query).sort({ students: -1 }).toArray();
      const slicedResult = result.slice(0, 6);
      res.send(slicedResult);
    })


    // add an user
    app.post('/users', async (req, res) => {
      const userInfo = req.body;
      // check if the user already exists while continue with google
      const isExists = await usersCollection.findOne({ email: userInfo.email });
      if (isExists) {
        return;
      }

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
    app.post('/selectedItems', async (req, res) => {
      const itemInfo = req.body;
      const result = await selectedCollection.insertOne(itemInfo);
      res.send(result);
    })


    // get selected items for sepecific user
    app.get('/selectedItems', async (req, res) => {
      const userEmail = req.query.email;
      const query = { userEmail: userEmail };
      const result = await selectedCollection.find(query).toArray();
      res.send(result);
    })

    // get enrolled items for sepecific user
    app.get('/enrolledCourses', async (req, res) => {
      const buyerEmail = req.query.email;
      
      const query = { buyerEmail: buyerEmail };
      const result = await enrolledCollection.find(query).toArray();
      res.send(result);
    })


    // add new course
    app.post('/courses', async (req, res) => {
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
        feedback: ''
      }
      const result = await coursesCollection.insertOne(courseInfo);
      res.send(result);

    })

    // add enrolled courses
    app.post('/enrolledCourses', async (req, res) => {
      const data = req.body;
      const courseId = data.id;
      
      const result = await enrolledCollection.insertOne(data);
      res.send(result);
      await selectedCollection.deleteOne({courseId: courseId});
      
      const course = await coursesCollection.findOne({_id: new ObjectId(courseId)});
      const seats = course?.availableSeats;
      const students = course?.students;
      const seat = parseInt(seats);
      const student = parseInt(students);
      
      const query = {_id: new ObjectId(courseId)};
      const options = {upsert: true};
      const updates = {
        $set: {
          availableSeats: seat - 1,
          students: student + 1
        }
      }
      await coursesCollection.updateOne(query, updates, options);


    })


    // get courses by specific instructor
    app.get('/coursesByInstructor', async (req, res) => {
      const instructorEmail = req.query.email;
      const query = { instructorEmail: instructorEmail };
      const result = await coursesCollection.find(query).toArray();
      res.send(result);
    })


    // delete course from selected
    app.delete('/selectedCourses/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await selectedCollection.deleteOne(query);
      res.send(result);
    })


    // update user role to instructor
    app.patch('/makeInstructor/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const doc = {
        $set: {
          role: 'instructor',
          students: 0
        }
      }
      const result = await usersCollection.updateOne(query, doc, options);
      res.send(result);
    })

    // update user role to admin
    app.patch('/makeAdmin/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const doc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await usersCollection.updateOne(query, doc, options);
      res.send(result);
    })


    // update course status to approved
    app.patch('/approve/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const doc = {
        $set: {
          status: 'approved',
          feedback: ''
        }
      }
      const result = await coursesCollection.updateOne(query, doc, options);
      res.send(result);
    })


    // update course status to denied
    app.patch('/deny/:id', async (req, res) => {
      const id = req.params.id;
      const data = req.body;

      const query = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const doc = {
        $set: {
          status: 'denied',
          feedback: data.feedback
        }
      }
      const result = await coursesCollection.updateOne(query, doc, options);
      res.send(result);
    })



    // // payment intent
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const priceInt = parseInt(price)

      const amount = priceInt * 100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd'

      })
      res.send({
        clientSecret: paymentIntent.client_secret
      })
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

