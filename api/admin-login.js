const crypto = require("crypto");

module.exports = async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {

        const { password } = req.body || {};

        if (
            !password ||
            password !== process.env.ADMIN_PASSWORD
        ) {
            return res.status(401).json({
                error: "Invalid admin password"
            });
        }

        const secret =
            process.env.ADMIN_SESSION_SECRET;

        const token = crypto
            .createHmac("sha256", secret)
            .update("ossvarium-admin")
            .digest("hex");

        res.setHeader(
            "Set-Cookie",
            `ossvarium_admin=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=2592000`
        );

        return res.status(200).json({
            success: true
        });

    } catch (error) {

        console.error(
            "OSSVARIUM admin login error:",
            error
        );

        return res.status(500).json({
            error: "Admin login failed"
        });
    }
};