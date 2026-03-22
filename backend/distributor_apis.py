"""
Super Distribution APIs for DIGIR HUB
Retailer Management, Team Performance, Reports, Referrals
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import uuid

# This will be imported in server.py
distributor_router = APIRouter(prefix="/api/distributor")

# ============= Request Models =============

class CreateRetailerRequest(BaseModel):
    phone: str
    name: str
    email: Optional[str] = None
    commission_rates: Optional[dict] = None

class UpdateRetailerRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    commission_rates: Optional[dict] = None
    is_active: Optional[bool] = None

class UpdateWalletRequest(BaseModel):
    retailer_id: str
    amount: float
    action: str  # add or deduct

class VerifyReferralRequest(BaseModel):
    referral_code: str

# ============= Endpoints =============
# Note: These will use get_current_user dependency from server.py
# Implementation will be completed in server.py
