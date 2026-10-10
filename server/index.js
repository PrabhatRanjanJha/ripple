import './loadEnv.js'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import mongoose from 'mongoose'

import errorMiddleware from './middlewares/error.middleware.js'
import projectRoutes from './routes/project.routes.js'
import userRoutes from './routes/user.routes.js'

const app = express()
const isTest = process.argv.includes('--test')
const port = Number(isTest ? process.env.TEST_PORT || 5055 : process.env.PORT || 5000)
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
const mongoUri = isTest ? process.env.MONGO_URI_TEST : process.env.MONGO_URI

const corsOptions = {
    origin: clientUrl,
    credentials: true,
}

if (!mongoUri) {
    throw new Error(`Missing ${isTest ? 'MONGO_URI_TEST' : 'MONGO_URI'} in server/.env`)
}

if (isTest && mongoUri === process.env.MONGO_URI) {
    throw new Error('MONGO_URI_TEST must be different from MONGO_URI')
}

app.use(cors(corsOptions))
app.options('*', cors(corsOptions))
app.use(express.json())
app.use(cookieParser())

app.use('/projects', projectRoutes)
app.use('/users', userRoutes)

app.get('/health', (req, res) => {
    res.json({ success: true, message: 'ok' })
})

app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` })
})

app.use(errorMiddleware)

const startServer = async () => {
    try {
        await mongoose.connect(mongoUri)

        // the test database is wiped on every test start
        if (isTest) {
            await mongoose.connection.db.dropDatabase()
        }
        console.log('DB Connected')

        const server = app.listen(port, () => {
            console.log(`Server Started at ${port}`)
        })

        server.on('error', (err) => {
            console.error(err.code === 'EADDRINUSE' ? `Port ${port} is already in use` : `Server error: ${err.message}`)
            process.exit(1)
        })
    }
    catch (err) {
        console.error(`Database connection failed: ${err.message}`)
        process.exit(1)
    }
}

startServer()

export default app