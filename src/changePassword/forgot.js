const express = require("express");
var admin = require("firebase-admin");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const fs = require("fs");
const UUID = require("uuid-v4");
const axios = require("axios");
const forgot = async(req, res) => {
    const HASURA_OPERATION = `
    query myQuery($email: String!){
      user(where: {email: {_eq: $email}}){
        password
        id
        email
      }
    }
    `;

    // execute the parent operation in Hasura
    const execute = async(variables) => {
        const fetchResponse = await fetch("http://localhost:8080/v1/graphql", {
            method: "POST",
            body: JSON.stringify({
                query: HASURA_OPERATION,
                variables,
            }),
        });
        const data = await fetchResponse.json();
        console.log("DEBUG: ", data.data.user);
        return data;
    };

    const { email } = req.body.input;

    const { data, errors } = await execute({ email });

    if (data.user[0]) {
        if (email == data.user[0].email) {
            const options = {
                method: "POST",
                url: "https://rapidprod-sendgrid-v1.p.rapidapi.com/mail/send",
                headers: {
                    "content-type": "application/json",
                    "X-RapidAPI-Key": "ae5381ecc8msh0f57ec82fa1bea2p1bb060jsn95500a02d0b4",
                    "X-RapidAPI-Host": "rapidprod-sendgrid-v1.p.rapidapi.com",
                },
                data: `{"personalizations":[{"to":[{"email":"${data.user[0].email}"}],"subject":"Here is your password"}],"from":{"email":"jobtennis21@gmail.com"},"content":[{"type":"text/plain","value":"your password is:${data.user[0].password}"}]}`,
            };

            axios
                .request(options)
                .then(async function(response) {
                    console.log("You have successfully send your feedback!!!");
                })
                .catch((err) => {
                    res.status(400).json(err);
                });
        }
    } else {
        console.log("bad");
        //res.json({ message: 'please insert correct email' })
    }

    console.log("data", data);
    if (errors) {
        return res.status(400).json(errors[0]);
    }

    return res.json({
        ...data.user[0],
    });
};

module.exports = { forgot };