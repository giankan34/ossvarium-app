const { neon } = require("@neondatabase/serverless");

const crypto = require("crypto");

module.exports = async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

    const sql = neon(process.env.POSTGRES_URL);

      // OSSVARIUM creator authentication
  const creatorSessionHeader =
    req.headers["x-creator-session"] || "";

  const authHeader =
    req.headers.authorization || "";

  let verifiedCreatorEmail = null;
  let verifiedCreatorPiUid = null;

  if (!creatorSessionHeader && !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Creator authentication required"
    });
  }

    if (
  creatorSessionHeader &&
  !authHeader.startsWith("Bearer ")
) {
    try {
      const [payload, signature] = creatorSessionHeader.split(".");

      if (!payload || !signature) {
        throw new Error("Invalid session format");
      }

      const expectedSignature = crypto
        .createHmac("sha256", process.env.CREATOR_SESSION_SECRET)
        .update(payload)
        .digest("base64url");

      const supplied = Buffer.from(signature);
      const expected = Buffer.from(expectedSignature);

      if (
        supplied.length !== expected.length ||
        !crypto.timingSafeEqual(supplied, expected)
      ) {
        throw new Error("Invalid session signature");
      }

      const session = JSON.parse(
        Buffer.from(payload, "base64url").toString("utf8")
      );

      if (
        !session.email ||
        !session.expiresAt ||
        Date.now() >= Number(session.expiresAt)
      ) {
        throw new Error("Session expired");
      }

      verifiedCreatorEmail = String(session.email)
        .trim()
        .toLowerCase();

    } catch (error) {
      return res.status(401).json({
        error: "Invalid or expired creator session"
      });
    }
  }

    if (authHeader.startsWith("Bearer ")) {
    try {
      const accessToken = authHeader.substring(7);

      const piResponse = await fetch(
        "https://api.minepi.com/v2/me",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      );

      if (!piResponse.ok) {
        throw new Error("Pi authentication failed");
      }

      const piUser = await piResponse.json();

      if (!piUser.uid) {
        throw new Error("Missing Pi user ID");
      }

      verifiedCreatorPiUid = piUser.uid;

    } catch (error) {
      return res.status(401).json({
        error: "Invalid Pi authentication"
      });
    }
  }

  // Load merchandise belonging to the authenticated creator
if (req.method === "GET") {
  try {
    const products = await sql`
      SELECT
        id,
        artist_name,
        product_name,
        product_type,
        description,
        price_pi,
        quantity,
        sizes,
        photos,
        main_photo_index,
        status,
        created_at
      FROM merch_products
      WHERE (
        (${verifiedCreatorPiUid}::text IS NOT NULL
          AND creator_pi_uid = ${verifiedCreatorPiUid})
        OR
        (${verifiedCreatorEmail}::text IS NOT NULL
          AND creator_email = ${verifiedCreatorEmail})
      )
      ORDER BY created_at DESC
    `;

    return res.status(200).json({ products });

  } catch (error) {
    console.error("Failed to load creator merch:", error);

    return res.status(500).json({
      error: "Failed to load merchandise"
    });
  }
}

    // Read incoming merch product details
  const {
    artistName,
    productName,
    productType,
    description,
    pricePi,
    quantity,
    sizes,
    photos,
    mainPhotoIndex
  } = req.body || {};

    // Validate required merch fields
  const cleanArtistName = String(artistName || "").trim();
  const cleanProductName = String(productName || "").trim();
  const cleanProductType = String(productType || "").trim();

    // Validate artist and product name lengths
  if (
    cleanArtistName.length > 150 ||
    cleanProductName.length > 200
  ) {
    return res.status(400).json({
      error: "Artist or product name is too long"
    });
  }

    // Validate product type
  if (cleanProductType.length > 50) {
    return res.status(400).json({
      error: "Product type must not exceed 50 characters"
    });
  }

  const productPrice = Number(pricePi);
  const productQuantity = Number(quantity);

    // Validate Pi price precision
  const priceText = String(pricePi ?? "").trim();

  if (
    !/^\d+(\.\d{1,7})?$/.test(priceText) ||
    priceText.split(".")[0].length > 11
  ) {
    return res.status(400).json({
      error: "Invalid Pi price format"
    });
  }

  if (
    !cleanArtistName ||
    !cleanProductName ||
    !cleanProductType
  ) {
    return res.status(400).json({
      error: "Artist name, product name and product type are required"
    });
  }

  if (!Number.isFinite(productPrice) || productPrice <= 0) {
    return res.status(400).json({
      error: "Product price must be greater than zero"
    });
  }

  if (
    !Number.isSafeInteger(productQuantity) ||
    productQuantity < 0
  ) {
    return res.status(400).json({
      error: "Product quantity must be a non-negative integer"
    });
  }

    // Validate product description
  const cleanDescription = String(description || "").trim();

  if (cleanDescription.length > 5000) {
    return res.status(400).json({
      error: "Product description must not exceed 5000 characters"
    });
  }

    // Validate merch photo metadata
  const productPhotos = Array.isArray(photos) ? photos : [];
    // Validate product sizes
  const productSizes = Array.isArray(sizes) ? sizes : [];

  if (
    productSizes.length > 20 ||
    !productSizes.every(
      (size) =>
        typeof size === "string" &&
        size.trim().length > 0 &&
        size.trim().length <= 30
    )
  ) {
    return res.status(400).json({
      error: "Invalid product sizes"
    });
  }
  const selectedMainPhoto = Number(mainPhotoIndex);

    // Validate product photo references
  if (
    !productPhotos.every(
      (photo) =>
        typeof photo === "string" &&
        photo.length > 0 &&
        photo.length <= 2048 &&
        /^merch-images\/[a-zA-Z0-9._-]+$/.test(photo)
    )
  ) {
    return res.status(400).json({
      error: "Invalid product photo references"
    });
  }

  if (productPhotos.length === 0 || productPhotos.length > 8) {
    return res.status(400).json({
      error: "Upload between 1 and 8 product photos"
    });
  }

  if (
    !Number.isSafeInteger(selectedMainPhoto) ||
    selectedMainPhoto < 0 ||
    selectedMainPhoto >= productPhotos.length
  ) {
    return res.status(400).json({
      error: "Invalid main product photo selection"
    });
  }

  try {
  const rows = await sql`
    INSERT INTO merch_products (
      artist_name,
      creator_pi_uid,
      creator_email,
      product_name,
      product_type,
      description,
      price_pi,
      quantity,
      sizes,
      photos,
      main_photo_index,
      status
    )
    VALUES (
      ${cleanArtistName},
      ${verifiedCreatorPiUid},
      ${verifiedCreatorEmail},
      ${cleanProductName},
      ${cleanProductType},
      ${description},
      ${pricePi},
      ${quantity},
      ${JSON.stringify(productSizes)}::jsonb,
      ${JSON.stringify(productPhotos)}::jsonb,
      ${selectedMainPhoto},
      'pending'
    )
    RETURNING id, status
  `;

  return res.status(201).json({
    success: true,
    merchId: rows[0].id,
    status: rows[0].status
  });
} catch (error) {
  console.error("Merch submission failed:", error);
  return res.status(500).json({
    error: "Failed to save merch submission"
  });
}
};