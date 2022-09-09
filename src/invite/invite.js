const express = require("express");
const fetch = require("node-fetch");
const axios = require("axios");
const { hash, compare } = require("../bcrypt/test");


const invite = async(req, res) => {
    const { arg1 } = req.body.input;
    console.log("arg", arg1.email);
    let val = Math.floor(1000 + Math.random() * 9000000);

    const options = {
        method: "POST",
        url: "https://rapidprod-sendgrid-v1.p.rapidapi.com/mail/send",
        headers: {
            "content-type": "application/json",
            "X-RapidAPI-Key": "ae5381ecc8msh0f57ec82fa1bea2p1bb060jsn95500a02d0b4",
            "X-RapidAPI-Host": "rapidprod-sendgrid-v1.p.rapidapi.com",
        },
        data: `{"personalizations":[{"to":[{"email":"${arg1.email}"}],"subject":"Here is your invitation code"}],"from":{"email":"jobtennis21@gmail.com"},"content":[{"type":"text/plain","value":"your invitation code is:${val}"}]}`,
    };

    axios
        .request(options)
        .then(async function(response) {
            console.log("You have successfully send your feedback!!!");

            const HASURA_OPERATION = `
        mutation($email: String!, $code: String!) {
          insert_invites_one(object: {email: $email, code: $code}) {
            id
          }
        }
        `;

            const execute = async(variables) => {
                const fetchResponse = await fetch("http://localhost:8080/v1/graphql", {
                    method: "POST",
                    headers: { "x-hasura-admin-secret": 123 },
                    body: JSON.stringify({
                        query: HASURA_OPERATION,
                        variables,
                    }),
                });
                const data = await fetchResponse.json();
                console.log("DEBUG: ", data);
                return data;
            };

            let { email, code } = req.body.input;
            email = arg1.email;
            code = val.toString();
            const hashedCode = await hash(code, 10);
            const { data, errors } = await execute({ email, code: hashedCode });

            if (errors) {
                return res.status(400).json(errors[0]);
            }

            return res.json({
                ...data.insert_invites_one,
                message: "test",
            });
        })
        .catch(function(error) {
            console.error(error);
            res.send("Something went wrong, please try again!!");
        });
};

module.exports = { invite };