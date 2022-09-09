const express = require("express");
var admin = require("firebase-admin");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const fs = require("fs");
const UUID = require("uuid-v4");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { loginViaInvite } = require("./loginViaInvite");
const { hash, compare } = require("../bcrypt/test");
const bcrypt = require("bcrypt");

const login = async(req, res) => {
    console.log("request");

    const HASURA_OPERATION = `
    query user($email: String!) {
        user(where: {email: {_eq: $email}}) {
          id
          email
          password
          name
          logo
          location
          picture
          year
        }
      }
`;

    const execute = async(variables) => {
        const fetchResponse = await fetch("http://localhost:8080/v1/graphql", {
            method: "POST",
            header: "x-hasura-admin-secret: 123",
            body: JSON.stringify({
                query: HASURA_OPERATION,
                variables,
            }),
        });
        const data = await fetchResponse.json();
        console.log("DEBUGGGG: ", data);
        console.log("passwo: ", password);

        return data;
    };

    const { email, password } = req.body.input;
    console.log("enail", email);
    console.log("password", password);

    const { data, errors } = await execute({ email });

    if (errors) {
        return res.status(400).json(errors[0]);
    }

    if (data.user[0]) {
        const match = await compare(password, data.user[0].password);
        if (match) {
            const tokenContents = {
                sub: "1234567890",
                email: data.user[0].email,
                password: data.user[0].password,
                iat: 1516239022,
                "https://hasura.io/jwt/claims": {
                    "x-hasura-allowed-roles": ["anonymous", "admin", "invited"],
                    "x-hasura-default-role": "admin",
                    "x-hasura-user-id": data.user[0].id.toString(),
                },
            };
            const token = jwt.sign(
                tokenContents,
                "1234567890123456789012345678901234567890"
            );
            return res.json({
                ...data.user[0],
                token: token,
            });
        } else {
            console.log("password doesnt match");
            return res.status(400).json({ message: "password doesnt match" });
        }
    } else {
        loginViaInvite(req, res);
        console.log("user not found");
    }
};

module.exports = { login };