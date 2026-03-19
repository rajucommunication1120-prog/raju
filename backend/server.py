from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'digir-hub-secret-key-2025')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 720  # 30 days

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="DIGIR HUB API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============= Models =============

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    phone: str
    name: str
    email: Optional[str] = None
    pin: Optional[str] = None
    wallet_balance: float = 0.0
    kyc_status: str = "pending"  # pending, submitted, verified
    kyc_aadhar: Optional[str] = None
    kyc_pan: Optional[str] = None
    role: str = "retailer"  # retailer, admin
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # recharge, dth, bill, aeps, dmt, wallet
    service: str  # prepaid, postpaid, electricity, water, gas, etc
    amount: float
    commission: float = 0.0
    status: str  # success, failed, pending
    details: dict
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ============= Request/Response Models =============

class SendOTPRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str
    name: str

class SetPINRequest(BaseModel):
    pin: str

class LoginWithPINRequest(BaseModel):
    phone: str
    pin: str

class RechargeRequest(BaseModel):
    operator: str
    number: str
    amount: float
    type: str  # prepaid, postpaid, dth

class BillPaymentRequest(BaseModel):
    service: str  # electricity, water, gas
    provider: str
    account_number: str
    amount: float

class AEPSRequest(BaseModel):
    aadhar_number: str
    type: str  # balance, withdrawal
    amount: Optional[float] = None

class DMTRequest(BaseModel):
    beneficiary_name: str
    account_number: str
    ifsc: str
    amount: float

class AddMoneyRequest(BaseModel):
    amount: float

class UpdateKYCRequest(BaseModel):
    aadhar_base64: Optional[str] = None
    pan_base64: Optional[str] = None

# ============= Helper Functions =============

def create_token(user_id: str) -> str:
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_token(token: str) -> str:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    user_id = verify_token(credentials.credentials)
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

def hash_pin(pin: str) -> str:
    return bcrypt.hashpw(pin.encode(), bcrypt.gensalt()).decode()

def verify_pin(pin: str, hashed: str) -> bool:
    return bcrypt.checkpw(pin.encode(), hashed.encode())

def mock_transaction_result() -> tuple[str, bool]:
    """Mock transaction processing - 95% success rate"""
    success = random.random() < 0.95
    if success:
        return str(uuid.uuid4())[:12].upper(), True
    return "FAILED", False

# ============= Authentication Routes =============

@api_router.post("/auth/send-otp")
async def send_otp(request: SendOTPRequest):
    """Send OTP to phone number (MOCKED - returns 123456)"""
    # In production, integrate with SMS service like Twilio/MSG91
    return {
        "success": True,
        "message": "OTP sent successfully",
        "otp": "123456"  # Mocked OTP for testing
    }

@api_router.post("/auth/verify-otp")
async def verify_otp(request: VerifyOTPRequest):
    """Verify OTP and create/login user"""
    # Mock OTP verification (accept 123456)
    if request.otp != "123456":
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Check if user exists
    existing_user = await db.users.find_one({"phone": request.phone})
    
    if existing_user:
        # Login existing user
        token = create_token(existing_user['id'])
        return {
            "success": True,
            "token": token,
            "user": User(**existing_user).dict(),
            "is_new_user": False
        }
    else:
        # Create new user
        user = User(phone=request.phone, name=request.name)
        await db.users.insert_one(user.dict())
        token = create_token(user.id)
        return {
            "success": True,
            "token": token,
            "user": user.dict(),
            "is_new_user": True
        }

@api_router.post("/auth/set-pin")
async def set_pin(request: SetPINRequest, current_user: dict = Depends(get_current_user)):
    """Set or update user PIN"""
    hashed = hash_pin(request.pin)
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"pin": hashed, "updated_at": datetime.utcnow()}}
    )
    return {"success": True, "message": "PIN set successfully"}

