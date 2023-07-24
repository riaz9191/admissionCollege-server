const express = require('express');
const cors = require('cors');
const app = express();
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;
require('dotenv').config();

// middleware
const corsOptions = {
  origin: '*',
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ error: true, message: 'Unauthorized access' });
  } else {
    const token = authorization.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decoded) => {
      if (error) {
        return res.status(401).send({ error: true, message: 'Unauthorized access' });
      } else {
        req.decoded = decoded;
        next();
      }
    });
  }
};

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv:${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3onslcg.mongodb.net/?retryWrites=true&w=majority`;

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

    const usersCollection = client.db("collegeGate").collection("users");
    const galleryCollection = client.db("collegeGate").collection("gallery");
    const collegesCollection = client.db("collegeGate").collection("colleges");
    const applyCollection = client.db("collegeGate").collection("apply");

    // handle JWT {todo}
    app.post('/jwt', (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
      res.send(token);
    });

    // insert user
    app.post('/users', async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existingUser = await usersCollection.findOne(query);

      if (existingUser) {
        return res.send({ message: 'User already exists' });
      } else {
        const result = await usersCollection.insertOne(user);
        res.send(result);
      }
    });

    // get user by email
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await usersCollection.findOne(query);
      res.send(result);
    });

    // get user by id
    app.get('/edit/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await usersCollection.findOne(filter);
      res.send(result);
    });

    // update user data
    app.put('/users/id/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedData = req.body;
      const result = await usersCollection.updateOne(filter, { $set: updatedData });
      res.send(result);
    });

    // get gallery data
    app.get('/gallery', async (req, res) => {
      const result = await galleryCollection.find().toArray();
      res.send(result);
    });

    // get colleges data
    app.get('/colleges', async (req, res) => {
      const result = await collegesCollection.find().toArray();
      res.send(result);
    });

    // Search colleges based on college name
    app.get('/colleges/search', async (req, res) => {
      const searchQuery = req.query.query;
      if (!searchQuery) {
        return res.status(400).json({ message: 'Search query is required.' });
      }

        const regex = new RegExp(searchQuery, 'i');
        const filter = { $or: [{ name: regex }, { admission: regex }, { research: { ongoingProjects: regex } }] };
        const result = await collegesCollection.find(filter).toArray();
        res.json(result);
      
    });

    // get specific colleges data
    app.get('/colleges/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await collegesCollection.findOne(filter);
      res.send(result);
    });

    // update college data
    app.put('/colleges/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedData = req.body;
      const result = await collegesCollection.updateOne(filter, { $set: updatedData });
      res.send(result)
    });

    // insert applications
    app.post('/apply', async (req, res) => {
      const apply = req.body;
      const result = await applyCollection.insertOne(apply);
      res.send(result);
    });

    // get specific application data
    app.get('/apply/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await applyCollection.find(query).toArray(); 
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('college server is running');
});
app.listen(port, () => {
  console.log(`college server is running on port ${port}`);
});