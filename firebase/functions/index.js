const functions = require("firebase-functions")
const admin = require("firebase-admin")
admin.initializeApp()

const db = admin.firestore()

const { verifyRequestSignature } = require("@slack/events-api")

const axios = require("axios")

const moment = require("moment")
/**
 * Verify that the webhook request came from Slack.
 *
 * @param {object} req Cloud Function request object.
 * @param {string} req.headers Headers Slack SDK uses to authenticate request.
 * @param {string} req.rawBody Raw body of webhook request to check signature against.
 */
const verifyWebhook = req => {
  const signature = {
    signingSecret: functions.config().slack.secret,
    requestSignature: req.headers["x-slack-signature"],
    requestTimestamp: req.headers["x-slack-request-timestamp"],
    body: req.rawBody,
  }

  if (!verifyRequestSignature(signature)) {
    const error = new Error("Invalid credentials")
    error.code = 401
    throw error
  }
}

const verifyMethod = (req, method) => {
  if (req.method !== method) {
    const error = new Error("Only POST requests are accepted")
    error.code = 405
    throw error
  }
}

const getUser = async user_id => {
  const doc = await db.collection("users").doc(user_id).get()
  return doc.exists ? doc.data() : null
}

const askChallenge = async (url, date) => {
  const block_id = date === undefined ? "challenge" : `challenge-${date}`
  const json = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "What was your challenge this week?",
          emoji: true,
        },
      },
      {
        type: "actions",
        block_id,
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: "Socializing",
            },
            value: "a",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: "Working from remote",
            },
            value: "b",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: "Challenges too difficult",
            },
            value: "c",
          },
        ],
      },
    ],
  }
  if (typeof url === "string") {
    await axios.post(url, json)
  } else {
    url.json(json)
  }
}

const askMood = async (url, date, init = false) => {
  const block_id = date === undefined ? "mood" : `mood-${date}`
  let json = {
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "How is your mood right now?",
          emoji: true,
        },
      },
      {
        type: "actions",
        block_id,
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: ":star-struck:",
            },
            value: "5",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: ":smile:",
            },
            value: "4",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: ":slightly_smiling_face:",
            },
            value: "3",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: ":neutral_face:",
            },
            value: "2",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              emoji: true,
              text: ":white_frowning_face:",
            },
            value: "1",
          },
        ],
      },
    ],
  }

  if (init) {
    json.blocks.unshift({
      type: "section",
      text: {
        type: "plain_text",
        text: "Yeah! I started mood tracking! Here's the first one:",
        emoji: true,
      },
    })
  }

  if (typeof url === "string") {
    await axios.post(url, json)
  } else {
    url.json(json)
  }
}

const thanks = async url => {
  await axios.post(url, {
    text: `Thank you, I saved it!`,
  })
}
exports.start_mood_tracker = functions.https.onRequest(async (req, res) => {
  try {
    verifyMethod(req, "POST")
    verifyWebhook(req)

    const user = await getUser(req.body.user_id)
    if (user !== null && user.track === true) {
      res.send(`You have already started the mood tracker.`)
    } else {
      await db.collection("users").doc(req.body.user_id).set({
        last_mode: 0,
        last_challenge: 0,
        user_id: req.body.user_id,
        user_name: req.body.user_name,
        date: Date.now(),
        track: true,
      })
      await askMood(res, undefined, true)
    }

    return Promise.resolve()
  } catch (err) {
    console.error(err)
    res.status(err.code || 500).send(err)
    return Promise.reject(err)
  }
})

exports.end_mood_tracker = functions.https.onRequest(async (req, res) => {
  try {
    verifyMethod(req, "POST")
    verifyWebhook(req)

    const user = await getUser(req.body.user_id)
    if (user === null || user.track === false) {
      res.send(`You are not using the mood tracker yet.`)
    } else {
      await db
        .collection("users")
        .doc(req.body.user_id)
        .update({ track: false })
      res.send(`You have stopped mood tracking.`)
    }

    return Promise.resolve()
  } catch (err) {
    console.error(err)
    res.status(err.code || 500).send(err)
    return Promise.reject(err)
  }
})

