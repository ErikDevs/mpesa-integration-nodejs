import { config } from "dotenv";
import express from "express";
import axios from "axios";
import moment from "moment";

config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

// Store transactions in memory for demonstration (you can use a database)
const transactions = {};

// Function to Get M-Pesa Access Token
const getAccessToken = async () => {
  const auth = Buffer.from(
    `${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`
  ).toString("base64");

  try {
    const response = await axios.get(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      { headers: { Authorization: `Basic ${auth}` } }
    );

    return response.data.access_token;
  } catch (error) {
    console.error(
      "Error getting access token:",
      error.response?.data || error.message
    );
    throw new Error("Failed to get access token");
  }
};

// Function to Initiate STK Push
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
      PartyA: req.body.phone,
      PartyB: process.env.MPESA_SHORTCODE,
      PhoneNumber: req.body.phone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: "Test Payment",
      TransactionDesc: "Payment for goods",
    };

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      payload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    console.log("STK Push Response:", response.data);

    // Store transaction in memory
    transactions[response.data.CheckoutRequestID] = {
      phone: req.body.phone,
      amount: req.body.amount,
      status: "Pending",
    };

    res.json(response.data);
  } catch (error) {
    console.error("STK Push Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to initiate STK Push" });
  }
});

// Callback Route to Receive M-Pesa Response
app.post("/callback", (req, res) => {
  console.log("M-Pesa Callback Received:", JSON.stringify(req.body, null, 2));

  const callbackData = req.body;

  if (!callbackData.Body || !callbackData.Body.stkCallback) {
    console.error("Invalid Callback Data:", callbackData);
    return res.status(400).json({ error: "Invalid callback data received" });
  }

  const {
    MerchantRequestID,
    CheckoutRequestID,
    ResultCode,
    ResultDesc,
    CallbackMetadata,
  } = callbackData.Body.stkCallback;

  if (ResultCode === 0) {
    // Successful Transaction
    const metadata = CallbackMetadata?.Item || [];
    const mpesaReceipt =
      metadata.find((item) => item.Name === "MpesaReceiptNumber")?.Value ||
      "N/A";
    const amount =
      metadata.find((item) => item.Name === "Amount")?.Value || "N/A";
    const phoneNumber =
      metadata.find((item) => item.Name === "PhoneNumber")?.Value || "N/A";
    const transactionDate =
      metadata.find((item) => item.Name === "TransactionDate")?.Value || "N/A";

    console.log("Payment Successful:");
    console.log("MerchantRequestID:", MerchantRequestID);
    console.log("CheckoutRequestID:", CheckoutRequestID);
    console.log("M-Pesa Receipt Number:", mpesaReceipt);
    console.log("Amount:", amount);
    console.log("Phone Number:", phoneNumber);
    console.log("Transaction Date:", transactionDate);

    // TODO: Store this data in a database
  } else {
    // Failed Transaction
    console.error("Payment Failed:", ResultDesc);
  }

  // Send success response to Safaricom (must return 200 OK)
  res.status(200).json({ message: "Callback received" });
});

// Start Server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
