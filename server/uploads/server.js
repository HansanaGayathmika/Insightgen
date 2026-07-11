const express = require("express");
const multer = require("multer");
const cors = require("cors");
const axios = require("axios");


const app = express();

app.use(cors());


const upload = multer({
    dest:"uploads/"
});


app.post("/upload", upload.single("file"), async(req,res)=>{


    try{

        const filePath = req.file.path;


        const response = await axios.post(
            "http://localhost:5000/analyze",
            {
                file_path:filePath
            }
        );


        res.json(response.data);


    }
    catch(error){

        res.status(500).json({
            error:error.message
        });

    }

});


app.listen(3000,()=>{

    console.log("Server running on port 3000");

});