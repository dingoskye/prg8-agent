import express from 'express'
import cors from "cors";
// server.js
import { callAgent } from './agent.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/test', async (req, res) => {
    const response = await callAgent("why do parrots talk?")
    res.json({ response })
})

app.post('/api/chat', async(req, res) => {
    const { message } = req.body
    const response = await callAgent(message)
    res.json({response})
})

app.use(express.static("public"));
app.listen(3000, () => console.log(`Server on http://localhost:3000`))
