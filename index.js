const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express();

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://dbuser:${process.env.DB_PASSWORD}@cluster0.mn9baty.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

// function verifyJWT(req, res, next) {
//     const authHeader = req.headers.authorization;
//     if (!authHeader) {
//         res.status(401).send({ message: 'unauthorized access' })
//     }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next()
    })
}

async function run() {
    try {
        const servicesCollection = client.db('ImmigrationVISA').collection('services');
        const ReviewCollection = client.db('ImmigrationVISA').collection('reviews');

        app.get('/services', async (req, res) => {
            const date = new Date();
            const sortValue = req.query.sort;
            const limit = req.query.limit;

            let query = {};
            let sort = { date: 1 };
            let cursor;

            if (sortValue) {
                sort = { date: -1 }
            }

            if (limit) {
                cursor = servicesCollection.find(query).sort(sort);
            } else {
                cursor = servicesCollection.find(query).sort(sort);
            }
            const services = await cursor.limit(parseInt(limit)).toArray();
            res.send(services);
        });

        app.get('/services/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await servicesCollection.findOne(query);
            res.send(result)
        })

        app.get('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const query = { serviceId: id };
            const sort = { timestamp: -1 };
            const cursor = ReviewCollection.find(query).sort(sort);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/get-review/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await ReviewCollection.findOne(query);
            res.send(result);
        })

        app.get('/myreviews/:uid', verifyJWT, async (req, res) => {
            const uid = req.params.uid;
            const decoded = req.decoded;
            if (decoded?.email !== req?.query?.email) {
                res.status(403).send({ message: 'unauthorized access' })
            }
            const query = { uid }
            const sort = { timestamp: -1 }
            const cursor = ReviewCollection.find(query).sort(sort);
            const result = await cursor.toArray();
            res.send(result)
        })

        app.delete('/delete-review/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await ReviewCollection.deleteOne(query);
            res.send(result)
        })

        app.post('/add-review', async (req, res) => {
            const user = req.body;
            const result = await ReviewCollection.insertOne(user);
            res.send(result)
        })

        app.post('/add-service', async (req, res) => {
            const service = req.body;
            const result = await servicesCollection.insertOne(service);
            res.send(result);
        })

        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1d' });
            res.send({ token });
        })

        app.put('/reviews/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const review = req.body;
            const option = { upser: true };
            const updateReview = {
                $set: {
                    review: review.review
                }
            }
            const result = await ReviewCollection.updateOne(filter, updateReview, option);
            res.send(result);
        })
    }
    finally {

    }
}

run().catch(err => console.log(err))

app.get('/', (req, res) => {
    res.send(`Welcome to Assignment-11, ${process.env.NAME}`);
});

app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
})