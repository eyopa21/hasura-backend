const express = require("express");
var admin = require("firebase-admin");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const fs = require("fs");
const UUID = require("uuid-v4");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { hash, compare } = require("../bcrypt/test");
const loginViaInvite = async(req, res) => {
    console.log("requested");

    const HASURA_OPERATION = `
    query invites($email: String!){
        invites(where: {email: {_eq: $email}}){
          id
          email
          code
        }
      }
`;

    const execute = async(variables) => {
        const fetchResponse = await fetch("http://localhost:8080/v1/graphql", {
            method: "POST",
            body: JSON.stringify({
                query: HASURA_OPERATION,
                variables,
            }),
        });
        const data = await fetchResponse.json();
        console.log("DEBUG: ", data);
        return data;
    };

    const { email, password } = req.body.input;

    const { data, errors } = await execute({ email });

    if (errors) {
        return res.status(400).json(errors[0]);
    }
    if (data.invites[0]) {



        const match = await compare(password, data.invites[0].code)
        console.log("match", match)
        if (match) {
            const tokenContents = {
                sub: "1234567890",
                email: data.invites[0].email,
                password: data.invites[0].code,
                iat: 1516239022,
                "https://hasura.io/jwt/claims": {
                    "x-hasura-allowed-roles": ["anonymous", "invited"],
                    "x-hasura-default-role": "invited",
                    "x-hasura-user-id": data.invites[0].id.toString(),
                },
            };
            const token = jwt.sign(
                tokenContents,
                "1234567890123456789012345678901234567890"
            );
            return res.json({
                ...data.invites[0],
                token: token,
            });

        } else {
            console.log("invites password doesnt match")
            return res.status(400).json({ message: "password doesnt match" });
        }


    } else {
        console.log("invites user not found")
        return res.status(400).json({ message: "user not found" });
    }
};

module.exports = { loginViaInvite };