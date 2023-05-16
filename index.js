const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const jwt = require('jsonwebtoken');

const app = express()
const port = process.env.PORT || 4000;

// middleware 
app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send("volunteer network server is running")
})




const uri = process.env.DB_CONNECTION_URI;


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const authGuard = (req, res, next) => {
    const authorization = req.headers.authorization;
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'authorization failed authorization' })
    }
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.SECRET_KEY, (err, decode) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'authorization failed verify token' })
        }
        req.decode = decode;
        next();
    })
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const eventsCollection = client.db('volunteerDB').collection('events');
        const volunteerCollection = client.db('volunteerDB').collection('volunteers')
        const bookingsCollection = client.db('volunteerDB').collection('bookings')

        // jsonwebtoken
        app.post('/jwt', (req, res) => {
            const payload = req.body;
            const token = jwt.sign(payload, process.env.SECRET_KEY, { expiresIn: '1h' })

            res.send({ token })
        })


        // get all events
        app.get('/events', async (req, res) => {
            const events = await eventsCollection.find().toArray();

            res.send(events)
        })

        // get individual events
        app.get('/events/:id', async (req, res) => {
            const query = { _id: new ObjectId(req.params.id) };
            const event = await eventsCollection.findOne(query)

            res.send(event)
        })

        // post/add a events
        app.post('/events', async (req, res) => {
            const eventDoc = req.body;
            const addedEvent = await eventsCollection.insertOne(eventDoc)

            res.send(addedEvent)
        })

        // delete a event
        app.delete('/events/:id', async (req, res) => {
            const query = { _id: new ObjectId(req.params.id) }
            const eventDelete = await eventsCollection.deleteOne(query);

            res.send(eventDelete)
        })

        // volunteer register
        app.post('/volunteers', async (req, res) => {
            const registrationDoc = req.body
            const regVolunteer = await volunteerCollection.insertOne(registrationDoc)

            res.send(regVolunteer)
        })

        // get all volunteers 
        app.get('/volunteers', async (req, res) => {
            const volunteers = await volunteerCollection.find().toArray()

            res.send(volunteers)
        })

        // delete a volunteer
        app.delete('/volunteers/:id', async (req, res) => {
            const query = { _id: new ObjectId(req.params.id) }
            const deleteVolunteer = await volunteerCollection.deleteOne(query)

            res.send(deleteVolunteer)
        })


        // user bookings
        app.post('/bookings', async (req, res) => {
            const bookingsDoc = req.body;
            const bookings = await bookingsCollection.insertOne(bookingsDoc)

            res.send(bookings)
        })

        // get all bookings
        app.get('/bookings', async (req, res) => {
            const bookings = await bookingsCollection.find().toArray()

            res.send(bookings)
        })

        // get individual booking
        app.get("/bookings/:id", async (req, res) => {
            const query = { _id: new ObjectId(req.params.id) }
            const booking = await bookingsCollection.findOne(query);

            res.send(booking)
        })



        // get individual user bookings
        app.post('/my-bookings', authGuard, async (req, res) => {
            const userEmail = req.query.email;
            const tokenEmail = req.decode.email;

            if (userEmail === tokenEmail) {
                const myBookings = await bookingsCollection.find({ email: userEmail }).toArray();

                res.send(myBookings)
            }
        })

        app.delete("/bookings/:id", async (req, res) => {
            const query = { _id: new ObjectId(req.params.id) }
            const booking = await bookingsCollection.deleteOne(query);

            res.send(booking)
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
    console.log(`volunteer network server is running on prot ${port}`);
})