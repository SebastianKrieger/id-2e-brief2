const functions = require("firebase-functions")
const admin = require("firebase-admin")
admin.initializeApp()

const db = admin.firestore()

const { verifyRequestSignature } = require("@slack/events-api")

const axios = require("axios")
const qs = require("qs")
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

const moodEmoji = {
  1: ":white_frowning_face:",
  2: ":neutral_face:",
  3: ":slightly_smiling_face:",
  4: ":smile:",
  5: ":star-struck:",
}

const solutions = {
  a: "collaboration",
  b: "loneliness",
  c: "collaboration-tools",
  d: "distractions",
  e: "unplugging",
}

const getUser = async user_id => {
  const doc = await db.collection("users").doc(user_id).get()
  return doc.exists ? doc.data() : null
}

const askChallenge = async (url, date) => {
  const block_id = date === undefined ? "challenge" : `challenge-${date}`
  const json = {
    blocks: makeChallengeBlocks(block_id),
  }
  if (typeof url === "string") {
    await axios.post(url, json)
  } else {
    url.json(json)
  }
}
const makeMoodBlocks = block_id => [
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
          text: moodEmoji[5],
        },
        value: "5",
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          emoji: true,
          text: moodEmoji[4],
        },
        value: "4",
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          emoji: true,
          text: moodEmoji[3],
        },
        value: "3",
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          emoji: true,
          text: moodEmoji[2],
        },
        value: "2",
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          emoji: true,
          text: moodEmoji[1],
        },
        value: "1",
      },
    ],
  },
]

const makeChallengeBlocks = block_id => [
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
          text: "Collaboration",
        },
        value: "a",
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          emoji: true,
          text: "Loneliness",
        },
        value: "b",
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          emoji: true,
          text: "Collaboration Tools",
        },
        value: "c",
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          emoji: true,
          text: "Distractions",
        },
        value: "d",
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          emoji: true,
          text: "Unplugging",
        },
        value: "e",
      },
    ],
  },
]

const askMood = async (url, date, init = false) => {
  let json = {
    blocks: makeMoodBlocks(date === undefined ? "mood" : `mood-${date}`),
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

const thanks = async (url, solution) => {
  let text = [`Thank you, I saved it!`]
  if (solutions[solution] !== undefined) {
    text.push(`Here's a prescription for your challenge!`)
    text.push(`https://id-2e.com/${solutions[solution]}/`)
  }
  await axios.post(url, {
    text: text.join("\n"),
  })
}

const openChannel = async user_id =>
  (
    await axios.post(
      "https://slack.com/api/conversations.open",
      qs.stringify({
        token: functions.config().slack.bot_token,
        users: user_id,
      })
    )
  ).data.channel.id

const ask = async (channel, blocks) =>
  await axios.post(
    "https://slack.com/api/chat.postMessage",
    { blocks: blocks, channel },
    {
      headers: {
        Authorization: `Bearer ${functions.config().slack.bot_token}`,
      },
    }
  )

const askMoodDM = async user =>
  await ask(await openChannel(user.user_id), makeMoodBlocks("mood"))

const askChallengeDM = async user =>
  await ask(await openChannel(user.user_id), makeChallengeBlocks("challenge"))

const parseDate = date => {
  const parsed = moment(date, "DD.MM.YYYY")
  if (parsed.isValid()) {
    return +parsed.format("x")
  } else {
    return false
  }
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
      await thanks(payload.response_url, value)
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

    const user_id = req.body.user_id

    const userData = await db
      .collection("moods")
      .where("user_id", "==", user_id)
      .get()

    if (userData.docs.length < 1) {
      throw new Error("no avaible moods for user")
    }

    let resMessage = "Your last moods: \n"

    for (const mood of userData.docs) {
      resMessage += `${new Date(mood.data().date).toLocaleDateString()} => ${
        moodEmoji[mood.data().value]
      } \n`
    }

    res.send(resMessage)

    return Promise.resolve()
  } catch (err) {
    console.error(err)
    res.status(err.code || 500).send(err)
    return Promise.reject(err)
  }
})

exports.cron = functions.https.onRequest(async (req, res) => {
  const seven_days = Date.now() - 1000 * 60 * 60 * 24 * 7
  const three_days = Date.now() - 1000 * 60 * 60 * 24 * 3
  const [users_mood, users_challenge] = await Promise.all([
    db.collection("users", ["last_mood", "<", three_days]).get(),
    db.collection("users", ["last_challenge", "<", seven_days]).get(),
  ])
  let prs = []
  users_mood.forEach(doc => prs.push(askMoodDM(doc.data())))
  users_challenge.forEach(doc => prs.push(askChallengeDM(doc.data())))
  if (prs.length !== 0) await Promise.all(prs)
  res.send(`ok`)
})
