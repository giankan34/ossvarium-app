const { neon } = require("@neondatabase/serverless");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  return res.status(501).json({
    error: "Merch submission is not enabled yet"
  });
};