exports.record_mood = functions.https.onRequest(async (req, res) => {
  try {
    verifyMethod(req, "POST")
    verifyWebhook(req)
    const user = await getUser(req.body.user_id)

    if (user === null || user.track === false) {
      res.send(`You have not started the mood tracker yet.`)
    } else {
      const date = parseDate(req.body.text)
      await askMood(res, date === false ? null : req.body.text)
    }
    return Promise.resolve()
  } catch (err) {
    console.error(err)
    res.status(err.code || 500).send(err)
    return Promise.reject(err)
  }
})

exports.record_challenge = functions.https.onRequest(async (req, res) => {
  try {
    verifyMethod(req, "POST")
    verifyWebhook(req)
    const user = await getUser(req.body.user_id)

    if (user === null || user.track === false) {
      res.send(`You have not started the mood tracker yet.`)
    } else {
      const date = parseDate(req.body.text)
      await askChallenge(res, date === false ? null : req.body.text)
    }
    return Promise.resolve()
  } catch (err) {
    console.error(err)
    res.status(err.code || 500).send(err)
    return Promise.reject(err)
  }
})

exports.genie = functions.https.onRequest(async (req, res) => {
  try {
    verifyMethod(req, "POST")
    verifyWebhook(req)
    const text = req.body.text
    await db
      .collection("wishes")
      .add({ user_id: req.body.user_id, text, date: Date.now() })
    res.send(
      `Your Wish: ${text}\nGenie: ...seems to be sleeping at the moment, sorry!`
    )
    return Promise.resolve()
  } catch (err) {
    console.error(err)
    res.status(err.code || 500).send(err)
    return Promise.reject(err)
  }
})

const parseDate = date => {
  const parsed = moment(date, "DD.MM.YYYY")
  if (parsed.isValid()) {
    return +parsed.format("x")
  } else {
    return false
  }
}

exports.interact = functions.https.onRequest(async (req, res) => {
  try {
    verifyMethod(req, "POST")
    verifyWebhook(req)

    const payload = JSON.parse(req.body.payload)
    const action = payload.actions[0]
    const value = action.value
    const user_id = payload.user.id
    const text = action.text.text
    const action_type = action.block_id.split("-")[0]
    const _date = parseDate(action.block_id.split("-")[1])
    const date = _date !== false ? _date : Math.round(action.action_ts * 1000)
    if (action_type === "challenge") {
      await db.collection("challenges").add({
        date,
        user_id,
        value,
        text,
      })
      await db.collection("users").doc(user_id).update({
        last_challenge: date,
      })
      await thanks(payload.response_url)
    } else if (action_type === "mood") {
      await db.collection("users").doc(user_id).update({
        last_mood: date,
      })
      await db.collection("moods").add({
        date,
        user_id,
        value: +value,
      })
      const user = await getUser(user_id)
      if (user.last_challenge < Date.now() - 1000 * 60 * 60 * 5) {
        await askChallenge(payload.response_url)
      } else {
        await thanks(payload.response_url)
      }
    }

    res.send("ok")

    return Promise.resolve()
  } catch (err) {
    console.error(err)
    res.status(err.code || 500).send(err)
    return Promise.reject(err)
  }
})

exports.show_mood = functions.https.onRequest(async (req, res) => {
  try {
    verifyMethod(req, "POST")
    verifyWebhook(req)

    res.send(
      `Here's your statistics of the last 2 months: ...under construction`
    )

    return Promise.resolve()
  } catch (err) {
    console.error(err)
    res.status(err.code || 500).send(err)
    return Promise.reject(err)
  }
})

exports.cron = functions.https.onRequest(async (req, res) => {
  res.send(`ok`)
})