@api_router.post("/auth/login-pin")
async def login_with_pin(request: LoginWithPINRequest):
    """Login with phone and PIN"""
    user = await db.users.find_one({"phone": request.phone})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.get('pin'):
        raise HTTPException(status_code=400, detail="PIN not set. Please login with OTP first.")
    
    if not verify_pin(request.pin, user['pin']):
        raise HTTPException(status_code=400, detail="Invalid PIN")
    
    token = create_token(user['id'])
    return {
        "success": True,
        "token": token,
        "user": User(**user).dict()
    }

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user details"""
    return User(**current_user).dict()

# ============= Wallet Routes =============

@api_router.post("/wallet/add-money")
async def add_money(request: AddMoneyRequest, current_user: dict = Depends(get_current_user)):
    """Add money to wallet (MOCKED payment gateway)"""
    # Mock payment gateway success
    transaction_id, success = mock_transaction_result()
    
    if success:
        new_balance = current_user['wallet_balance'] + request.amount
        await db.users.update_one(
            {"id": current_user['id']},
            {"$set": {"wallet_balance": new_balance, "updated_at": datetime.utcnow()}}
        )
        
        # Create transaction record
        transaction = Transaction(
            user_id=current_user['id'],
            type="wallet",
            service="add_money",
            amount=request.amount,
            status="success",
            details={"transaction_id": transaction_id, "method": "UPI"}
        )
        await db.transactions.insert_one(transaction.dict())
        
        return {
            "success": True,
            "message": "Money added successfully",
            "new_balance": new_balance,
            "transaction_id": transaction_id
        }
    else:
        return {"success": False, "message": "Payment failed. Please try again."}

@api_router.get("/wallet/balance")
async def get_balance(current_user: dict = Depends(get_current_user)):
    """Get wallet balance"""
    return {"balance": current_user['wallet_balance']}

# ============= Recharge Routes =============

@api_router.post("/recharge")
async def recharge(request: RechargeRequest, current_user: dict = Depends(get_current_user)):
    """Mobile/DTH Recharge (MOCKED)"""
    # Check balance
    if current_user['wallet_balance'] < request.amount:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")
    
    # Mock recharge processing
    transaction_id, success = mock_transaction_result()
    
    # Calculate commission (2% for recharge)
    commission = request.amount * 0.02 if success else 0
    
    if success:
        # Deduct from wallet
        new_balance = current_user['wallet_balance'] - request.amount
        await db.users.update_one(
            {"id": current_user['id']},
            {"$set": {"wallet_balance": new_balance, "updated_at": datetime.utcnow()}}
        )
    
    # Create transaction record
    transaction = Transaction(
        user_id=current_user['id'],
        type="recharge",
        service=request.type,
        amount=request.amount,
        commission=commission,
        status="success" if success else "failed",
        details={
            "operator": request.operator,
            "number": request.number,
            "transaction_id": transaction_id
        }
    )
    await db.transactions.insert_one(transaction.dict())
    
    return {
        "success": success,
        "message": "Recharge successful" if success else "Recharge failed",
        "transaction_id": transaction_id,
        "commission": commission,
        "new_balance": new_balance if success else current_user['wallet_balance']
    }

# ============= Bill Payment Routes =============

@api_router.post("/bill-payment")
async def bill_payment(request: BillPaymentRequest, current_user: dict = Depends(get_current_user)):
    """Bill Payment - Electricity/Water/Gas (MOCKED BBPS)"""
    # Check balance
    if current_user['wallet_balance'] < request.amount:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")
    
    # Mock bill payment processing
    transaction_id, success = mock_transaction_result()
    
    # Calculate commission (1.5% for bill payment)
    commission = request.amount * 0.015 if success else 0
    
    if success:
        # Deduct from wallet
        new_balance = current_user['wallet_balance'] - request.amount
        await db.users.update_one(
            {"id": current_user['id']},
            {"$set": {"wallet_balance": new_balance, "updated_at": datetime.utcnow()}}
        )
    
    # Create transaction record
    transaction = Transaction(
        user_id=current_user['id'],
        type="bill",
        service=request.service,
        amount=request.amount,
        commission=commission,
        status="success" if success else "failed",
        details={
            "provider": request.provider,
            "account_number": request.account_number,
            "transaction_id": transaction_id
        }
    )
    await db.transactions.insert_one(transaction.dict())
    
    return {
        "success": success,
        "message": "Bill payment successful" if success else "Bill payment failed",
        "transaction_id": transaction_id,
        "commission": commission,
        "new_balance": new_balance if success else current_user['wallet_balance']
    }

# ============= AEPS Routes =============

@api_router.post("/aeps")
async def aeps(request: AEPSRequest, current_user: dict = Depends(get_current_user)):
    """AEPS - Balance Check / Cash Withdrawal (MOCKED)"""
    transaction_id, success = mock_transaction_result()
    
    commission = 0
    new_balance = current_user['wallet_balance']
    
    if request.type == "withdrawal" and success:
        # For withdrawal, add amount to wallet (minus commission)
        commission = request.amount * 0.005  # 0.5% commission
        amount_to_add = request.amount - commission
        new_balance = current_user['wallet_balance'] + amount_to_add
        
        await db.users.update_one(
            {"id": current_user['id']},
            {"$set": {"wallet_balance": new_balance, "updated_at": datetime.utcnow()}}
        )
    
    # Create transaction record
    transaction = Transaction(
        user_id=current_user['id'],
        type="aeps",
        service=request.type,
        amount=request.amount or 0,
        commission=commission,
        status="success" if success else "failed",
        details={
            "aadhar": request.aadhar_number[-4:],  # Store only last 4 digits
            "transaction_id": transaction_id,
            "bank_balance": round(random.uniform(5000, 50000), 2) if request.type == "balance" else None
        }
    )
    await db.transactions.insert_one(transaction.dict())
    
    response = {
        "success": success,
        "message": f"AEPS {request.type} successful" if success else f"AEPS {request.type} failed",
        "transaction_id": transaction_id,
        "commission": commission
    }
    
    if request.type == "balance" and success:
        response["bank_balance"] = transaction.details["bank_balance"]
    else:
        response["new_balance"] = new_balance
    
    return response

# ============= DMT Routes =============

@api_router.post("/dmt")
async def dmt(request: DMTRequest, current_user: dict = Depends(get_current_user)):
    """Money Transfer (MOCKED DMT)"""
    # Check balance
    if current_user['wallet_balance'] < request.amount:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")
    
    # Mock DMT processing
    transaction_id, success = mock_transaction_result()
    
    # Calculate commission (0.5% for DMT)
    commission = request.amount * 0.005 if success else 0
    
    if success:
        # Deduct from wallet
        new_balance = current_user['wallet_balance'] - request.amount
        await db.users.update_one(
            {"id": current_user['id']},
            {"$set": {"wallet_balance": new_balance, "updated_at": datetime.utcnow()}}
        )
    
    # Create transaction record
    transaction = Transaction(
        user_id=current_user['id'],
        type="dmt",
        service="money_transfer",
        amount=request.amount,
        commission=commission,
        status="success" if success else "failed",
        details={
            "beneficiary_name": request.beneficiary_name,
            "account_number": request.account_number,
            "ifsc": request.ifsc,
            "transaction_id": transaction_id
        }
    )
    await db.transactions.insert_one(transaction.dict())
    
    return {
        "success": success,
        "message": "Money transfer successful" if success else "Money transfer failed",
        "transaction_id": transaction_id,
        "commission": commission,
        "new_balance": new_balance if success else current_user['wallet_balance']
    }

# ============= Transaction Routes =============

@api_router.get("/transactions")
async def get_transactions(
    limit: int = 50,
    skip: int = 0,
    type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get transaction history"""
    query = {"user_id": current_user['id']}
    if type:
        query["type"] = type
    
    transactions = await db.transactions.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.transactions.count_documents(query)
    
    return {
        "transactions": [Transaction(**t).dict() for t in transactions],
        "total": total,
        "limit": limit,
        "skip": skip
    }

