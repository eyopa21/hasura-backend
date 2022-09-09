const fetch = require("node-fetch")
const { hash, compare } = require("../bcrypt/test");

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

// execute the parent operation in Hasura
const execute = async(variables) => {
    const fetchResponse = await fetch(
        "http://localhost:8080/v1/graphql", {
            method: 'POST',
            body: JSON.stringify({
                query: HASURA_OPERATION,
                variables
            })
        }
    );
    const data = await fetchResponse.json();
    console.log('DEBUG: ', data);
    return data;
};


// Request Handler
app.post('/loginTest', async(req, res) => {

    // get request input
    const { email } = req.body.input;

    // run some business logic

    // execute the Hasura operation
    const { data, errors } = await execute({ email });

    // if Hasura operation errors, then throw error
    if (errors) {
        return res.status(400).json(errors[0])
    }

    // success
    return res.json({
        ...data.user
    })

});