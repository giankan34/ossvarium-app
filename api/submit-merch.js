const { neon } = require("@neondatabase/serverless");

const crypto = require("crypto");

const {
  S3Client,
  HeadObjectCommand
} = require("@aws-sdk/client-s3");

module.exports = async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

    const sql = neon(process.env.POSTGRES_URL);

    // Public merch checkout configuration
if (
  req.method === "GET" &&
  req.query?.action === "checkout-config"
) {
  return res.status(200).json({
    success: true,
    maxQuantityPerOrder: 1,
    shippingArrangement: "direct_with_artist",
    currency: "PI"
  });
}


  // Check the authenticated buyer's latest merch order
  if (
    req.method === "GET" &&
    req.query?.action === "order-status"
  ) {
    try {
      const authHeader = req.headers.authorization || "";

      if (!authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          error: "Pi authentication required"
        });
      }

      const piResponse = await fetch(
        "https://api.minepi.com/v2/me",
        { headers: { Authorization: authHeader } }
      );

      if (!piResponse.ok) {
        return res.status(401).json({
          error: "Invalid Pi authentication"
        });
      }

      const piUser = await piResponse.json();

      if (!piUser.uid) {
        return res.status(401).json({
          error: "Missing Pi user identity"
        });
      }

      const orders = await sql`
  SELECT id, status, pi_payment_id, pi_txid,
         checkout_token, expires_at
  FROM merch_orders
  WHERE buyer_pi_uid = ${String(piUser.uid)}
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1
`;
      if (!orders.length) {
        return res.status(200).json({
          success: true,
          order: null
        });
      }

      const order = orders[0];

      let piPaymentStatus = null;

if (order?.status === "pending" && order.pi_payment_id) {
  const paymentResponse = await fetch(
    `https://api.minepi.com/v2/payments/${encodeURIComponent(order.pi_payment_id)}`,
    {
      headers: {
        Authorization: `Key ${process.env.PI_API_KEY}`
      }
    }
  );

  if (!paymentResponse.ok) {
    throw new Error("Unable to verify pending Pi payment");
  }

  const payment = await paymentResponse.json();

  if (
    payment.user_uid !== String(piUser.uid) ||
    payment.identifier !== order.pi_payment_id ||
    payment.metadata?.purpose !== "merch_purchase" ||
    payment.metadata?.checkoutToken !== String(order.checkout_token)
  ) {
    throw new Error("Pending Pi payment does not match merch order");
  }

  piPaymentStatus = {
    developerApproved: payment.status?.developer_approved === true,
    developerCompleted: payment.status?.developer_completed === true,
    cancelled: payment.status?.cancelled === true,
    hasTransaction: Boolean(payment.transaction?.txid)
  };
}

      return res.status(200).json({
  success: true,
  order: order ? {
    id: String(order.id),
    status: order.status,
    hasPayment: Boolean(order.pi_payment_id),
    completed: order.status === "paid",
    expired: new Date(order.expires_at).getTime() < Date.now(),
    piPaymentStatus
  } : null
});

    } catch (error) {
      console.error("Merch order status error:", error);

      return res.status(500).json({
        error: "Unable to check merch order"
      });
    }
  }


// Validate merch checkout details before creating an order
if (
  req.method === "POST" &&
  req.query?.action === "create-order"
) {

  // Fail closed: no new stock reservations until Pi/Neon expiry reconciliation is verified.
  // This guard intentionally does not block existing payment completion or recovery.
  if (process.env.MERCH_CHECKOUT_VERIFIED !== "true") {
    return res.status(503).json({
      error: "Merch checkout is temporarily unavailable while payment safety is verified.",
      code: "MERCH_CHECKOUT_DISABLED"
    });
  }

  const authHeader = req.headers.authorization || "";

if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
        error: "Pi authentication required for merch checkout"
    });
}

const accessToken = authHeader.slice(7).trim();

if (!accessToken) {
    return res.status(401).json({
        error: "Missing Pi access token"
    });
}

const piResponse = await fetch(
    "https://api.minepi.com/v2/me",
    {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    }
);

if (!piResponse.ok) {
    return res.status(401).json({
        error: "Invalid Pi authentication"
    });
}

const piUser = await piResponse.json();

