const functions = require("firebase-functions")
const admin = require("firebase-admin")
admin.initializeApp()

const db = admin.firestore()
const fv = admin.firestore.FieldValue

const { verifyRequestSignature } = require("@slack/events-api")

const axios = require("axios")
const qs = require("qs")
const moment = require("moment")
const {
  uniq,
  pluck,
  indexBy,
  isNil,
  includes,
  map,
  mapObjIndexed,
  compose,
  sortBy,
  reverse,
  groupBy,
  prop,
  pick,
  values
} = require("ramda")

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
    body: req.rawBody
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

const execute = func => async (req, res) => {
  try {
    verifyMethod(req, "POST")
    verifyWebhook(req)
    func(req, res)
    return Promise.resolve()
  } catch (err) {
    console.error(err)
    res.status(err.code || 500).send(err)
    return Promise.reject(err)
  }
}

const MOODS = {
  1: ":tired_face:",
  2: ":white_frowning_face:",
  3: ":slightly_smiling_face:",
  4: ":smile:",
  5: ":star-struck:"
}

const CHALLENGES = {
  a: "collaboration",
  b: "loneliness",
  c: "collaboration-tools",
  d: "distractions",
  e: "unplugging"
}

const getSummary = compose(
  reverse,
  sortBy(prop("length")),
  values,
  mapObjIndexed((v, k) => ({
    length: v.length,
    value: k,
    users: compose(
      uniq,
      pluck("user_id")
    )(v)
  })),
  groupBy(prop("value"))
)

const getDateAgo = days => Date.now() - 1000 * 60 * 60 * 24 * days

const getUser = async user_id => {
  const doc = await db
    .collection("users")
    .doc(user_id)
    .get()
  return doc.exists ? doc.data() : null
}

const addSupervisor = async (req, res, url) => {
  const {
    ref,
    settings,
    user_id,
    user_name,
    supervisor,
    supervisors
  } = await initSupervisor(req)
  const body = !isNil(req.body.user_id)
    ? req.body
    : JSON.parse(req.body.payload)
  if (isNil(supervisor)) {
    message(
      `${
        isNil(body.text) ? "This user" : body.text.replace(/^@/, "")
      } is not using the motivation tracker`,
      url || res
    )
  } else if (
    isNil(settings) ||
    isNil(settings.supervisors) ||
    settings.supervisors.length === 0
  ) {
    await ref.set({ supervisors: fv.arrayUnion(user_id) }, { merge: true })
    message(`You are added as a supervisor`, url || res)
  } else if (!includes(user_id)(settings.supervisors)) {
    message(`You don't have permission to add supervisors`, url || res)
  } else {
    if (includes(supervisor.user_id)(settings.supervisors)) {
      message(`${supervisor.user_name} is already a supervisor`, url || res)
    } else {
      await ref.update({ supervisors: fv.arrayUnion(supervisor.user_id) })
      message(`${supervisor.user_name} is added as a supervisor`, url || res)
    }
  }
}

const removeSupervisor = async (req, res, url) => {
  const {
    ref,
    settings,
    user_id,
    user_name,
    supervisor,
    supervisors
  } = await initSupervisor(req)
  const body = !isNil(req.body.user_id)
    ? req.body
    : JSON.parse(req.body.payload)
  if (!includes(user_id)(supervisors)) {
    message(`You don't have permission to add supervisors`, url || res)
  } else {
    if (!includes(supervisor.user_id)(settings.supervisors)) {
      message(`${supervisor.user_name} is not a supervisor`, url || res)
    } else {
      await ref.update({ supervisors: fv.arrayRemove(supervisor.user_id) })
      message(
        `${supervisor.user_name} is removed from the supervisors`,
        url || res
      )
    }
  }
}

const askChallenge = async (url, date) => {
  const block_id = date === undefined ? "challenge" : `challenge-${date}`
  const json = {
    blocks: makeChallengeBlocks(block_id)
  }
  if (typeof url === "string") {
    await axios.post(url, json)
  } else {
    url.json(json)
  }
}

const getUserByName = async name => {
  const docs = await db
    .collection("users")
    .where("user_name", "==", name)
    .limit(1)
    .get()
  let user = null
  docs.forEach(doc => {
    user = doc.data()
  })
  return user
}

