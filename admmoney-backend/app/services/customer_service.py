from datetime import datetime
from typing import List, Dict, Any, Optional
from ..core.database import get_db, get_next_sequence
from ..models.schemas import CustomerCreate

class CustomerService:
    @staticmethod
    def get_customers() -> List[Dict[str, Any]]:
        db = get_db()

        # Auto-sync past customers from orders and sales if not already in customers collection
        try:
            existing_customers = list(db.customers.find({}, {"_id": 0}))
            existing_names = {c["name"].strip().lower() for c in existing_customers if c.get("name")}

            orders = list(db.orders.find({}, {"_id": 0}))
            for ord_doc in orders:
                c_name = (ord_doc.get("customer_name") or "").strip()
                if c_name and c_name.lower() not in existing_names:
                    new_id = get_next_sequence("customers")
                    doc = {
                        "id": new_id,
                        "name": c_name,
                        "phone": ord_doc.get("customer_phone") or "",
                        "notes": "",
                        "total_orders": 1,
                        "last_order_date": ord_doc.get("delivery_date"),
                        "created_at": ord_doc.get("created_at") or datetime.utcnow().isoformat()
                    }
                    db.customers.insert_one(doc)
                    existing_names.add(c_name.lower())

            # Also check sales
            sales = list(db.cookie_sales.find({}, {"_id": 0}))
            for sale in sales:
                c_name = (sale.get("customer_name") or "").strip()
                if c_name and c_name.lower() != "cliente mostrador" and c_name.lower() not in existing_names:
                    new_id = get_next_sequence("customers")
                    doc = {
                        "id": new_id,
                        "name": c_name,
                        "phone": "",
                        "notes": "",
                        "total_orders": 1,
                        "last_order_date": sale.get("sale_date"),
                        "created_at": sale.get("created_at") or datetime.utcnow().isoformat()
                    }
                    db.customers.insert_one(doc)
                    existing_names.add(c_name.lower())
        except Exception as e:
            print("Warning syncing customers:", e)

        # Retrieve all customers and enrich stats
        customers = list(db.customers.find({}, {"_id": 0}).sort("name", 1))
        for c in customers:
            # Count actual orders
            order_count = db.orders.count_documents({"customer_name": {"$regex": f"^{c['name']}$", "$options": "i"}})
            c["total_orders"] = max(order_count, c.get("total_orders", 0))
            if "phone" not in c:
                c["phone"] = ""
            if "notes" not in c:
                c["notes"] = ""
            if "created_at" not in c:
                c["created_at"] = datetime.utcnow().isoformat()
        return customers

    @staticmethod
    def create_customer(data: CustomerCreate) -> Dict[str, Any]:
        db = get_db()
        name_clean = data.name.strip()
        existing = db.customers.find_one({"name": {"$regex": f"^{name_clean}$", "$options": "i"}}, {"_id": 0})
        if existing:
            # Update phone if provided
            update_data = {}
            if data.phone and data.phone.strip():
                update_data["phone"] = data.phone.strip()
            if data.notes:
                update_data["notes"] = data.notes.strip()
            if update_data:
                db.customers.update_one({"id": existing["id"]}, {"$set": update_data})
                existing.update(update_data)
            return existing

        new_id = get_next_sequence("customers")
        now_str = datetime.utcnow().isoformat()
        doc = {
            "id": new_id,
            "name": name_clean,
            "phone": data.phone.strip() if data.phone else "",
            "notes": data.notes.strip() if data.notes else "",
            "total_orders": 0,
            "last_order_date": None,
            "created_at": now_str
        }
        db.customers.insert_one(doc)
        doc.pop("_id", None)
        return doc

    @staticmethod
    def delete_customer(customer_id: int) -> bool:
        db = get_db()
        res = db.customers.delete_one({"id": customer_id})
        return res.deleted_count > 0
