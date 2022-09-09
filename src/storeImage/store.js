const express = require("express");
var admin = require("firebase-admin");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const fs = require("fs");
const UUID = require("uuid-v4");
const axios = require("axios");
const uuid = UUID();
var serviceAccount = require("../serviceAccount.json");
const { getStorage } = require("firebase-admin/storage");


const store = async(req, res) => {
    const { arg1 } = req.body.input;

    const buffer = new Buffer.from(arg1.base64, "base64");

    //to download the file
    fs.writeFileSync("heyyy.jpg", buffer);

    res.set("Access-Control-Allow-Origin", "*");
    console.log("request requested", arg1.base64);

    const uid = Date.now();
    const options = {
        destination: `img${uid}.jpg`,
        resumable: true,
        validation: "crc32c",
        metadata: {
            uploadType: "media,file",
            metadata: {
                firebaseStorageDownloadTokens: uuid,
            },
        },
    };

    storage
        .upload("heyyy.jpg", options)
        .then((file) => {
            console.log(
                "the url",
                `https://firebasestorage.googleapis.com/v0/b/${storage.name}/o/pdf${uid}.jpg?alt=media&token=${uuid}`
            );

            let url = `https://firebasestorage.googleapis.com/v0/b/${storage.name}/o/img${uid}.jpg?alt=media&token=${uuid}`;

            return res.json({
                url: url,
            });
        })
        .catch((e) => {
            console.log("upload error", e.code);
            res.send(e.message);
        });
};

module.exports = { store };