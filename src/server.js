const express = require("express");
var admin = require("firebase-admin");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
const fs = require("fs");
const UUID = require("uuid-v4");
const axios = require("axios");

const { invite } = require("./invite/invite");
const { login } = require("./login/login");
const { forgot } = require("./changePassword/forgot");
const { loginViaInvite } = require("./login/loginViaInvite");
const { hash, compare } = require("./bcrypt/test");

const uuid = UUID();
var serviceAccount = require("./serviceAccount.json");
const { getStorage } = require("firebase-admin/storage");

const defaultApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "gs://my-admin-d9b53.appspot.com",
});

const storage = getStorage().bucket();
const app = express();
const PORT = process.env.PORT || 3000;
app.use(bodyParser.json());

let theEmail = "";
let theCode = "";

app.post("/login", async(req, res) => {
    login(req, res);
});

app.post("/storeImage", async(req, res) => {
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
});

app.post("/InviteUser", async(req, res) => {
    console.log("req", req.headers);
    invite(req, res);
});

app.post("/forgotpassword", async(req, res) => {
    forgot(req, res);
});

app.post("/loginviainvite", async(req, res) => {
    loginViaInvite(req, res);
});

app.get("/test", (req, res) => {
    compare(
        "password",
        "$2b$10$pg5NSYOhbIpZFmub5r870uzEbeorP9CHTFuXbG5CAnuay/snqz/P2"
    ).then((res) => {
        console.log("woww", res);
    });
});

app.post("/forgot", async(req, res) => {
            const HASURA_OPERATION = `query muQuery($email: String!) {
  user(where: {email: {_eq: $email}}) {
    id
    email
  }
  invites(where: {email: {_eq: $email}}) {
    id
    email
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

            const HASURA_OPERATION2 = `
mutation ($password: String!, $id: Int!) {
  update_user_by_pk(pk_columns: {id: $id}, _set: {password: $password, isVerified: false}) {
   
      id
    }
  
 
}
`;
            const executes = async(variables) => {
                const fetchResponse = await fetch("http://localhost:8080/v1/graphql", {
                    method: "POST",
                    headers: {
                        "x-hasura-admin-secret": 123
                    },
                    body: JSON.stringify({
                        query: HASURA_OPERATION2,
                        variables,
                    }),
                });
                const data = await fetchResponse.json();
                console.log("dddeebbuugg: ", data);
                return data;
            };

            const { email } = req.body.input;
            const { data, errors } = await execute({ email });

            if (errors) {
                return res.status(400).json(errors[0]);
            }

            if (data.user[0] || data.invites[0]) {
                let val = Math.floor(1000 + Math.random() * 9000000);

                const options = {
                        method: "POST",
                        url: "https://rapidprod-sendgrid-v1.p.rapidapi.com/mail/send",
                        headers: {
                            "content-type": "application/json",
                            "X-RapidAPI-Key": "ae5381ecc8msh0f57ec82fa1bea2p1bb060jsn95500a02d0b4",
                            "X-RapidAPI-Host": "rapidprod-sendgrid-v1.p.rapidapi.com",
                        },

                        data: `{"personalizations":[{"to":[{"email":"${
        data.user[0].email
          ? `${data.user[0].email}`
          : `${data.invites[0].email}`
      }"}],"subject":"Here is your password"}],"from":{"email":"jobtennis21@gmail.com"},"content":[{"type":"text/plain","value":"your invitation code is:${val}"}]}`,
    };

    axios.request(options).then(async function (response) {
      console.log("You have successfully send your feedback!!!");
      const code = val.toString();
      const password = await hash(code, 10)
      console.log("password,", password, "id",  data.user[0].id)

      const id = data.user[0].id;
      const { dat, err } = await executes({ password, id });
      console.log("dat", dat)
      console.log("err", err)
      return res.json({
        ...data.user[0],
        ...data.invites[0],
      });
    });
  }
});

app.listen(PORT, () => {
  console.log("server running on port", PORT);
});