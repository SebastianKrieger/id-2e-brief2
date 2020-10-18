# Slack Bot for id-2e-brief2

## Idea
![idea](assets/idea.png)

---

## Prerequisites

- git
- Node.js v10 (you can use `nvm` to switch versions)
- yarn (`npm install -g yarn`)
- Your own Firebase Project ([you can create one here](https://console.firebase.google.com) - it has to be a paid plan to make external calls)
- Your own Slack space for testing
- a test Slack App ([you can create one here](https://api.slack.com/apps))

---

## How to Install

If you don't have `firebase` and `nvm`, you can install them globally.

```bash
yarn global add firebase-tools nvm
```

If this is first time using `firebase` from CLI, you need to login.

```bash
firebase login
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

Set `Slack Signing Secret` from your test Slack app to a Function env variable.

```bash
firebase functions:config:set slack.secret="xxxxxxxxxxxxxxxxx"
```

Deploy Functions.

```bash
firebase deploy --only functions
```
Create slash commands in your Slack app with at least the following settings.

- `Command` : the command below
- `Request URL` : Your cloud function endpoint for the command ([get it from Firebase console after function deployment](https://console.firebase.google.com/))

The rest is whatever.

Finally reinstall the Slack app to your Slack space.

---

## Slack Commands

### /genie
You can wish whatever you want to [Genie of the Lamp](https://en.wikipedia.org/wiki/Genie_\(Disney\)). He will make your wish come true...maybe :)

```bash
/genie [*your wish here*]
```

---

### /start-mood-tracker
Start mood tracking.

```bash
/start-mood-tracker
```
---

### /end-mood-tracker
Stop mood tracking.

```bash
/end-mood-tracker
```
---

### /show-mood
(**NOT implemented yet**) Show your stats.

```bash
/show-mood
```

---

### /record-mood [*DD.MM.YYYY]
Record your mood at arbitrary time. The date is optional. If not specified, the timestamp will be now.

(*note*) This command is needed for test purposes so we can record moods with any date.

```bash
/record-mood 01.01.2020
```
![idea2](assets/mood.png)

---

### /record-challenge [*DD.MM.YYYY]
Record your challenge at arbitrary time. The date is optional. If not specified, the timestamp will be now.

(*note*) This command is needed for test purposes so we can record challenges with any date.

```bash
/record-mood 01.01.2020
```
![idea2](assets/challenge.png)

---

## Data Structures

Data are stored in Firestore with the collections below.

### users

```json
{
  date: 1602997350453,
  last_challenge: 1602997357062,
  last_mood: 1603000006575,
  track: true,
  user_id: "XXXXXXX",
  user_name: "John"
}
```

### moods

```json
{
  date: 1602997350453,
  user_id: "XXXXXXX",
  value: 5
}
```

### challenges

```json
{
  date: 1602997350453,
  user_id: "XXXXXXX",
  value: "a",
  text: "Socializing"
}
```

### wishes

```json
{
  date: 1602997350453,
  user_id: "XXXXXXX",
  text: "your wish here"
}
```

---
## How to Contribute

1. clone this repo
2. make your own branch
3. make changes
4. lint
5. commit
6. push
7. make a PR

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

---

## How to Add a Command to Slack

All you have to do is to define a `cloud function` in the file located at [firebase/functions/index.js](firebase/functions/index.js) and set up a `slash command` accordingly in your Slack app.

A sample function is the following.
1. Make sure its a `POST` method with `verifyMethod(req, "POST")`
2. Verify the request is from Slack with `verifyWebhook(req)`
3. Do your thing

```javascript
exports.genie = functions.https.onRequest(async (req, res) => {
  try {
    verifyMethod(req, "POST")
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
