import express from "express"
import dotenv from "dotenv"
import cors from 'cors'
import router from "./lib/services/product"
const app = express()
dotenv.config()

app.use(express.json())
// app.use(cors())

app.get('/', (req, res)=>{
    res.json({success:true, mesage:"welcome"})
})

app.use('/product', router)


export default app