if (!piUser.uid) {
    return res.status(401).json({
        error: "Missing Pi user identity"
    });
}
  
  const productId = String(req.body?.productId ?? "").trim();
  const selectedSize = String(req.body?.selectedSize ?? "").trim();

  if (!/^\d+$/.test(productId) || productId === "0") {
    return res.status(400).json({
      error: "Invalid product ID"
    });
  }

  try {
    const products = await sql`
      SELECT id, price_pi, quantity, sizes
      FROM merch_products
      WHERE id = ${productId}::bigint
        AND status = 'approved'
      LIMIT 1
    `;

    if (!products.length || Number(products[0].quantity) < 1) {
      return res.status(409).json({
        error: "Product unavailable"
      });
    }

    const product = products[0];
    const sizes = Array.isArray(product.sizes) ? product.sizes : [];

    if (
      (sizes.length > 0 && !sizes.includes(selectedSize)) ||
      (sizes.length === 0 && selectedSize !== "")
    ) {
      return res.status(400).json({
        error: "Invalid size selection"
      });
    }

    const pricePi = String(product.price_pi);
const totalUnits = BigInt(
  pricePi.includes(".")
    ? pricePi.split(".")[0] + pricePi.split(".")[1].padEnd(7, "0")
    : pricePi + "0000000"
);

const artistUnits = totalUnits * 90n / 100n;
const feeUnits = totalUnits - artistUnits;

const toPi = (units) =>
  `${units / 10000000n}.${String(units % 10000000n).padStart(7, "0")}`;

const checkoutToken = crypto.randomUUID();
const buyerPiUid = String(piUser.uid);

const orders = await sql`
  SELECT *
  FROM create_reserved_merch_order(
    ${productId}::bigint,
    ${selectedSize || null}::text,
    ${pricePi}::numeric,
    ${toPi(artistUnits)}::numeric,
    ${toPi(feeUnits)}::numeric,
    ${checkoutToken}::uuid,
    ${buyerPiUid}::text
  )
`;

   if (!orders.length) {
  return res.status(409).json({
    error: "Product unavailable or insufficient stock"
  });
}

return res.status(201).json({
  success: true,
  orderId: String(orders[0].order_id),
  checkoutToken: orders[0].order_token,
  expiresAt: orders[0].order_expires_at,
  productId: String(product.id),
  selectedSize,
  quantity: 1,
  pricePi: String(product.price_pi),
  shippingArrangement: "direct_with_artist"
});
  } catch (error) {
  console.error("Merch checkout validation failed:", error);

  if (
    error.code === "23505" &&
    String(error.message || "").includes(
      "idx_merch_one_active_order_per_buyer"
    )
  ) {
    return res.status(409).json({
      error: "You already have a pending merch order. Please resolve it before starting another purchase.",
      code: "MERCH_ORDER_PENDING"
    });
  }

  return res.status(500).json({
    error: "Unable to validate merch checkout"
  });
}
}

    
  // Public MERCH catalog — approved products only
  if (
    req.method === "GET" &&
    req.query?.action === "catalog"
  ) {
    try {
      const products = await sql`
  SELECT
    m.id,
    m.artist_name,
    m.product_name,
    m.product_type,
    m.description,
    m.price_pi,
    m.quantity,
    m.sizes,
    m.photos,
    m.main_photo_index,
    (
      SELECT NULLIF(TRIM(ap.public_email), '')
      FROM artist_profiles ap
      WHERE LOWER(TRIM(ap.artist_name)) =
            LOWER(TRIM(m.artist_name))
        AND ap.public_email IS NOT NULL
      LIMIT 1
    ) AS public_email
  FROM merch_products m
  WHERE m.status = 'approved'
  ORDER BY m.created_at DESC
`;

      return res.status(200).json({
        success: true,
        products
      });
    } catch (error) {
      console.error("Public merch catalog error:", error);

      return res.status(500).json({
        error: "Failed to load merch catalog"
      });
    }
  }


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

  // Bind merch to the authenticated creator's existing artist profile.
  // Never trust the submitted artistName as proof of ownership.
  let creatorArtistName;
  try {
    const profiles = await sql`
      SELECT artist_name FROM artist_profiles
      WHERE (
        (${verifiedCreatorPiUid}::text IS NOT NULL AND creator_pi_uid = ${verifiedCreatorPiUid})
        OR
        (${verifiedCreatorPiUid}::text IS NULL AND ${verifiedCreatorEmail}::text IS NOT NULL
          AND LOWER(creator_email) = ${verifiedCreatorEmail})
      )
      LIMIT 1
    `;
    creatorArtistName = String(profiles[0]?.artist_name || "").trim();
  } catch (error) {
    console.error("Merch artist ownership lookup failed:", error);
    return res.status(500).json({ error: "Failed to verify artist profile" });
  }
  if (!creatorArtistName || creatorArtistName.toLowerCase() !== cleanArtistName.toLowerCase()) {
    return res.status(403).json({
      error: "Merch artist must match your saved creator profile"
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
    const ownedPhotos = await sql`
      SELECT object_key
      FROM merch_uploads
      WHERE object_key IN (
    SELECT jsonb_array_elements_text(${JSON.stringify(productPhotos)}::jsonb)
)
        AND (
          (${verifiedCreatorPiUid}::text IS NOT NULL
            AND creator_pi_uid = ${verifiedCreatorPiUid})
          OR
          (${verifiedCreatorEmail}::text IS NOT NULL
            AND creator_email = ${verifiedCreatorEmail})
        )
    `;

    const ownedKeys = new Set(
      ownedPhotos.map(row => row.object_key)
    );

    if (
      new Set(productPhotos).size !== productPhotos.length ||
      productPhotos.some(photo => !ownedKeys.has(photo))
    ) {
      return res.status(403).json({
        error: "Invalid or unauthorized merch photos"
      });
    }
  } catch (error) {
    console.error("Merch photo ownership check failed:", error);

    return res.status(500).json({
      error: "Failed to verify merch photos"
    });
  }

    const s3 = new S3Client({
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  forcePathStyle: true
});

for (const photoKey of productPhotos) {
  try {
    
    const photoInfo = await s3.send(new HeadObjectCommand({
  Bucket: "ossvarium-private-audio",
  Key: photoKey
}));

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

if (
  !allowedImageTypes.includes(photoInfo.ContentType) ||
  !Number.isSafeInteger(photoInfo.ContentLength) ||
  photoInfo.ContentLength <= 0 ||
  photoInfo.ContentLength > 10 * 1024 * 1024
) {
  return res.status(400).json({
    error: "Invalid merch image type or size"
  });
}

  } catch (error) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return res.status(400).json({
        error: "One or more merch photos have not been uploaded"
      });
    }

    throw error;
  }
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
      ${creatorArtistName},
      ${verifiedCreatorPiUid},
      ${verifiedCreatorEmail},
      ${cleanProductName},
      ${cleanProductType},
      ${cleanDescription},
      ${productPrice},
      ${productQuantity},
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