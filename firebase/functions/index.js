const functions = require("firebase-functions")
const admin = require("firebase-admin")
admin.initializeApp()

const db = admin.firestore()

const { verifyRequestSignature } = require("@slack/events-api")

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
