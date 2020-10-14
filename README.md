# Slack Bot for id-2e-brief2

## Prerequisites

- git
- Node.js v10 (you can use `nvm` to switch versions)
- yarn (`npm install -g yarn`)
- Your own Firebase Project ([you can create one here](https://console.firebase.google.com))
- Your own Slack space for testing
- a test Slack App ([you can create one here](https://api.slack.com/apps))

## How to Install

If you don't have `firebase` and `nvm`, you can install them globally.

```bash
yarn global add firebase-tools nvm
```

Clone this repo and install node packages.

```bash
git clone https://github.com/SebastianKrieger/id-2e-brief2.git
cd id-2e-brief2
yarn
```

Initialize firebase, choose Firestore and Functions. During the initialization, don't overwrite any files.

```bash
cd firebase
firebase init
```

Install node packages for Cloud Functions, you need to use Node v10.

```bash
cd functions
nvm use 10
yarn
```

Set `Slack Signing Secret` from your test Slack space to a Function env variable.

```bash
firebase functions:config:set slack.secret="xxxxxxxxxxxxxxxxx"
```

Deploy Functions.

```bash
firebase deploy only functions
```
Create a slash command in your Slack app with at least the following settings.

- `Command` : /genie
- `Request URL` : Your cloud function endpoint

The rest is whatever.

Finally reinstall the Slack app to your Slack space.

## Slack Commands

### /genie
You can wish whatever you want to [Genie of the Lamp](https://en.wikipedia.org/wiki/Genie_\(Disney\)). He will make your wish come true...maybe :)

```bash
/genie [*your wish here*]
```

## How to Contribute

Just clone, make a branch, make changes, lint, commit and make a PR.

I set up a code formatting command using [prettier@2.0.5](https://prettier.io/), if you lint before commiting, our commit history will be clean. You can simply run this command in the root directory before `git commit`.

```bash
yarn lint
```

FYI, the prettier settings are defined in `package.json` as below.

```json
  "prettier": {
    "semi": false,
    "arrowParens": "avoid"
  }
```

## How to Add a Command to Slack

All you have to do is to define a `cloud function` in the file located at [firebase/functions/index.js](firebase/functions/index.js) and set up a `slash command` accordingly in your Slack app.

A sample function is the following. Make sure its a `POST` method and verify the request is from Slack with `verifyWebhook(req)`, then do your thing.

```javascript
exports.genie = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== "POST") {
      const error = new Error("Only POST requests are accepted")
      error.code = 405
      throw error
    }

    verifyWebhook(req)

    await db.collection("wishes").add({ ...req.body, date: Date.now() })
    res.send(
      `Your Wish: ${req.body.text}\nGenie: ...seems to be sleeping at the moment, sorry!`
    )

    return Promise.resolve()
  } catch (err) {
    console.error(err)
    res.status(err.code || 500).send(err)
    return Promise.reject(err)
  }
})
```

So the part you want to change for your function is the following.

```javascript
// saving the wish to Firesotre as is for the genie command
await db.collection("wishes").add({ ...req.body, date: Date.now() })
res.send(
  `Your Wish: ${req.body.text}\nGenie: ...seems to be sleeping at the moment, sorry!`
)
```

And the rest is just formality.

That's it!