const initSupervisor = async req => {
  const body = !isNil(req.body.user_id)
    ? req.body
    : JSON.parse(req.body.payload)
  const ref = db.collection("settings").doc("default")
  const settings = (await ref.get()).data()
  const user_id = body.user_id || body.user.id
  const user_name = body.user_name || body.user.username
  const supervisor = isNil(body.text)
    ? { user_id, user_name }
    : !/^\s*$/.test(body.text)
      ? await getUserByName(body.text.replace(/^@/, ""))
      : { user_id, user_name }
  return { ref, settings, user_id, user_name, supervisor }
}

const makeMoodBlocks = block_id => [
  {
    type: "header",
    text: {
      type: "plain_text",
      text: "What is your motivation level right now?",
      emoji: true
    }
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
          text: MOODS[5]
        },
        value: "5"
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          emoji: true,
          text: MOODS[4]
        },
        value: "4"
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          emoji: true,
          text: MOODS[3]
        },
        value: "3"
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          emoji: true,
          text: MOODS[2]
        },
        value: "2"
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          emoji: true,
          text: MOODS[1]
        },
        value: "1"
      }
    ]
  }
]

const makeChallengeBlocks = block_id => [
  {
    type: "header",
    text: {
      type: "plain_text",
      text: "What was your challenge this week?",
      emoji: true
    }
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
          text: "Collaboration"
        },
        value: "a"
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          emoji: true,
          text: "Loneliness"
        },
        value: "b"
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          emoji: true,
          text: "Collaboration Tools"
        },
        value: "c"
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          emoji: true,
          text: "Distractions"
        },
        value: "d"
      },
      {
        type: "button",
        text: {
          type: "plain_text",
          emoji: true,
          text: "Unplugging"
        },
        value: "e"
      }
    ]
  }
]

const askMood = async (url, date, init = false) => {
  let json = {
    blocks: makeMoodBlocks(date === undefined ? "mood" : `mood-${date}`)
  }

  if (init) {
    json.blocks.unshift({
      type: "section",
      text: {
        type: "plain_text",
        text: "Yeah! I started motivation tracking! Here's the first one:",
        emoji: true
      }
    })
  }

  if (typeof url === "string") {
    await axios.post(url, json)
  } else {
    url.json(json)
  }
}

const thanks = async (url, solution) => {
  let text = [`Thank you, It's been recorded!`]
  if (CHALLENGES[solution] !== undefined) {
    text.push(`Here's a prescription for your challenge!`)
    text.push(`https://id-2e.com/${CHALLENGES[solution]}/`)
  }
  await axios.post(url, {
    text: text.join("\n")
  })
}

const openChannel = async user_id =>
  (await axios.post(
    "https://slack.com/api/conversations.open",
    qs.stringify({
      token: functions.config().slack.bot_token,
      users: user_id
    })
  )).data.channel.id

