import urllib.parse
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from ..core.database import get_db, get_next_sequence
from ..models.schemas import OrderCreate, OrderUpdate
from .ticket_token_service import generate_ticket_token, ensure_ticket_token

DAY_NAMES_ES = {
    0: "Lunes",
    1: "Martes",
    2: "Miércoles",
    3: "Jueves",
    4: "Viernes",
    5: "Sábado",
    6: "Domingo"
}

class OrderService:
    @staticmethod
    def get_orders(
        status: Optional[str] = None,
        delivery_date: Optional[str] = None,
        customer_name: Optional[str] = None,
        payment_status: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        db = get_db()
        query: Dict[str, Any] = {}

        if status:
            query["status"] = status
        if delivery_date:
            query["delivery_date"] = delivery_date
        if payment_status:
            query["payment_status"] = payment_status
        if customer_name:
            query["customer_name"] = {"$regex": customer_name, "$options": "i"}

        cursor = db.orders.find(query, {"_id": 0}).sort([("delivery_date", 1), ("id", -1)])
        orders = list(cursor)
        for o in orders:
            ensure_ticket_token(o, "orders")
        return orders

    @staticmethod
    def get_by_id(order_id: int) -> Optional[Dict[str, Any]]:
        db = get_db()
        order = db.orders.find_one({"id": order_id}, {"_id": 0})
        if order:
            ensure_ticket_token(order, "orders")
        return order

    @staticmethod
    def create_order(data: OrderCreate) -> Dict[str, Any]:
        db = get_db()
        new_id = get_next_sequence("orders")
        now_str = datetime.utcnow().isoformat()
        today_str = date.today().isoformat()

        items_list = [it.model_dump() if hasattr(it, "model_dump") else dict(it) for it in data.items]
        total_amount = round(sum(float(it.get("subtotal", 0.0)) for it in items_list), 2)
        total_cost = round(sum(float(it.get("unit_cost", 0.0)) * int(it.get("quantity", 1)) for it in items_list), 2)
        net_profit = round(total_amount - total_cost, 2)

        # Generar mensaje de WhatsApp preformateado (1 solo clic)
        items_summary = ", ".join(f"{it['quantity']}x {it['product_name']}" for it in items_list)
        whatsapp_message = (
            f"Hola {data.customer_name}, tu pedido para el {data.delivery_date} es: "
            f"{items_summary} - Total: ${total_amount} MXN. ¡Muchas gracias por tu preferencia!"
        )
        clean_phone = "".join(c for c in (data.customer_phone or "") if c.isdigit())
        whatsapp_url = f"https://wa.me/{clean_phone}?text={urllib.parse.quote(whatsapp_message)}" if clean_phone else ""

        doc = {
            "id": new_id,
            "customer_name": data.customer_name,
            "customer_phone": data.customer_phone or "",
            "delivery_date": data.delivery_date,
            "order_date": today_str,
            "status": "Pendiente",
            "payment_method": data.payment_method or "Efectivo",
            "payment_status": data.payment_status or "Pendiente",
            "deposit_amount": float(data.deposit_amount or 0.0),
            "items": items_list,
            "total_amount": total_amount,
            "total_cost": total_cost,
            "net_profit": net_profit,
            "notes": data.notes or "",
            "whatsapp_message": whatsapp_message,
            "whatsapp_url": whatsapp_url,
            "stock_deducted": False,
            "ticket_token": generate_ticket_token(),
            "created_at": now_str
        }

        db.orders.insert_one(doc)

        # Si se crea como Pagado, sumar automáticamente a ventas cobradas
        if doc.get("payment_status") == "Pagado":
            OrderService._register_sales_for_order(doc)

        # Auto-guardar cliente en el directorio si tiene nombre
        if data.customer_name and data.customer_name.strip():
            try:
                from .customer_service import CustomerService
                from ..models.schemas import CustomerCreate
                CustomerService.create_customer(CustomerCreate(
                    name=data.customer_name.strip(),
                    phone=data.customer_phone or ""
                ))
            except Exception:
                pass

        doc.pop("_id", None)
        return doc

    @staticmethod
    def _register_sales_for_order(order_dict: Dict[str, Any]):
        db = get_db()
        order_id = order_dict["id"]
        # Evitar duplicados si ya existen ventas de este pedido
        if db.cookie_sales.find_one({"order_id": order_id}):
            return

        cust_name = order_dict.get("customer_name") or "Cliente"
        deliv_date = order_dict.get("delivery_date") or date.today().isoformat()
        pay_method = order_dict.get("payment_method") or "Efectivo"
        promo_id = order_dict.get("promotion_id")
        promo_name = order_dict.get("promotion_name")
        discount = order_dict.get("discount_amount", 0.0)

        for it in order_dict.get("items", []):
            cookie_id = it.get("product_id")
            cookie = db.cookie_products.find_one({"id": cookie_id})
            cookie_name = cookie["name"] if cookie else it.get("product_name", "Galleta")
            recipe_cost = float(cookie["recipe_cost"]) if cookie else float(it.get("unit_cost", 0.0))
            sale_id = get_next_sequence("cookie_sales")
            qty = int(it.get("quantity", 1))
            unit_p = float(it.get("unit_price", 35.0))
            tot_rev = round(unit_p * qty, 2)
            tot_c = round(recipe_cost * qty, 2)
            db.cookie_sales.insert_one({
                "id": sale_id,
                "order_id": order_id,
                "cookie_id": cookie_id,
                "cookie_name": cookie_name,
                "quantity": qty,
                "unit_price": unit_p,
                "unit_cost": recipe_cost,
                "total_revenue": tot_rev,
                "total_cost": tot_c,
                "net_profit": round(tot_rev - tot_c, 2),
                "sale_date": deliv_date,
                "customer_name": cust_name,
                "payment_method": pay_method,
                "notes": f"Pedido #{order_id} • {cust_name}{f' ({promo_name})' if promo_name else ''}",
                "promotion_id": promo_id,
                "promotion_name": promo_name,
                "discount_amount": discount,
                "created_at": datetime.utcnow().isoformat()
            })

    @staticmethod
    def _remove_sales_for_order(order_id: int):
        db = get_db()
        db.cookie_sales.delete_many({"order_id": order_id})

    @staticmethod
    def update_order(order_id: int, data: OrderUpdate) -> Optional[Dict[str, Any]]:
        db = get_db()
        existing = db.orders.find_one({"id": order_id})
        if not existing:
            return None

        update_dict: Dict[str, Any] = {}
        dumped = data.model_dump(exclude_unset=True)

        if "items" in dumped and dumped["items"] is not None:
            items_list = [it.model_dump() if hasattr(it, "model_dump") else dict(it) for it in dumped["items"]]
            total_amount = round(sum(float(it.get("subtotal", 0.0)) for it in items_list), 2)
            total_cost = round(sum(float(it.get("unit_cost", 0.0)) * int(it.get("quantity", 1)) for it in items_list), 2)
            update_dict["items"] = items_list
            update_dict["total_amount"] = total_amount
            update_dict["total_cost"] = total_cost
            update_dict["net_profit"] = round(total_amount - total_cost, 2)

        for k, v in dumped.items():
            if k != "items" and v is not None:
                update_dict[k] = v

        # Actualizar mensaje de WhatsApp si cambió cliente, fecha o items
        cust_name = update_dict.get("customer_name", existing["customer_name"])
        deliv_date = update_dict.get("delivery_date", existing["delivery_date"])
        phone = update_dict.get("customer_phone", existing.get("customer_phone", ""))
        items_curr = update_dict.get("items", existing.get("items", []))
        tot_curr = update_dict.get("total_amount", existing.get("total_amount", 0.0))

        items_summary = ", ".join(f"{it['quantity']}x {it['product_name']}" for it in items_curr)
        whatsapp_message = (
            f"Hola {cust_name}, tu pedido para el {deliv_date} es: "
            f"{items_summary} - Total: ${tot_curr} MXN. ¡Muchas gracias por tu preferencia!"
        )
        clean_phone = "".join(c for c in phone if c.isdigit())
        update_dict["whatsapp_message"] = whatsapp_message
        update_dict["whatsapp_url"] = f"https://wa.me/{clean_phone}?text={urllib.parse.quote(whatsapp_message)}" if clean_phone else ""

        # Manejo de cambio de estado de pago (Pagado <-> Pendiente / Anticipo)
        new_payment_status = update_dict.get("payment_status")
        old_payment_status = existing.get("payment_status", "Pendiente")

        if new_payment_status == "Pagado" and old_payment_status != "Pagado":
            merged = {**existing, **update_dict}
            OrderService._register_sales_for_order(merged)
        elif new_payment_status in ["Pendiente", "Anticipo"] and old_payment_status == "Pagado":
            OrderService._remove_sales_for_order(order_id)

        # Manejo de cambio de estado y deducción automática de stock
        new_status = update_dict.get("status")
        was_deducted = existing.get("stock_deducted", False)

        if new_status == "Completado" and not was_deducted:
            OrderService._deduct_stock_for_order(existing)
            update_dict["stock_deducted"] = True
        elif new_status in ["Cancelado", "Pendiente"] and was_deducted:
            OrderService._restore_stock_for_order(existing)
            update_dict["stock_deducted"] = False

        if update_dict:
            db.orders.update_one({"id": order_id}, {"$set": update_dict})

        return db.orders.find_one({"id": order_id}, {"_id": 0})

    @staticmethod
    def update_order_status(order_id: int, new_status: str) -> Optional[Dict[str, Any]]:
        db = get_db()
        existing = db.orders.find_one({"id": order_id})
        if not existing:
            return None

        update_dict: Dict[str, Any] = {"status": new_status}
        was_deducted = existing.get("stock_deducted", False)

        if new_status == "Completado" and not was_deducted:
            OrderService._deduct_stock_for_order(existing)
            update_dict["stock_deducted"] = True
        elif new_status in ["Cancelado", "Pendiente"] and was_deducted:
            OrderService._restore_stock_for_order(existing)
            update_dict["stock_deducted"] = False

        db.orders.update_one({"id": order_id}, {"$set": update_dict})
        return db.orders.find_one({"id": order_id}, {"_id": 0})

    @staticmethod
    def delete_order(order_id: int) -> bool:
        db = get_db()
        existing = db.orders.find_one({"id": order_id})
        if not existing:
            return False

        if existing.get("stock_deducted", False):
            OrderService._restore_stock_for_order(existing)

        # Eliminar ventas vinculadas si las hubiera
        OrderService._remove_sales_for_order(order_id)
        res = db.orders.delete_one({"id": order_id})
        return res.deleted_count > 0

    @staticmethod
    def _deduct_stock_for_order(order: Dict[str, Any]):
        """
        Deduce automáticamente del inventario los gramos y empaques consumidos según la receta.
        """
        db = get_db()
        items = order.get("items", [])
        for it in items:
            p_id = it.get("product_id")
            qty = it.get("quantity", 0)
            product = db.cookie_products.find_one({"id": p_id})
            if not product:
                continue

            batch_yield = max(product.get("batch_yield", 16), 1)
            ingredients = product.get("ingredients", [])

            for ing in ingredients:
                ing_name = ing.get("name")
                required_total = (float(ing.get("quantity", 0.0)) / batch_yield) * qty

                # Descontar del ingrediente correspondiente
                db.cookie_ingredients.update_one(
                    {"name": {"$regex": f"^{ing_name}", "$options": "i"}},
                    {"$inc": {"stock_quantity": -round(required_total, 2)}}
                )

    @staticmethod
    def _restore_stock_for_order(order: Dict[str, Any]):
        """
        Restaura el stock si un pedido completado se cancela o regresa a pendiente.
        """
        db = get_db()
        items = order.get("items", [])
        for it in items:
            p_id = it.get("product_id")
            qty = it.get("quantity", 0)
            product = db.cookie_products.find_one({"id": p_id})
            if not product:
                continue

            batch_yield = max(product.get("batch_yield", 16), 1)
            ingredients = product.get("ingredients", [])

            for ing in ingredients:
                ing_name = ing.get("name")
                required_total = (float(ing.get("quantity", 0.0)) / batch_yield) * qty

                db.cookie_ingredients.update_one(
                    {"name": {"$regex": f"^{ing_name}", "$options": "i"}},
                    {"$inc": {"stock_quantity": round(required_total, 2)}}
                )

    @staticmethod
    def get_baking_sheet(
        from_date: Optional[str] = None,
        to_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Consolidado Automático de Horneado:
        Genera la matriz por Día x Variedad y el total consolidado de insumos requeridos.
        """
        db = get_db()

        # Filtrar pedidos activos
        match_query: Dict[str, Any] = {
            "status": {"$in": ["Pendiente", "En Preparación", "Listo"]}
        }
        if from_date and to_date:
            match_query["delivery_date"] = {"$gte": from_date, "$lte": to_date}
        elif from_date:
            match_query["delivery_date"] = {"$gte": from_date}

        orders = list(db.orders.find(match_query, {"_id": 0}))

        # Obtener todos los productos activos para definir las columnas
        all_products = list(db.cookie_products.find({"is_active": True}, {"_id": 0}).sort("id", 1))
        product_names = [p["name"] for p in all_products]

        # Agrupar por delivery_date
        by_day: Dict[str, Dict[str, int]] = {}
        grand_totals_by_prod: Dict[str, int] = {p_name: 0 for p_name in product_names}
        total_all_units = 0

        # Para cálculo consolidado de insumos requeridos
        raw_materials_needed: Dict[str, Dict[str, Any]] = {}

        for ord_doc in orders:
            d_date = ord_doc.get("delivery_date", date.today().isoformat())
            if d_date not in by_day:
                by_day[d_date] = {p_name: 0 for p_name in product_names}

            for item in ord_doc.get("items", []):
                p_name = item.get("product_name")
                qty = int(item.get("quantity", 0))

                if p_name not in by_day[d_date]:
                    by_day[d_date][p_name] = 0
                by_day[d_date][p_name] += qty

                if p_name not in grand_totals_by_prod:
                    grand_totals_by_prod[p_name] = 0
                grand_totals_by_prod[p_name] += qty
                total_all_units += qty

                # Acumular insumos requeridos
                p_id = item.get("product_id")
                prod_data = next((p for p in all_products if p["id"] == p_id or p["name"] == p_name), None)
                if prod_data:
                    b_yield = max(prod_data.get("batch_yield", 16), 1)
                    waste_mult = 1.0 + (prod_data.get("waste_pct", 2.0) / 100.0)
                    for ing in prod_data.get("ingredients", []):
                        i_name = ing.get("name")
                        req_qty = ((float(ing.get("quantity", 0.0)) / b_yield) * qty) * waste_mult
                        i_unit = ing.get("unit", "g")
                        if i_name not in raw_materials_needed:
                            raw_materials_needed[i_name] = {
                                "ingredient_name": i_name,
                                "total_required": 0.0,
                                "unit": i_unit
                            }
                        raw_materials_needed[i_name]["total_required"] += req_qty

        # Formatear filas de días
        days_rows = []
        for d_str in sorted(by_day.keys()):
            try:
                dt_obj = datetime.strptime(d_str, "%Y-%m-%d").date()
                day_name = DAY_NAMES_ES.get(dt_obj.weekday(), "")
            except Exception:
                day_name = ""

            quantities = by_day[d_str]
            total_day = sum(quantities.values())

            days_rows.append({
                "delivery_date": d_str,
                "day_name": day_name,
                "quantities_by_product": quantities,
                "total_day_units": total_day
            })

        # Cotejar insumos con stock actual
        all_ingredients = list(db.cookie_ingredients.find({}, {"_id": 0}))
        consolidated_ingredients = []

        for ing_name, req_info in raw_materials_needed.items():
            stock_doc = next(
                (i for i in all_ingredients if i["name"].lower() in ing_name.lower() or ing_name.lower() in i["name"].lower()),
                None
            )
            avail = float(stock_doc.get("stock_quantity", 0.0)) if stock_doc else 0.0
            tot_req = round(req_info["total_required"], 2)

            consolidated_ingredients.append({
                "ingredient_name": ing_name,
                "total_required": tot_req,
                "unit": req_info["unit"],
                "current_stock": avail,
                "is_sufficient": avail >= tot_req
            })

        return {
            "days": days_rows,
            "product_columns": product_names,
            "grand_totals_by_product": grand_totals_by_prod,
            "total_all_units": total_all_units,
            "consolidated_ingredients": consolidated_ingredients
        }
