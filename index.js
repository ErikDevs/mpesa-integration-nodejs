import { config } from "dotenv";
import express from "express";
import axios from "axios";
import moment from "moment";

config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

const getAccessToken = async () => {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  try {
    const response = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );

    console.log("M-Pesa Access Token Response:", response.data); // ✅ Log response
    return response.data.access_token;
  } catch (error) {
    console.error(
      "Error getting access token:",
      error.response ? error.response.data : error.message
    );
    throw new Error("Failed to get access token");
  }
};

// Lipa Na M-Pesa Online Payment (STK Push)
app.post("/mpesa/stkpush", async (req, res) => {
  try {
    const accessToken = await getAccessToken();
    const timestamp = moment().format("YYYYMMDDHHmmss");
    const password = Buffer.from(
      `${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${timestamp}`
    ).toString("base64");

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: req.body.amount,
      PartyA: req.body.phone, // Customer's phone number (format: 2547XXXXXXXX)
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: req.body.phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: "Test Payment",
      TransactionDesc: "Payment for goods",
    };

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      payload,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error("STK Push Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to initiate STK Push" });
  }
});

app.post("/mpesa/callback", (req, res) => {
  console.log("📥 M-Pesa Callback Received:", req.body);

  const callbackData = req.body.Body.stkCallback;

  if (!callbackData) {
    return res.status(400).json({ error: "Invalid callback data" });
  }

  // Check if the transaction was successful
  if (callbackData.ResultCode === 0) {
    // Extract important details
    const amount = callbackData.CallbackMetadata.Item.find(
      (item) => item.Name === "Amount"
    )?.Value;
    const receipt = callbackData.CallbackMetadata.Item.find(
      (item) => item.Name === "MpesaReceiptNumber"
    )?.Value;
    const phone = callbackData.CallbackMetadata.Item.find(
      (item) => item.Name === "PhoneNumber"
    )?.Value;

    console.log(
      `✅ Payment Successful! Amount: ${amount}, Receipt: ${receipt}, Phone: ${phone}`
    );

    // Store transaction details in your database here
  } else {
    console.log(`❌ Payment Failed: ${callbackData.ResultDesc}`);
  }

  res.status(200).send("Callback received");
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