const ask = async (channel, blocks) =>
  await axios.post(
    "https://slack.com/api/chat.postMessage",
    { blocks: blocks, channel },
    {
      headers: {
        Authorization: `Bearer ${functions.config().slack.bot_token}`
      }
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
const message = async (mess, url) => {
  if (typeof url === "string") {
    await axios.post(url, {
      text: mess
    })
  } else {
    url.send(mess)
  }
}
const startTracking = async (req, res, url) => {
  const body = !isNil(req.body.user_id)
    ? req.body
    : JSON.parse(req.body.payload)
  const user = await getUser(body.user_id || body.user.id)
  if (user !== null && user.track === true) {
    await message(
      `You have already started the motivation tracker.`,
      url || res
    )
  } else {
    await db
      .collection("users")
      .doc(body.user_id || body.user.id)
      .set({
        last_mode: 0,
        last_challenge: 0,
        user_id: body.user_id || body.user.id,
        user_name: body.user_name || body.user.username,
        date: Date.now(),
        track: true
      })
    await askMood(isNil(url) ? res : url, undefined, true)
  }
}

const endTracking = async (req, res, url) => {
  const body = !isNil(req.body.user_id)
    ? req.body
    : JSON.parse(req.body.payload)
  const user = await getUser(body.user_id || body.user.id)
  if (user === null || user.track === false) {
    await message(`You are not using the motivation tracker yet.`, url || res)
  } else {
    await db
      .collection("users")
      .doc(body.user_id || body.user.id)
      .update({ track: false })
    await message(`You have stopped motivation tracking.`, url || res)
  }
}

const showTeamStats = async (req, res, url) => {
  const users = compose(
    indexBy(prop("user_id")),
    map(doc => doc.data())((await db.collection("users").get()).docs)
  )
  const two_months = getDateAgo(60)
  const moods = compose(
    sortBy(prop("date")),
    map(doc => doc.data())
  )(
    (await db
      .collection("moods")
      .where("date", ">=", two_months)
      .get()).docs
  )
  const mood_summary = getSummary(moods)

  const challenges = compose(
    sortBy(prop("date")),
    map(doc => doc.data())
  )(
    (await db
      .collection("challenges")
      .where("date", ">=", two_months)
      .get()).docs
  )

  const challenge_summary = getSummary(challenges)

  if (moods.length === 0 && challenges.length === 0) {
    message("No avaible data for your team", url || res)
  } else {
    let mess = ["Here's your team's stats for the last 2 months."]
    let summaries = []
    if (moods.length !== 0) {
      summaries.push("\n*Your team's motivation summary:* ")
      let _summary = []
      for (let m of mood_summary) {
        _summary.push(
          `${MOODS[m.value]} ${Math.round((m.length / moods.length) * 100)} %`
        )
      }
      summaries.push(_summary.join(" : "))
    }

    if (challenges.length !== 0) {
      summaries.push(
        "\n*The challenge summary and prescriptions for your team:* "
      )
      for (let c of challenge_summary) {
        summaries.push(
          `${CHALLENGES[c.value]} : ${Math.round(
            (c.length / challenges.length) * 100
          )} % (${c.users.join(", ")})`
        )
        summaries.push(`https://id-2e.com/${CHALLENGES[c.value]}/`)
      }
    }
    message(`${mess.join("\n")}\n${summaries.join("\n")}`, url || res)
  }
}

const showStats = async (req, res, url) => {
  const body = !isNil(req.body.user_id)
    ? req.body
    : JSON.parse(req.body.payload)
  const two_months = getDateAgo(60)
  const moods = compose(
    sortBy(prop("date")),
    map(doc => doc.data())
  )(
    (await db
      .collection("moods")
      .where("user_id", "==", body.user_id || body.user.id)
      .where("date", ">=", two_months)
      .get()).docs
  )
  const mood_summary = getSummary(moods)

  const challenges = compose(
    sortBy(prop("date")),
    map(doc => doc.data())
  )(
    (await db
      .collection("challenges")
      .where("user_id", "==", body.user_id || body.user.id)
      .where("date", ">=", two_months)
      .get()).docs
  )

  const challenge_summary = getSummary(challenges)

  if (moods.length === 0 && challenges.length === 0) {
    message("No avaible data for you", url || res)
  } else {
    let mess = ["Here's your stats for the last 2 months."]
    let summaries = []
    if (moods.length !== 0) {
      mess.push("\n*Your last motivation levels:* ")
      for (const mood of moods) {
        mess.push(
          `${moment(mood.date).format("MM/DD (ddd)")} => ${MOODS[mood.value]}`
        )
      }
      summaries.push("\n*Your motivation summary:* ")
      let _summary = []
      for (let m of mood_summary) {
        _summary.push(
          `${MOODS[m.value]} ${Math.round((m.length / moods.length) * 100)} %`
        )
      }
      summaries.push(_summary.join(" : "))
    }

    if (challenges.length !== 0) {
      mess.push("\n*Your last challenges:* ")
      for (const challenge of challenges) {
        mess.push(
          `${moment(challenge.date).format("MM/DD (ddd)")} => ${challenge.text}`
        )
      }
      summaries.push("\n*Your challenge summary and prescriptions:* ")
      for (let c of challenge_summary) {
        summaries.push(
          `${CHALLENGES[c.value]} : ${Math.round(
            (c.length / challenges.length) * 100
          )} %`
        )
        summaries.push(`https://id-2e.com/${CHALLENGES[c.value]}/`)
      }
    }
    message(`${mess.join("\n")}\n${summaries.join("\n")}`, url || res)
  }
}
exports.start_mood_tracker = functions.https.onRequest(async (req, res) => {
  try {
    verifyMethod(req, "POST")
    verifyWebhook(req)

    startTracking(req, res)

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

    endTracking(req, res)
    return Promise.resolve()
  } catch (err) {
    console.error(err)
    res.status(err.code || 500).send(err)
    return Promise.reject(err)
  }
})

exports.slack_mirror = functions.https.onRequest(async (req, res) => {
  try {
    verifyMethod(req, "POST")
    verifyWebhook(req)
    let elms = []
    const user = await getUser(req.body.user_id)
    if (user === null || user.track === false) {
      elms.push({
        type: "button",
        text: {
          type: "plain_text",
          emoji: true,
          text: "Start Tracking"
        },
        value: "a"
      })
    }
    if (!isNil(user) && user.track === true) {
      elms.push({
        type: "button",
        text: {
          type: "plain_text",
          emoji: true,
          text: "Show My Stats"
        },
        value: "b"
      })
      const {
        ref,
        settings,
        user_id,
        user_name,
        supervisor,
        supervisors
      } = await initSupervisor(req)
      if (
        isNil(settings) ||
        isNil(settings.supervisors) ||
        settings.supervisors.length === 0
      ) {
        elms.push({
          type: "button",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Add Supervisor"
          },
          value: "d"
        })
      } else if (includes(user_id)(settings.supervisors)) {
        elms.push({
          type: "button",
          text: {
            type: "plain_text",
            emoji: true,
            text: "Show Team Stats"
          },
          value: "c"
        })
      }
      elms.push({
        type: "button",
        text: {
          type: "plain_text",
          emoji: true,
          text: "Stop Tracking"
        },
        value: "f"
      })
    }
    const json = {
      blocks: [
        {
          type: "section",
          text: {
            type: "plain_text",
            text: "Welcome to Slack Mirror! What would you like to do?",
            emoji: true
          }
        },
        {
          type: "actions",
          block_id: "slack_mirror",
          elements: elms
        }
      ]
    }
    res.json(json)
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
      res.send(`You have not started the motivation tracker yet.`)
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
      res.send(`You have not started the motivation tracker yet.`)
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
        text
      })
      await db
        .collection("users")
        .doc(user_id)
        .update({
          last_challenge: date
        })
      await thanks(payload.response_url, value)
    } else if (action_type === "mood") {
      await db
        .collection("users")
        .doc(user_id)
        .update({
          last_mood: date
        })
      await db.collection("moods").add({
        date,
        user_id,
        value: +value
      })
      const user = await getUser(user_id)
      if (user.last_challenge < Date.now() - 1000 * 60 * 60 * 5) {
        await askChallenge(payload.response_url)
      } else {
        await thanks(payload.response_url)
      }
    } else if (action_type === "slack_mirror") {
      switch (value) {
        case "a":
          startTracking(req, res, payload.response_url)
          break
        case "f":
          endTracking(req, res, payload.response_url)
          break
        case "b":
          showStats(req, res, payload.response_url)
          break
        case "c":
          showTeamStats(req, res, payload.response_url)
          break
        case "d":
          addSupervisor(req, res, payload.response_url)
          break
        default:
          message("unknown command", payload.response_url)
      }
    }
    return Promise.resolve()
  } catch (err) {
    console.error(err)
    res.status(err.code || 500).send(err)
    return Promise.reject(err)
  }
})

exports.cron = functions.https.onRequest(async (req, res) => {
  const seven_days = getDateAgo(7)
  const three_days = getDateAgo(3)
  const [users_mood, users_challenge] = await Promise.all([
    db.collection("users", ["last_mood", "<", three_days]).get(),
    db.collection("users", ["last_challenge", "<", seven_days]).get()
  ])
  let prs = []
  users_mood.forEach(doc => prs.push(askMoodDM(doc.data())))
  users_challenge.forEach(doc => prs.push(askChallengeDM(doc.data())))
  if (prs.length !== 0) await Promise.all(prs)
  res.send(`ok`)
})

exports.addSupervisor = functions.https.onRequest(execute(addSupervisor))

exports.removeSupervisor = functions.https.onRequest(execute(removeSupervisor))

exports.show_mood = functions.https.onRequest(execute(showStats))

exports.show_team_mood = functions.https.onRequest(execute(showTeamStats))
