# mpesa-integration-nodejs

This how to integrate mpesa payment to any online payment system

# M-Pesa STK Push Integration (Node.js & Express)

This is a **Node.js** application that integrates with **M-Pesa's STK Push API** to allow customers to make payments using Safaricom's Lipa Na M-Pesa online service.

## 🚀 Features
- Generate **M-Pesa Access Token**
- Send **STK Push request** to a customer's phone
- Handle **M-Pesa payment callback**

## 🛠️ Technologies Used
- **Node.js** (JavaScript runtime)
- **Express.js** (Web framework)
- **Axios** (HTTP requests)
- **Moment.js** (Date formatting)
- **dotenv** (Environment variables)

## 📌 Installation & Setup

### 1️⃣ Clone the Repository
```sh
git clone https://github.com/YOUR_GITHUB_USERNAME/mpesa-integration.git
cd mpesa-integration
```

### 2️⃣ Install Dependencies
```sh
npm install
```

### 3️⃣ Create a `.env` File
Create a `.env` file in the root directory and add the following environment variables:
```ini
PORT=3000
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=your_shortcode
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/mpesa/callback
```

**⚠️ Do not share your `.env` file!**

### 4️⃣ Start the Server
```sh
npm start
```

## 🔥 API Endpoints

### **1️⃣ Get M-Pesa Access Token**
> This function runs internally to fetch the M-Pesa API token.

### **2️⃣ STK Push Payment Request**
- **Endpoint:** `POST /mpesa/stkpush`
- **Request Body:**
```json
{
  "amount": 100,
  "phone": "2547XXXXXXXX"
}
```
- **Response:**
```json
{
  "MerchantRequestID": "8131-4f68-ab7a-5e68879d780e141198",
  "CheckoutRequestID": "ws_CO_28032025204630235712345678",
  "ResponseCode": "0",
  "ResponseDescription": "Success. Request accepted for processing",
  "CustomerMessage": "Success. Request accepted for processing"
}
```

### **3️⃣ Handle M-Pesa Callback**
- **Endpoint:** `POST /mpesa/callback`
- **Logs payment details in the console.**

## 🌐 Exposing the Local Server (For Testing)
To receive M-Pesa callbacks on your local machine, use **Ngrok**:
```sh
ngrok http 3000
```
Update `.env` with the generated public URL:
```ini
MPESA_CALLBACK_URL=https://randomname.ngrok.io/mpesa/callback
```

## 🚀 Deployment
To deploy this app online, use services like:
- **Render** ([https://render.com](https://render.com))
- **Railway** ([https://railway.app](https://railway.app))

## 📜 License
This project is open-source and free to use.

---
**Need Help?** Feel free to open an **issue** on GitHub! 🚀