@api_router.get("/transactions/stats")
async def get_transaction_stats(current_user: dict = Depends(get_current_user)):
    """Get transaction statistics"""
    # Get total commission earned
    pipeline = [
        {"$match": {"user_id": current_user['id'], "status": "success"}},
        {"$group": {"_id": None, "total_commission": {"$sum": "$commission"}}}
    ]
    result = await db.transactions.aggregate(pipeline).to_list(1)
    total_commission = result[0]['total_commission'] if result else 0
    
    # Get transaction counts by type
    pipeline = [
        {"$match": {"user_id": current_user['id']}},
        {"$group": {"_id": "$type", "count": {"$sum": 1}}}
    ]
    counts = await db.transactions.aggregate(pipeline).to_list(10)
    
    return {
        "total_commission": round(total_commission, 2),
        "counts": {item['_id']: item['count'] for item in counts}
    }

# ============= KYC Routes =============

@api_router.post("/kyc/upload")
async def upload_kyc(request: UpdateKYCRequest, current_user: dict = Depends(get_current_user)):
    """Upload KYC documents (Aadhar/PAN as base64)"""
    update_data = {"updated_at": datetime.utcnow()}
    
    if request.aadhar_base64:
        update_data["kyc_aadhar"] = request.aadhar_base64
    
    if request.pan_base64:
        update_data["kyc_pan"] = request.pan_base64
    
    if request.aadhar_base64 or request.pan_base64:
        update_data["kyc_status"] = "submitted"
    
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": update_data}
    )
    
    return {"success": True, "message": "KYC documents uploaded successfully"}

@api_router.get("/kyc/status")
async def get_kyc_status(current_user: dict = Depends(get_current_user)):
    """Get KYC status"""
    return {
        "status": current_user.get('kyc_status', 'pending'),
        "has_aadhar": bool(current_user.get('kyc_aadhar')),
        "has_pan": bool(current_user.get('kyc_pan'))
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
