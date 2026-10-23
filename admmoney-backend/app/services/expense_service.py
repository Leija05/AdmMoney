import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from ..core.database import get_db, get_next_sequence
from ..models.schemas import ExpenseCreate, ExpenseUpdate

class ExpenseService:
    @staticmethod
    def get_all(
        category: Optional[str] = None,
        search: Optional[str] = None,
        month: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        db = get_db()
        filter_query: Dict[str, Any] = {}

        if category:
            filter_query["category"] = category

        if search:
            escaped = re.escape(search)
            filter_query["$or"] = [
                {"title": {"$regex": escaped, "$options": "i"}},
                {"notes": {"$regex": escaped, "$options": "i"}}
            ]

        if month:
            filter_query["date"] = {"$regex": f"^{re.escape(month)}"}

        cursor = db.expenses.find(filter_query, {"_id": 0}).sort([("date", -1), ("id", -1)])
        results = []
        for d in cursor:
            if not isinstance(d.get("receipt_data"), dict):
                d["receipt_data"] = {}
            results.append(d)
        return results

    @staticmethod
    def get_by_id(expense_id: int) -> Optional[Dict[str, Any]]:
        db = get_db()
        doc = db.expenses.find_one({"id": expense_id}, {"_id": 0})
        if not doc:
            return None
        if not isinstance(doc.get("receipt_data"), dict):
            doc["receipt_data"] = {}
        return doc

    @staticmethod
    def create(data: ExpenseCreate) -> Dict[str, Any]:
        db = get_db()
        new_id = get_next_sequence("expenses")
        now_str = datetime.utcnow().isoformat()

        doc = {
            "id": new_id,
            "title": data.title,
            "amount": float(data.amount),
            "category": data.category,
            "date": data.date,
            "payment_method": data.payment_method or "Efectivo",
            "notes": data.notes or "",
            "receipt_url": data.receipt_url or "",
            "receipt_data": data.receipt_data if isinstance(data.receipt_data, dict) else {},
            "created_at": now_str
        }

        db.expenses.insert_one(doc)
        doc.pop("_id", None)
        return doc

    @staticmethod
    def update(expense_id: int, data: ExpenseUpdate) -> Optional[Dict[str, Any]]:
        db = get_db()
        existing = db.expenses.find_one({"id": expense_id})
        if not existing:
            return None

        update_fields: Dict[str, Any] = {}
        dumped = data.model_dump(exclude_unset=True)
        for k, v in dumped.items():
            if v is not None:
                update_fields[k] = v

        if update_fields:
            db.expenses.update_one({"id": expense_id}, {"$set": update_fields})

        return ExpenseService.get_by_id(expense_id)

    @staticmethod
    def delete(expense_id: int) -> bool:
        db = get_db()
        result = db.expenses.delete_one({"id": expense_id})
        return result.deleted_count > 0

    @staticmethod
    def get_summary() -> Dict[str, Any]:
        db = get_db()

        # 1. Total expenses
        pipeline_total = [
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]
        total_res = list(db.expenses.aggregate(pipeline_total))
        total_amount = float(total_res[0]["total"]) if total_res else 0.0

        # 2. Total by category
        pipeline_cat = [
            {
                "$group": {
                    "_id": "$category",
                    "total": {"$sum": "$amount"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"total": -1}},
            {
                "$project": {
                    "_id": 0,
                    "category": "$_id",
                    "total": {"$round": ["$total", 2]},
                    "count": "$count"
                }
            }
        ]
        categories = list(db.expenses.aggregate(pipeline_cat))

        # 3. Monthly trend (extract YYYY-MM from date string)
        pipeline_month = [
            {
                "$group": {
                    "_id": {"$substrCP": ["$date", 0, 7]},
                    "total": {"$sum": "$amount"}
                }
            },
            {"$sort": {"_id": -1}},
            {"$limit": 6},
            {
                "$project": {
                    "_id": 0,
                    "month": "$_id",
                    "total": {"$round": ["$total", 2]}
                }
            }
        ]
        monthly = list(db.expenses.aggregate(pipeline_month))

        return {
            "total_expenses": round(total_amount, 2),
            "by_category": categories,
            "monthly_trend": monthly
        }
