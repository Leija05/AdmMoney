import math
from datetime import datetime, date
from typing import List, Dict, Any, Optional
from ..core.database import get_db, get_next_sequence
from ..models.schemas import (
    IngredientCreate, IngredientUpdate, IngredientPurchaseCreate,
    CookieProductCreate, CookieProductUpdate,
    CookieSaleCreate
)
from .ticket_token_service import generate_ticket_token, ensure_ticket_token

class CookieService:
    # ------------------ INGREDIENTES / INSUMOS & SMART INVENTORY ------------------ #
    @staticmethod
    def get_ingredients(ing_type: Optional[str] = None) -> List[Dict[str, Any]]:
        db = get_db()
        query: Dict[str, Any] = {}
        if ing_type:
            query["type"] = ing_type

        rows = list(db.cookie_ingredients.find(query, {"_id": 0}).sort("name", 1))
        for r in rows:
            stock = float(r.get("stock_quantity", 0.0))
            min_alert = float(r.get("min_stock_alert", 5.0))
            if stock <= 0:
                r["stock_status"] = "critical"
            elif stock <= min_alert:
                r["stock_status"] = "low"
            else:
                r["stock_status"] = "ok"

            if "type" not in r:
                # Infer packaging if name indicates box, kraft, bag, etc.
                name_low = r.get("name", "").lower()
                if any(k in name_low for k in ["empaque", "caja", "bolsa", "etiqueta", "kraft", "celofan", "liston"]):
                    r["type"] = "packaging"
                else:
                    r["type"] = "edible"

            if "min_stock_alert" not in r:
                r["min_stock_alert"] = 10.0 if r.get("type") == "packaging" else 2.0

        return rows

    @staticmethod
    def create_ingredient(data: IngredientCreate) -> Dict[str, Any]:
        db = get_db()
        now_str = datetime.utcnow().isoformat()
        cost_per_unit = data.package_cost / data.package_quantity if data.package_quantity > 0 else 0.0

        new_id = get_next_sequence("cookie_ingredients")
        doc = {
            "id": new_id,
            "name": data.name,
            "unit": data.unit,
            "package_cost": float(data.package_cost),
            "package_quantity": float(data.package_quantity),
            "cost_per_unit": round(cost_per_unit, 2),
            "stock_quantity": round(float(data.stock_quantity or 0.0), 2),
            "supplier": data.supplier or "",
            "type": data.type or "edible",
            "min_stock_alert": float(data.min_stock_alert if data.min_stock_alert is not None else 5.0),
            "updated_at": now_str
        }

        db.cookie_ingredients.insert_one(doc)
        doc.pop("_id", None)
        return doc

    @staticmethod
    def update_ingredient(ingredient_id: int, data: IngredientUpdate) -> Optional[Dict[str, Any]]:
        db = get_db()
        existing = db.cookie_ingredients.find_one({"id": ingredient_id})
        if not existing:
            return None

        pkg_cost = data.package_cost if data.package_cost is not None else existing.get("package_cost", 0.0)
        pkg_qty = data.package_quantity if data.package_quantity is not None else existing.get("package_quantity", 1.0)
        cost_per_unit = pkg_cost / pkg_qty if pkg_qty > 0 else 0.0

        update_fields: Dict[str, Any] = {
            "updated_at": datetime.utcnow().isoformat(),
            "cost_per_unit": round(cost_per_unit, 2)
        }

        if data.name is not None:
            update_fields["name"] = data.name
        if data.unit is not None:
            update_fields["unit"] = data.unit
        if data.package_cost is not None:
            update_fields["package_cost"] = float(data.package_cost)
        if data.package_quantity is not None:
            update_fields["package_quantity"] = float(data.package_quantity)
        if data.stock_quantity is not None:
            update_fields["stock_quantity"] = float(data.stock_quantity)
        if data.supplier is not None:
            update_fields["supplier"] = data.supplier
        if data.type is not None:
            update_fields["type"] = data.type
        if data.min_stock_alert is not None:
            update_fields["min_stock_alert"] = float(data.min_stock_alert)

        db.cookie_ingredients.update_one({"id": ingredient_id}, {"$set": update_fields})
        return db.cookie_ingredients.find_one({"id": ingredient_id}, {"_id": 0})

    @staticmethod
    def record_stock_purchase(ingredient_id: int, data: IngredientPurchaseCreate) -> Optional[Dict[str, Any]]:
        """
        Entrada de Stock con Costo Promedio Ponderado (CPP):
        Recalcula automáticamente el costo unitario por gramo/unidad:
        CPP = (Stock_Anterior * Costo_Anterior + Nueva_Cantidad * Nuevo_Costo) / (Stock_Anterior + Nueva_Cantidad)
        """
        db = get_db()
        existing = db.cookie_ingredients.find_one({"id": ingredient_id})
        if not existing:
            return None

        previous_stock = max(float(existing.get("stock_quantity", 0.0)), 0.0)
        previous_cost = float(existing.get("cost_per_unit", 0.0))
        purchased_qty = float(data.quantity)
        purchased_total_cost = float(data.total_cost)

        new_total_stock = previous_stock + purchased_qty
        if new_total_stock > 0:
            new_cpp = (previous_stock * previous_cost + purchased_total_cost) / new_total_stock
        else:
            new_cpp = (purchased_total_cost / purchased_qty) if purchased_qty > 0 else 0.0

        now_str = datetime.utcnow().isoformat()
        today_str = date.today().isoformat()

        # Actualizar ingrediente
        db.cookie_ingredients.update_one(
            {"id": ingredient_id},
            {
                "$set": {
                    "stock_quantity": round(new_total_stock, 2),
                    "cost_per_unit": round(new_cpp, 2),
                    "package_cost": round(purchased_total_cost, 2),
                    "package_quantity": round(purchased_qty, 2),
                    "supplier": data.supplier or existing.get("supplier", ""),
                    "updated_at": now_str
                }
            }
        )

        # Si se solicita, registrar automáticamente el gasto en la categoría correspondiente
        if data.create_expense_record:
            from .expense_service import ExpenseService
            from ..models.schemas import ExpenseCreate
            is_pkg = existing.get("type") == "packaging"
            category = "Empaques y Envíos" if is_pkg else "Insumos Galletas"
            ExpenseService.create(ExpenseCreate(
                title=f"Compra Insumo: {existing['name']} ({purchased_qty} {existing['unit']})",
                amount=purchased_total_cost,
                category=category,
                date=today_str,
                payment_method="Transferencia",
                notes=f"Proveedor: {data.supplier or existing.get('supplier', 'N/A')}. CPP actualizado a ${round(new_cpp, 2)}/{existing['unit']}.",
                expense_type="direct"
            ))

        return db.cookie_ingredients.find_one({"id": ingredient_id}, {"_id": 0})

    @staticmethod
    def get_stock_alerts() -> List[Dict[str, Any]]:
        """
        Retorna la lista de insumos en Punto de Reorden (bajo o crítico).
        """
        all_ings = CookieService.get_ingredients()
        return [i for i in all_ings if i.get("stock_status") in ["low", "critical"]]

    @staticmethod
    def delete_ingredient(ingredient_id: int) -> bool:
        db = get_db()
        res = db.cookie_ingredients.delete_one({"id": ingredient_id})
        return res.deleted_count > 0

    # ------------------ PRODUCTOS / GALLETAS & BOM ------------------ #
    @staticmethod
    def calculate_recipe_metrics(
        ingredients: List[Any],
        sale_price: float,
        batch_yield: int = 16,
        waste_pct: float = 2.0,
        packaging_cost: float = 0.0,
        direct_ingredient_cost: Optional[float] = None,
        direct_recipe_cost: Optional[float] = None,
        is_unit_recipe: bool = True
    ) -> Dict[str, float]:
        yield_count = max(batch_yield, 1)
        packaging_cost = float(packaging_cost or 0.0)

        if direct_recipe_cost is not None and direct_recipe_cost > 0:
            total_unit_cost = round(float(direct_recipe_cost), 2)
            cost_per_unit_raw = round(max(0.0, total_unit_cost - packaging_cost), 2)
        elif direct_ingredient_cost is not None and direct_ingredient_cost >= 0:
            cost_per_unit_raw = round(float(direct_ingredient_cost), 2)
            total_unit_cost = round(cost_per_unit_raw + packaging_cost, 2)
        elif ingredients and len(ingredients) > 0:
            total_ingredients_sum = sum(
                float(item.cost if hasattr(item, "cost") else item.get("cost", 0.0))
                for item in ingredients
            )
            waste_factor = 1.0 + (waste_pct / 100.0) if waste_pct > 0 else 1.0
            if is_unit_recipe:
                cost_per_unit_raw = round(total_ingredients_sum * waste_factor, 2)
            else:
                cost_per_unit_raw = round((total_ingredients_sum * waste_factor) / yield_count, 2)
            total_unit_cost = round(cost_per_unit_raw + packaging_cost, 2)
        else:
            cost_per_unit_raw = 0.0
            total_unit_cost = round(packaging_cost, 2)

        profit_per_unit = round(sale_price - total_unit_cost, 2)
        profit_margin_pct = round((profit_per_unit / sale_price * 100), 2) if sale_price > 0 else 0.0

        return {
            "cost_per_cookie": cost_per_unit_raw,
            "packaging_cost": packaging_cost,
            "recipe_cost": total_unit_cost,
            "profit_per_unit": profit_per_unit,
            "profit_margin_pct": profit_margin_pct
        }

    @staticmethod
    def get_cookies(category: Optional[str] = None) -> List[Dict[str, Any]]:
        db = get_db()
        query: Dict[str, Any] = {"is_active": True}
        if category:
            query["category"] = category
        cookies = list(db.cookie_products.find(query, {"_id": 0}).sort("id", 1))
        for c in cookies:
            if "category" not in c or not c["category"]:
                c["category"] = "Galletas Artesanales"
            if "waste_pct" not in c:
                c["waste_pct"] = 2.0
            if "base_recipe_weight_g" not in c:
                c["base_recipe_weight_g"] = 75.0
            if "packaging_cost" not in c:
                c["packaging_cost"] = 0.0
            if "cost_per_cookie" not in c:
                c["cost_per_cookie"] = round(max(0.0, float(c.get("recipe_cost", 0.0)) - float(c["packaging_cost"])), 2)
        return cookies

    @staticmethod
    def get_cookie_by_id(cookie_id: int) -> Optional[Dict[str, Any]]:
        db = get_db()
        doc = db.cookie_products.find_one({"id": cookie_id}, {"_id": 0})
        if doc:
            if "category" not in doc or not doc["category"]:
                doc["category"] = "Galletas Artesanales"
            if "waste_pct" not in doc:
                doc["waste_pct"] = 2.0
            if "base_recipe_weight_g" not in doc:
                doc["base_recipe_weight_g"] = 75.0
            if "packaging_cost" not in doc:
                doc["packaging_cost"] = 0.0
            if "cost_per_cookie" not in doc:
                doc["cost_per_cookie"] = round(max(0.0, float(doc.get("recipe_cost", 0.0)) - float(doc["packaging_cost"])), 2)
        return doc

    @staticmethod
    def create_cookie(data: CookieProductCreate) -> Dict[str, Any]:
        db = get_db()
        now_str = datetime.utcnow().isoformat()
        waste_pct = float(data.waste_pct if data.waste_pct is not None else 2.0)
        packaging_cost = float(data.packaging_cost or 0.0)

        metrics = CookieService.calculate_recipe_metrics(
            ingredients=data.ingredients,
            sale_price=float(data.sale_price),
            batch_yield=data.batch_yield,
            waste_pct=waste_pct,
            packaging_cost=packaging_cost,
            direct_ingredient_cost=data.cost_per_cookie,
            direct_recipe_cost=data.recipe_cost
        )
        ingredients_dicts = [i.model_dump() if hasattr(i, "model_dump") else dict(i) for i in data.ingredients]

        new_id = get_next_sequence("cookie_products")
        doc = {
            "id": new_id,
            "name": data.name,
            "category": data.category or "Galletas Artesanales",
            "description": data.description or "",
            "sale_price": float(data.sale_price),
            "packaging_cost": metrics["packaging_cost"],
            "cost_per_cookie": metrics["cost_per_cookie"],
            "recipe_cost": metrics["recipe_cost"],
            "profit_per_unit": metrics["profit_per_unit"],
            "profit_margin_pct": metrics["profit_margin_pct"],
            "batch_yield": data.batch_yield,
            "waste_pct": waste_pct,
            "base_recipe_weight_g": float(data.base_recipe_weight_g or 75.0),
            "ingredients": ingredients_dicts,
            "image_url": data.image_url or "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=500&q=80",
            "is_active": True if data.is_active is None or data.is_active else False,
            "is_unit_recipe": True if data.is_unit_recipe is None or data.is_unit_recipe else False,
            "created_at": now_str
        }

        db.cookie_products.insert_one(doc)
        doc.pop("_id", None)
        return doc

    @staticmethod
    def update_cookie(cookie_id: int, data: CookieProductUpdate) -> Optional[Dict[str, Any]]:
        db = get_db()
        current = db.cookie_products.find_one({"id": cookie_id})
        if not current:
            return None

        sale_price = float(data.sale_price) if data.sale_price is not None else float(current["sale_price"])
        batch_yield = data.batch_yield if data.batch_yield is not None else current["batch_yield"]
        waste_pct = float(data.waste_pct if data.waste_pct is not None else current.get("waste_pct", 2.0))
        packaging_cost = float(data.packaging_cost) if data.packaging_cost is not None else float(current.get("packaging_cost", 0.0))
        raw_ingredients = data.ingredients if data.ingredients is not None else current.get("ingredients", [])

        direct_ing_cost = data.cost_per_cookie
        direct_recipe_cost = data.recipe_cost

        metrics = CookieService.calculate_recipe_metrics(
            ingredients=raw_ingredients,
            sale_price=sale_price,
            batch_yield=batch_yield,
            waste_pct=waste_pct,
            packaging_cost=packaging_cost,
            direct_ingredient_cost=direct_ing_cost,
            direct_recipe_cost=direct_recipe_cost
        )
        ingredients_dicts = [i.model_dump() if hasattr(i, "model_dump") else dict(i) for i in raw_ingredients]

        update_fields: Dict[str, Any] = {
            "packaging_cost": metrics["packaging_cost"],
            "cost_per_cookie": metrics["cost_per_cookie"],
            "recipe_cost": metrics["recipe_cost"],
            "profit_per_unit": metrics["profit_per_unit"],
            "profit_margin_pct": metrics["profit_margin_pct"]
        }

        if data.name is not None:
            update_fields["name"] = data.name
        if data.category is not None:
            update_fields["category"] = data.category
        if data.description is not None:
            update_fields["description"] = data.description
        if data.sale_price is not None:
            update_fields["sale_price"] = sale_price
        if data.batch_yield is not None:
            update_fields["batch_yield"] = batch_yield
        if data.waste_pct is not None:
            update_fields["waste_pct"] = waste_pct
        if data.base_recipe_weight_g is not None:
            update_fields["base_recipe_weight_g"] = float(data.base_recipe_weight_g)
        if data.ingredients is not None:
            update_fields["ingredients"] = ingredients_dicts
        if data.image_url is not None:
            update_fields["image_url"] = data.image_url
        if data.is_active is not None:
            update_fields["is_active"] = bool(data.is_active)
        if data.is_unit_recipe is not None:
            update_fields["is_unit_recipe"] = bool(data.is_unit_recipe)

        db.cookie_products.update_one({"id": cookie_id}, {"$set": update_fields})
        return CookieService.get_cookie_by_id(cookie_id)

    @staticmethod
    def delete_cookie(cookie_id: int) -> bool:
        db = get_db()
        res = db.cookie_products.update_one({"id": cookie_id}, {"$set": {"is_active": False}})
        return res.matched_count > 0

    # ------------------ CONTROL DE HORNEADO & STOCK DE VITRINA ------------------ #
    @staticmethod
    def bake_batch(cookie_id: int, batches: int = 1) -> Dict[str, Any]:
        """
        Hornea N tandas de una galleta:
        - Suma N * batch_yield piezas al inventario vivo de vitrina.
        - Descuenta de forma automática los insumos crudos del inventario del almacén.
        - Preserva la fórmula fija de la receta sin alteraciones.
        """
        db = get_db()
        cookie = db.cookie_products.find_one({"id": cookie_id})
        if not cookie:
            raise ValueError("Galleta no encontrada")

        yield_count = int(cookie.get("batch_yield") or 10)
        units_added = batches * yield_count
        deducted_ingredients = []

        is_unit_recipe = cookie.get("is_unit_recipe", True)
        for ing in cookie.get("ingredients", []):
            ing_name = ing.get("name", "")
            unit_in_recipe = ing.get("unit", "g")
            raw_qty = float(ing.get("quantity", 0.0))
            ing_id = ing.get("ingredient_id")

            if is_unit_recipe:
                qty_to_deduct = round(raw_qty * units_added, 2)
            else:
                qty_to_deduct = round(raw_qty * batches, 2)

            if ing_id:
                db.cookie_ingredients.update_one(
                    {"id": ing_id},
                    {"$inc": {"stock_quantity": -qty_to_deduct}}
                )
            else:
                db.cookie_ingredients.update_one(
                    {"name": {"$regex": f"^{ing_name}$", "$options": "i"}},
                    {"$inc": {"stock_quantity": -qty_to_deduct}}
                )

            deducted_ingredients.append({
                "name": ing_name,
                "amount_deducted": qty_to_deduct,
                "unit": unit_in_recipe
            })

        db.cookie_products.update_one(
            {"id": cookie_id},
            {"$inc": {"stock_vitrina": units_added}}
        )

        updated_cookie = db.cookie_products.find_one({"id": cookie_id}, {"_id": 0})
        new_stock = float(updated_cookie.get("stock_vitrina", units_added))

        return {
            "cookie_id": cookie_id,
            "cookie_name": cookie.get("name", "Galleta"),
            "batches_baked": batches,
            "units_added": units_added,
            "new_stock_vitrina": new_stock,
            "deducted_ingredients": deducted_ingredients,
            "message": f"Se hornearon {batches} tanda(s) (+{units_added} pzas). Stock actual en vitrina: {new_stock} piezas."
        }

    @staticmethod
    def adjust_stock(cookie_id: int, new_stock: float) -> Optional[Dict[str, Any]]:
        db = get_db()
        db.cookie_products.update_one(
            {"id": cookie_id},
            {"$set": {"stock_vitrina": float(new_stock)}}
        )
        return CookieService.get_cookie_by_id(cookie_id)

    @staticmethod
    def ensure_oreo_master_recipe():
        """
        Garantiza que exista en la base de datos la receta oficial calibrada del PDF:
        - Galleta de Oreo y Chispas
        - Costo unitario real: $9.67 MXN ($6.77 masa cruda + $2.90 empaque)
        - Tanda de 10 piezas: $108.38 MXN
        - Precio de venta recomendado: $30.00 MXN (Margen: 67.8%)
        """
        db = get_db()
        existing = db.cookie_products.find_one({"name": {"$regex": "oreo", "$options": "i"}})
        
        oreo_ingredients = [
            {"name": "Mantequilla de primera", "quantity": 15.0, "unit": "g", "cost": 2.63},
            {"name": "Azúcar mascabado", "quantity": 10.0, "unit": "g", "cost": 0.38},
            {"name": "Azúcar estándar", "quantity": 7.0, "unit": "g", "cost": 0.13},
            {"name": "Huevo fresco", "quantity": 0.1, "unit": "pza", "cost": 0.15},
            {"name": "Extracto de Vainilla", "quantity": 1.0, "unit": "ml", "cost": 0.31},
            {"name": "Harina de trigo premium", "quantity": 30.0, "unit": "g", "cost": 0.47},
            {"name": "Polvo para hornear", "quantity": 1.0, "unit": "g", "cost": 0.09},
            {"name": "Bicarbonato de sodio", "quantity": 1.0, "unit": "g", "cost": 0.05},
            {"name": "Maizena (almidón)", "quantity": 2.0, "unit": "g", "cost": 0.38},
            {"name": "Sal refinada", "quantity": 1.0, "unit": "g", "cost": 0.01},
            {"name": "Galletas Oreo auténticas", "quantity": 1.0, "unit": "pza", "cost": 1.25},
            {"name": "Chispas de chocolate", "quantity": 10.0, "unit": "g", "cost": 0.93},
        ]

        doc = {
            "name": "Galleta de Oreo y Chispas",
            "category": "Galletas Artesanales",
            "description": "Exquisita masa suave con mantequilla premium, vainilla pura, trozos generosos de galleta Oreo y chispas de chocolate.",
            "sale_price": 30.0,
            "cost_per_cookie": 6.77,
            "packaging_cost": 2.90,
            "recipe_cost": 9.67,
            "profit_per_unit": 20.33,
            "profit_margin_pct": 67.8,
            "batch_yield": 10,
            "waste_pct": 0.0,
            "base_recipe_weight_g": 75.0,
            "stock_vitrina": 12.0,
            "ingredients": oreo_ingredients,
            "image_url": "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80",
            "is_active": True,
            "is_unit_recipe": True,
            "created_at": datetime.utcnow().isoformat()
        }

        if existing:
            db.cookie_products.update_one({"id": existing["id"]}, {"$set": doc})
            doc["id"] = existing["id"]
        else:
            doc["id"] = get_next_sequence("cookie_products")
            db.cookie_products.insert_one(doc)

        return doc

    # ------------------ ESCALADOR DE LOTES (BATCH SCALER) ------------------ #
    @staticmethod
    def scale_batch(cookie_id: int, target_units: int, custom_waste_pct: Optional[float] = None) -> Optional[Dict[str, Any]]:
        """
        Calculador de Lotes / Rendimiento (Batch Scaler):
        Al ingresar una meta de producción (ej. 50 galletas), proyecta la lista exacta de insumos
        en kilogramos/gramos a medir en báscula, ajustando por porcentaje de merma técnica.
        """
        cookie = CookieService.get_cookie_by_id(cookie_id)
        if not cookie:
            return None

        batch_yield = max(cookie.get("batch_yield", 16), 1)
        waste_pct = custom_waste_pct if custom_waste_pct is not None else float(cookie.get("waste_pct", 2.0))
        waste_multiplier = 1.0 + (waste_pct / 100.0)

        all_ingredients = CookieService.get_ingredients()
        items = []
        total_projected_cost = 0.0
        can_fulfill_all = True
        total_raw_weight = target_units * float(cookie.get("base_recipe_weight_g", 75.0)) * waste_multiplier

        is_unit_recipe = cookie.get("is_unit_recipe", True)
        for ing in cookie.get("ingredients", []):
            ing_name = ing.get("name")
            unit_in_recipe = ing.get("unit", "g")
            cost_per_item = float(ing.get("cost", 0.0))
            raw_qty = float(ing.get("quantity", 0.0))

            # Cantidad escalada requerida para target_units con factor de merma
            if is_unit_recipe:
                scaled_qty = round((raw_qty * target_units) * waste_multiplier, 2)
                scaled_cost = round((cost_per_item * target_units) * waste_multiplier, 2)
            else:
                scaled_qty = round(((raw_qty / batch_yield) * target_units) * waste_multiplier, 2)
                scaled_cost = round(((cost_per_item / batch_yield) * target_units) * waste_multiplier, 2)
            total_projected_cost += scaled_cost

            # Buscar stock actual
            stock_doc = next(
                (i for i in all_ingredients if i["name"].lower() in ing_name.lower() or ing_name.lower() in i["name"].lower()),
                None
            )
            avail_stock = float(stock_doc.get("stock_quantity", 0.0)) if stock_doc else 0.0
            is_suff = avail_stock >= scaled_qty
            if not is_suff:
                can_fulfill_all = False

            missing = max(0.0, round(scaled_qty - avail_stock, 2))

            items.append({
                "name": ing_name,
                "required_quantity": scaled_qty,
                "unit": unit_in_recipe,
                "unit_cost": float(stock_doc.get("cost_per_unit", 0.0)) if stock_doc else 0.0,
                "total_cost": scaled_cost,
                "stock_available": avail_stock,
                "is_sufficient": is_suff,
                "missing_quantity": missing
            })

        projected_rev = round(float(cookie.get("sale_price", 35.0)) * target_units, 2)
        projected_prof = round(projected_rev - total_projected_cost, 2)

        return {
            "cookie_id": cookie_id,
            "cookie_name": cookie["name"],
            "target_units": target_units,
            "waste_pct": waste_pct,
            "total_raw_weight_g": round(total_raw_weight, 2),
            "items": items,
            "estimated_total_cost": round(total_projected_cost, 2),
            "estimated_unit_cost": round(total_projected_cost / max(target_units, 1), 2),
            "projected_revenue": projected_rev,
            "projected_profit": projected_prof,
            "can_fulfill_from_stock": can_fulfill_all
        }

    # ------------------ CAPACIDAD DE PRODUCCIÓN SIMULADA (CUELLO DE BOTELLA) ------------------ #
    @staticmethod
    def calculate_production_capacity() -> Dict[str, Any]:
        """
        Capacidad de Producción Simulada:
        Identificación automática del ingrediente "cuello de botella" para
        calcular el límite teórico de producción actual según stock.
        """
        cookies = CookieService.get_cookies()
        all_ingredients = CookieService.get_ingredients()
        product_capacities = []
        critical_alerts = []

        for c in cookies:
            batch_yield = max(c.get("batch_yield", 16), 1)
            ingredients = c.get("ingredients", [])

            min_units_limit = 999999
            bottleneck_info = None

            for ing in ingredients:
                ing_name = ing.get("name")
                qty_per_unit = float(ing.get("quantity", 0.0)) / batch_yield
                if qty_per_unit <= 0:
                    continue

                stock_doc = next(
                    (i for i in all_ingredients if i["name"].lower() in ing_name.lower() or ing_name.lower() in i["name"].lower()),
                    None
                )
                avail_stock = float(stock_doc.get("stock_quantity", 0.0)) if stock_doc else 0.0
                possible_units = int(avail_stock // qty_per_unit)

                if possible_units < min_units_limit:
                    min_units_limit = possible_units
                    bottleneck_info = {
                        "ingredient_name": ing_name,
                        "unit": ing.get("unit", "g"),
                        "available_stock": avail_stock,
                        "required_per_unit": round(qty_per_unit, 2),
                        "max_units_possible": possible_units
                    }

            if min_units_limit == 999999:
                min_units_limit = 0

            if min_units_limit <= 10 and bottleneck_info:
                critical_alerts.append(
                    f"⚠️ {c['name']} limitada a {min_units_limit} piezas por falta de {bottleneck_info['ingredient_name']} (Stock: {bottleneck_info['available_stock']} {bottleneck_info['unit']})"
                )

            product_capacities.append({
                "product_id": c["id"],
                "product_name": c["name"],
                "max_producible_units": min_units_limit,
                "limiting_ingredient": bottleneck_info,
                "all_ingredients_healthy": min_units_limit >= 30
            })

        # Capacidad de empaque (Packaging)
        packaging_items = [i for i in all_ingredients if i.get("type") == "packaging"]
        packaging_capacities = [
            {
                "name": p["name"],
                "stock_quantity": p.get("stock_quantity", 0),
                "unit": p.get("unit", "pza"),
                "status": p.get("stock_status", "ok")
            }
            for p in packaging_items
        ]

        return {
            "capacities": product_capacities,
            "critical_alerts": critical_alerts,
            "packaging_capacities": packaging_capacities
        }

    # ------------------ VENTAS DE GALLETAS DIRECTAS ------------------ #
    @staticmethod
    def get_sales(limit: int = 50) -> List[Dict[str, Any]]:
        db = get_db()
        sales = list(db.cookie_sales.find({}, {"_id": 0}).sort([("sale_date", -1), ("id", -1)]).limit(limit))
        for s in sales:
            ensure_ticket_token(s, "cookie_sales")
        return sales

    @staticmethod
    def register_sale(data: CookieSaleCreate) -> Dict[str, Any]:
        db = get_db()
        cookie = db.cookie_products.find_one({"id": data.cookie_id})
        if not cookie:
            raise ValueError(f"Cookie with ID {data.cookie_id} not found")

        unit_price = float(data.unit_price) if (data.unit_price is not None and data.unit_price > 0) else float(cookie["sale_price"])
        unit_cost = float(cookie["recipe_cost"])
        total_revenue = round(unit_price * data.quantity, 2)
        total_cost = round(unit_cost * data.quantity, 2)
        net_profit = round(total_revenue - total_cost, 2)
        sale_date = data.sale_date or date.today().isoformat()
        now_str = datetime.utcnow().isoformat()
        ticket_token = generate_ticket_token()

        new_id = get_next_sequence("cookie_sales")
        doc = {
            "id": new_id,
            "cookie_id": data.cookie_id,
            "cookie_name": cookie["name"],
            "quantity": data.quantity,
            "unit_price": unit_price,
            "unit_cost": unit_cost,
            "total_revenue": total_revenue,
            "total_cost": total_cost,
            "net_profit": net_profit,
            "sale_date": sale_date,
            "customer_name": data.customer_name or "Cliente Mostrador",
            "payment_method": data.payment_method or "Efectivo",
            "notes": data.notes or "",
            "ticket_token": ticket_token,
            "created_at": now_str
        }

        db.cookie_sales.insert_one(doc)
        doc.pop("_id", None)
        return doc

    @staticmethod
    def delete_sale(sale_id: int) -> bool:
        db = get_db()
        res = db.cookie_sales.delete_one({"id": sale_id})
        return res.deleted_count > 0

    @staticmethod
    def update_sale(sale_id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        db = get_db()
        sale = db.cookie_sales.find_one({"id": sale_id}, {"_id": 0})
        if not sale:
            return None

        update_fields: Dict[str, Any] = {}
        for key in ["customer_name", "payment_method", "notes", "sale_date"]:
            if key in data and data[key] is not None:
                update_fields[key] = data[key]

        if "quantity" in data or "unit_price" in data:
            qty = data.get("quantity", sale["quantity"]) if data.get("quantity") is not None else sale["quantity"]
            unit_price = data.get("unit_price", sale["unit_price"]) if data.get("unit_price") is not None else sale["unit_price"]

            unit_cost = sale.get("unit_cost", 0.0)
            if unit_cost == 0.0 and sale.get("quantity", 0) > 0:
                unit_cost = sale.get("total_cost", 0.0) / sale["quantity"]

            discount = sale.get("discount_amount", 0.0) or 0.0
            total_rev = max(0.0, (qty * unit_price) - discount)
            total_cost = qty * unit_cost
            net_profit = total_rev - total_cost

            update_fields["quantity"] = qty
            update_fields["unit_price"] = unit_price
            update_fields["total_revenue"] = round(total_rev, 2)
            update_fields["total_cost"] = round(total_cost, 2)
            update_fields["net_profit"] = round(net_profit, 2)

        if update_fields:
            db.cookie_sales.update_one({"id": sale_id}, {"$set": update_fields})

        return db.cookie_sales.find_one({"id": sale_id}, {"_id": 0})

    # ------------------ ANALÍTICAS DE GALLETAS ------------------ #
    @staticmethod
    def get_cookie_analytics() -> Dict[str, Any]:
        db = get_db()

        # 1. Totales agregados de ventas reales (Fuente de verdad única: cookie_sales)
        sales_totals = list(db.cookie_sales.aggregate([
            {
                "$group": {
                    "_id": None,
                    "total_units": {"$sum": "$quantity"},
                    "total_revenue": {"$sum": "$total_revenue"},
                    "total_cost": {"$sum": "$total_cost"},
                    "total_profit": {"$sum": "$net_profit"}
                }
            }
        ]))
        sales_t = sales_totals[0] if sales_totals else {}

        total_units = int(sales_t.get("total_units", 0))
        rev = float(sales_t.get("total_revenue", 0.0))
        cost = float(sales_t.get("total_cost", 0.0))
        prof = float(sales_t.get("total_profit", 0.0))
        margin_pct = round((prof / rev * 100), 2) if rev > 0 else 0.0

        # Desglose por galleta
        by_cookie_pipe = [
            {
                "$group": {
                    "_id": {
                        "cookie_id": "$cookie_id",
                        "cookie_name": "$cookie_name"
                    },
                    "units_sold": {"$sum": "$quantity"},
                    "revenue": {"$sum": "$total_revenue"},
                    "profit": {"$sum": "$net_profit"},
                    "avg_price": {"$avg": "$unit_price"},
                    "avg_cost": {"$avg": "$unit_cost"}
                }
            },
            {"$sort": {"units_sold": -1}},
            {
                "$project": {
                    "_id": 0,
                    "cookie_id": "$_id.cookie_id",
                    "cookie_name": "$_id.cookie_name",
                    "units_sold": "$units_sold",
                    "revenue": {"$round": ["$revenue", 2]},
                    "profit": {"$round": ["$profit", 2]},
                    "avg_price": {"$round": ["$avg_price", 2]},
                    "avg_cost": {"$round": ["$avg_cost", 2]},
                    "margin_pct": {
                        "$cond": [
                            {"$gt": ["$revenue", 0]},
                            {"$round": [{"$multiply": [{"$divide": ["$profit", "$revenue"]}, 100]}, 2]},
                            0.0
                        ]
                    }
                }
            }
        ]
        by_cookie = list(db.cookie_sales.aggregate(by_cookie_pipe))

        # Tendencia diaria
        daily_pipe = [
            {
                "$group": {
                    "_id": "$sale_date",
                    "units": {"$sum": "$quantity"},
                    "revenue": {"$sum": "$total_revenue"},
                    "profit": {"$sum": "$net_profit"}
                }
            },
            {"$sort": {"_id": 1}},
            {"$limit": 30},
            {
                "$project": {
                    "_id": 0,
                    "sale_date": "$_id",
                    "units": "$units",
                    "revenue": {"$round": ["$revenue", 2]},
                    "profit": {"$round": ["$profit", 2]}
                }
            }
        ]
        daily_trend = list(db.cookie_sales.aggregate(daily_pipe))

        return {
            "total_units_sold": total_units,
            "total_revenue": round(rev, 2),
            "total_cost": round(cost, 2),
            "total_profit": round(prof, 2),
            "profit_margin_pct": margin_pct,
            "performance_by_cookie": by_cookie,
            "daily_sales_trend": daily_trend
        }
