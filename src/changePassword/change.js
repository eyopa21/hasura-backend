const express = require("express");
var admin = require("firebase-admin");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");

const axios = require("axios");
const forgot = async(req, res) => {
    const HASURA_OPERATION = `
      mutation ($password: String!, $id: Int!) {
        update_user_by_pk(pk_columns: {id: $id}, _set: {password: $password, isVerified: true}) {
         
            id
          }
      }
      `;
    const execute = async(variables) => {
        const fetchResponse = await fetch("http://localhost:8080/v1/graphql", {
            method: "POST",
            headers: {
                "x-hasura-admin-secret": 123,
            },
            body: JSON.stringify({
                query: HASURA_OPERATION,
                variables,
            }),
        });
        const data = await fetchResponse.json();
        console.log("dddeebbuugg: ", data);
        return data;
    };




    if (errors) {
        return res.status(400).json(errors[0]);
    }

    if (data.user[0] || data.invites[0]) {

        const code = val.toString();
        const password = await hash(code, 10);
        console.log("password,", password, "id", data.user[0].id);

        const id = data.user[0].id;
        const { dat, err } = await executes({ password, id });
        console.log("dat", dat);
        console.log("err", err);
        return res.json({
            ...data.user[0],
            ...data.invites[0],
        });
    }
};

module.exports = { forgot };