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
JWT_SECRET = os.environ['JWT_SECRET']
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
    role: str = "retailer"  # admin, distributor, retailer
    parent_id: Optional[str] = None  # ID of parent distributor
    referral_code: str = Field(default_factory=lambda: str(uuid.uuid4())[:8].upper())
    referred_by: Optional[str] = None  # referral_code of referrer
    is_active: bool = True
    commission_rates: dict = Field(default_factory=lambda: {
        "recharge": 2.0,
        "bill": 1.5,
        "aeps": 0.5,
        "dmt": 0.5
    })
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str  # recharge, dth, bill, aeps, dmt, wallet
    service: str  # prepaid, postpaid, electricity, water, gas, etc
    amount: float
    commission: float = 0.0
    distributor_id: Optional[str] = None
    distributor_commission: float = 0.0
    status: str  # success, failed, pending
    details: dict
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Referral(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    referrer_id: str
    referred_id: str
    referral_code: str
    reward_amount: float = 0.0
    reward_credited: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

# ============= Request/Response Models =============

class SendOTPRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str
    name: str
    referral_code: Optional[str] = None
    role: Optional[str] = "retailer"  # retailer or distributor

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

# ============= SUPER DISTRIBUTION ROUTES =============

# Request Models for Distributor Features
class CreateRetailerRequest(BaseModel):
    phone: str
    name: str
    email: Optional[str] = None
    referral_code: Optional[str] = None

class UpdateRetailerRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    commission_rates: Optional[dict] = None
    is_active: Optional[bool] = None

class UpdateWalletRequest(BaseModel):
    retailer_id: str
    amount: float
    action: str  # add or deduct

@api_router.post("/retailer/create")
async def create_retailer(request: CreateRetailerRequest, current_user: dict = Depends(get_current_user)):
    """Create a new retailer under distributor (Distributor only)"""
    if current_user['role'] not in ['distributor', 'admin']:
        raise HTTPException(status_code=403, detail="Only distributors can create retailers")
    
    # Check if phone already exists
    existing = await db.users.find_one({"phone": request.phone})
    if existing:
        raise HTTPException(status_code=400, detail="Phone number already registered")
    
    # Check referral code if provided
    referrer_id = None
    if request.referral_code:
        referrer = await db.users.find_one({"referral_code": request.referral_code})
        if referrer:
            referrer_id = referrer['id']
    
    # Create new retailer
    retailer = User(
        phone=request.phone,
        name=request.name,
        email=request.email,
        role="retailer",
        parent_id=current_user['id'],
        referred_by=request.referral_code,
        commission_rates=current_user.get('commission_rates', {
            "recharge": 2.0,
            "bill": 1.5,
            "aeps": 0.5,
            "dmt": 0.5
        })
    )
    
    await db.users.insert_one(retailer.dict())
    
    # Create referral record if applicable
    if referrer_id:
        referral = Referral(
            referrer_id=referrer_id,
            referred_id=retailer.id,
            referral_code=request.referral_code,
            reward_amount=50.0  # ₹50 referral bonus
        )
        await db.referrals.insert_one(referral.dict())
    
    return {
        "success": True,
        "message": "Retailer created successfully",
        "retailer": retailer.dict(),
        "referral_bonus": 50.0 if referrer_id else 0
    }

@api_router.get("/retailer/list")
async def list_retailers(
    limit: int = 50,
    skip: int = 0,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get list of retailers under distributor"""
    if current_user['role'] not in ['distributor', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = {"parent_id": current_user['id']} if current_user['role'] == 'distributor' else {"role": "retailer"}
    
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}}
        ]
    
    retailers = await db.users.find(query).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    # Get transaction stats for each retailer
    for retailer in retailers:
        pipeline = [
            {"$match": {"user_id": retailer['id'], "status": "success"}},
            {"$group": {
                "_id": None,
                "total_transactions": {"$sum": 1},
                "total_amount": {"$sum": "$amount"},
                "total_commission": {"$sum": "$commission"}
            }}
        ]
        stats = await db.transactions.aggregate(pipeline).to_list(1)
        retailer['stats'] = stats[0] if stats else {
            "total_transactions": 0,
            "total_amount": 0,
            "total_commission": 0
        }
    
    return {
        "retailers": [User(**r).dict() for r in retailers],
        "total": total,
        "limit": limit,
        "skip": skip
    }

@api_router.get("/retailer/{retailer_id}")
async def get_retailer(retailer_id: str, current_user: dict = Depends(get_current_user)):
    """Get retailer details"""
    if current_user['role'] not in ['distributor', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    retailer = await db.users.find_one({"id": retailer_id})
    if not retailer:
        raise HTTPException(status_code=404, detail="Retailer not found")
    
    if current_user['role'] == 'distributor' and retailer.get('parent_id') != current_user['id']:
        raise HTTPException(status_code=403, detail="Not your retailer")
    
    # Get transaction stats
    pipeline = [
        {"$match": {"user_id": retailer_id, "status": "success"}},
        {"$group": {
            "_id": "$type",
            "count": {"$sum": 1},
            "total_amount": {"$sum": "$amount"},
            "total_commission": {"$sum": "$commission"}
        }}
    ]
    stats_by_type = await db.transactions.aggregate(pipeline).to_list(10)
    
    return {
        "retailer": User(**retailer).dict(),
        "stats_by_type": stats_by_type
    }

@api_router.put("/retailer/{retailer_id}")
async def update_retailer(
    retailer_id: str,
    request: UpdateRetailerRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update retailer details"""
    if current_user['role'] not in ['distributor', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    retailer = await db.users.find_one({"id": retailer_id})
    if not retailer:
        raise HTTPException(status_code=404, detail="Retailer not found")
    
    if current_user['role'] == 'distributor' and retailer.get('parent_id') != current_user['id']:
        raise HTTPException(status_code=403, detail="Not your retailer")
    
    update_data = {"updated_at": datetime.utcnow()}
    if request.name:
        update_data["name"] = request.name
    if request.email:
        update_data["email"] = request.email
    if request.commission_rates:
        update_data["commission_rates"] = request.commission_rates
    if request.is_active is not None:
        update_data["is_active"] = request.is_active
    
    await db.users.update_one({"id": retailer_id}, {"$set": update_data})
    
    return {"success": True, "message": "Retailer updated successfully"}

@api_router.post("/retailer/{retailer_id}/wallet")
async def update_retailer_wallet(
    retailer_id: str,
    request: UpdateWalletRequest,
    current_user: dict = Depends(get_current_user)
):
    """Add or deduct balance from retailer wallet (Distributor only)"""
    if current_user['role'] not in ['distributor', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    retailer = await db.users.find_one({"id": retailer_id})
    if not retailer:
        raise HTTPException(status_code=404, detail="Retailer not found")
    
    if current_user['role'] == 'distributor' and retailer.get('parent_id') != current_user['id']:
        raise HTTPException(status_code=403, detail="Not your retailer")
    
    if request.action == "add":
        new_balance = retailer['wallet_balance'] + request.amount
    elif request.action == "deduct":
        if retailer['wallet_balance'] < request.amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        new_balance = retailer['wallet_balance'] - request.amount
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'add' or 'deduct'")
    
    await db.users.update_one(
        {"id": retailer_id},
        {"$set": {"wallet_balance": new_balance, "updated_at": datetime.utcnow()}}
    )
    
    # Create transaction record
    transaction = Transaction(
        user_id=retailer_id,
        type="wallet",
        service=f"wallet_{request.action}",
        amount=request.amount,
        status="success",
        details={
            "action": request.action,
            "by_distributor": current_user['id'],
            "previous_balance": retailer['wallet_balance'],
            "new_balance": new_balance
        }
    )
    await db.transactions.insert_one(transaction.dict())
    
    return {
        "success": True,
        "message": f"₹{request.amount} {request.action}ed successfully",
        "new_balance": new_balance
    }

@api_router.get("/distributor/stats")
async def get_distributor_stats(current_user: dict = Depends(get_current_user)):
    """Get distributor dashboard stats"""
    if current_user['role'] not in ['distributor', 'admin']:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get total retailers count
    retailers_count = await db.users.count_documents({"parent_id": current_user['id']})
    
    # Get active retailers count
    active_retailers = await db.users.count_documents({"parent_id": current_user['id'], "is_active": True})
    
    # Get all retailers' transactions
    retailers = await db.users.find({"parent_id": current_user['id']}).to_list(1000)
    retailer_ids = [r['id'] for r in retailers]
    
    # Total team transactions
    total_transactions = await db.transactions.count_documents({
        "user_id": {"$in": retailer_ids},
        "status": "success"
    })
    
    # Total team revenue
    pipeline = [
        {"$match": {"user_id": {"$in": retailer_ids}, "status": "success"}},
        {"$group": {
            "_id": None,
            "total_revenue": {"$sum": "$amount"},
            "total_commission": {"$sum": "$commission"}
        }}
    ]
    revenue_stats = await db.transactions.aggregate(pipeline).to_list(1)
    revenue_data = revenue_stats[0] if revenue_stats else {"total_revenue": 0, "total_commission": 0}
    
    # Today's stats
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_transactions = await db.transactions.count_documents({
        "user_id": {"$in": retailer_ids},
        "status": "success",
        "created_at": {"$gte": today_start}
    })
    
    pipeline_today = [
        {"$match": {
            "user_id": {"$in": retailer_ids},
            "status": "success",
            "created_at": {"$gte": today_start}
        }},
        {"$group": {
            "_id": None,
            "today_revenue": {"$sum": "$amount"},
            "today_commission": {"$sum": "$commission"}
        }}
    ]
    today_stats = await db.transactions.aggregate(pipeline_today).to_list(1)
    today_data = today_stats[0] if today_stats else {"today_revenue": 0, "today_commission": 0}
    
    # Top 5 performers
    pipeline_top = [
        {"$match": {"user_id": {"$in": retailer_ids}, "status": "success"}},
        {"$group": {
            "_id": "$user_id",
            "total_transactions": {"$sum": 1},
            "total_amount": {"$sum": "$amount"}
        }},
        {"$sort": {"total_amount": -1}},
        {"$limit": 5}
    ]
    top_performers_data = await db.transactions.aggregate(pipeline_top).to_list(5)
    
    # Enrich with user details
    top_performers = []
    for perf in top_performers_data:
        user = await db.users.find_one({"id": perf['_id']})
        if user:
            top_performers.append({
                "name": user['name'],
                "phone": user['phone'],
                "transactions": perf['total_transactions'],
                "revenue": perf['total_amount']
            })
    
    return {
        "total_retailers": retailers_count,
        "active_retailers": active_retailers,
        "total_transactions": total_transactions,
        "total_revenue": round(revenue_data['total_revenue'], 2),
        "total_commission": round(revenue_data['total_commission'], 2),
        "today": {
            "transactions": today_transactions,
            "revenue": round(today_data['today_revenue'], 2),
            "commission": round(today_data['today_commission'], 2)
        },
        "top_performers": top_performers
    }

@api_router.get("/reports/sales")
async def get_sales_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    retailer_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed sales report with filters"""
    query = {"status": "success"}
    
    if current_user['role'] == 'retailer':
        query["user_id"] = current_user['id']
    elif current_user['role'] == 'distributor':
        retailers = await db.users.find({"parent_id": current_user['id']}).to_list(1000)
        retailer_ids = [r['id'] for r in retailers]
        if retailer_id:
            if retailer_id not in retailer_ids:
                raise HTTPException(status_code=403, detail="Not your retailer")
            query["user_id"] = retailer_id
        else:
            query["user_id"] = {"$in": retailer_ids}
    
    if start_date:
        start_dt = datetime.fromisoformat(start_date)
        query["created_at"] = {"$gte": start_dt}
    
    if end_date:
        end_dt = datetime.fromisoformat(end_date)
        query.setdefault("created_at", {})["$lte"] = end_dt
    
    # Service-wise breakdown
    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": "$type",
            "count": {"$sum": 1},
            "total_amount": {"$sum": "$amount"},
            "total_commission": {"$sum": "$commission"}
        }}
    ]
    service_breakdown = await db.transactions.aggregate(pipeline).to_list(10)
    
    # Date-wise breakdown (last 7 days)
    date_pipeline = [
        {"$match": query},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "count": {"$sum": 1},
            "amount": {"$sum": "$amount"}
        }},
        {"$sort": {"_id": -1}},
        {"$limit": 7}
    ]
    date_breakdown = await db.transactions.aggregate(date_pipeline).to_list(7)
    
    # Overall totals
    total_count = await db.transactions.count_documents(query)
    pipeline_total = [
        {"$match": query},
        {"$group": {
            "_id": None,
            "total_amount": {"$sum": "$amount"},
            "total_commission": {"$sum": "$commission"}
        }}
    ]
    totals = await db.transactions.aggregate(pipeline_total).to_list(1)
    total_data = totals[0] if totals else {"total_amount": 0, "total_commission": 0}
    
    return {
        "summary": {
            "total_transactions": total_count,
            "total_amount": round(total_data['total_amount'], 2),
            "total_commission": round(total_data['total_commission'], 2)
        },
        "by_service": service_breakdown,
        "by_date": date_breakdown
    }

@api_router.get("/referral/info")
async def get_referral_info(current_user: dict = Depends(get_current_user)):
    """Get user's referral code and referral stats"""
    # Count referred users
    referred_count = await db.users.count_documents({"referred_by": current_user['referral_code']})
    
    # Get referral earnings
    referrals = await db.referrals.find({"referrer_id": current_user['id']}).to_list(100)
    total_earnings = sum(r.get('reward_amount', 0) for r in referrals if r.get('reward_credited'))
    pending_earnings = sum(r.get('reward_amount', 0) for r in referrals if not r.get('reward_credited'))
    
    # Get referred users list
    referred_users = await db.users.find(
        {"referred_by": current_user['referral_code']},
        {"name": 1, "phone": 1, "created_at": 1}
    ).to_list(50)
    
    return {
        "referral_code": current_user['referral_code'],
        "total_referrals": referred_count,
        "total_earnings": round(total_earnings, 2),
        "pending_earnings": round(pending_earnings, 2),
        "referred_users": referred_users
    }

@api_router.post("/referral/claim")
async def claim_referral_rewards(current_user: dict = Depends(get_current_user)):
    """Claim pending referral rewards"""
    # Get unclaimed referrals
    referrals = await db.referrals.find({
        "referrer_id": current_user['id'],
        "reward_credited": False
    }).to_list(100)
    
    if not referrals:
        return {"success": True, "message": "No pending rewards", "amount": 0}
    
    total_reward = sum(r.get('reward_amount', 0) for r in referrals)
    
    # Update wallet
    new_balance = current_user['wallet_balance'] + total_reward
    await db.users.update_one(
        {"id": current_user['id']},
        {"$set": {"wallet_balance": new_balance, "updated_at": datetime.utcnow()}}
    )
    
    # Mark referrals as credited
    referral_ids = [r['id'] for r in referrals]
    await db.referrals.update_many(
        {"id": {"$in": referral_ids}},
        {"$set": {"reward_credited": True}}
    )
    
    # Create transaction record
    transaction = Transaction(
        user_id=current_user['id'],
        type="wallet",
        service="referral_bonus",
        amount=total_reward,
        status="success",
        details={"referrals": len(referrals), "bonus_per_referral": 50.0}
    )
    await db.transactions.insert_one(transaction.dict())
    
    return {
        "success": True,
        "message": "Referral rewards credited successfully",
        "amount": round(total_reward, 2),
        "new_balance": round(new_balance, 2)
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
