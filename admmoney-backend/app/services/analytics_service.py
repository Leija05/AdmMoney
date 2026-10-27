from typing import Dict, Any, List, Optional
from datetime import date
from ..core.database import get_db
from .cookie_service import CookieService

class AnalyticsService:
    @staticmethod
    def get_overall_summary() -> Dict[str, Any]:
        db = get_db()

        # 1. Total de gastos clasificados por directos vs operativos/indirectos
        tot_res = list(db.expenses.aggregate([
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]))
        total_all_expenses = float(tot_res[0]["total"]) if tot_res else 0.0

        direct_res = list(db.expenses.aggregate([
            {
                "$match": {
                    "$or": [
                        {"expense_type": "direct"},
                        {"category": {"$in": ["Insumos Galletas", "Empaques y Envíos"]}}
                    ]
                }
            },
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
        ]))
        total_direct_expenses = float(direct_res[0]["total"]) if direct_res else 0.0
        total_operational_expenses = round(total_all_expenses - total_direct_expenses, 2)

        # 2. Métricas del negocio de galletas (Ventas directas + Pedidos completados)
        cookie_analytics = CookieService.get_cookie_analytics()
        total_cookie_revenue = cookie_analytics["total_revenue"]
        reinvestment_fund = cookie_analytics["total_cost"]  # Capital reservado para reponer insumos
        gross_cookie_profit = round(total_cookie_revenue - reinvestment_fund, 2)
        margin_pct = cookie_analytics["profit_margin_pct"]
        total_cookies_sold = cookie_analytics["total_units_sold"]

        # Pedidos completados vs pendientes
        completed_orders_cnt = db.orders.count_documents({"status": "Completado"})
        pending_orders = list(db.orders.find({"status": {"$in": ["Pendiente", "En Preparación", "Listo"]}}))
        pending_orders_cnt = len(pending_orders)
        pending_orders_amount = round(sum(float(o.get("total_amount", 0.0)) for o in pending_orders), 2)

        # Dinero y pagos pendientes de cobro (pedidos no cancelados con saldo por liquidar)
        pending_payment_orders = list(db.orders.find({
            "status": {"$ne": "Cancelado"},
            "payment_status": {"$in": ["Pendiente", "Anticipo"]}
        }))
        pending_payment_amount = round(sum(
            float(o.get("total_amount", 0.0)) - (float(o.get("deposit_amount", 0.0)) if o.get("payment_status") == "Anticipo" else 0.0)
            for o in pending_payment_orders
        ), 2)
        pending_payment_count = len(pending_payment_orders)

        # Alertas de stock
        stock_alerts_count = len(CookieService.get_stock_alerts())

        # 3. Ganancia Neta Limpia: Ventas Totales - (Costos Directos + Gastos Fijos/Operativos)
        clean_net_profit = round(total_cookie_revenue - (reinvestment_fund + total_operational_expenses), 2)
        overall_net_balance = round(total_cookie_revenue - total_all_expenses, 2)

        top_selling = None
        if cookie_analytics.get("performance_by_cookie"):
            top_selling = cookie_analytics["performance_by_cookie"][0]["cookie_name"]

        # 4. Distribución de gastos por categoría
        category_pipe = [
            {
                "$group": {
                    "_id": "$category",
                    "amount": {"$sum": "$amount"},
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"amount": -1}},
            {
                "$project": {
                    "_id": 0,
                    "category": "$_id",
                    "amount": {"$round": ["$amount", 2]},
                    "count": "$count"
                }
            }
        ]
        category_breakdown = list(db.expenses.aggregate(category_pipe))

        # 5. Tendencia diaria (últimos 14 días con actividad de gastos o ventas)
        exp_days_pipe = [
            {
                "$group": {
                    "_id": "$date",
                    "expense_amount": {"$sum": "$amount"}
                }
            },
            {"$sort": {"_id": -1}},
            {"$limit": 14},
            {
                "$project": {
                    "_id": 0,
                    "day": "$_id",
                    "expense_amount": {"$round": ["$expense_amount", 2]}
                }
            }
        ]
        expense_days = {r["day"]: r["expense_amount"] for r in db.expenses.aggregate(exp_days_pipe)}

        sale_days_pipe = [
            {
                "$group": {
                    "_id": "$sale_date",
                    "revenue_amount": {"$sum": "$total_revenue"},
                    "profit_amount": {"$sum": "$net_profit"}
                }
            },
            {"$sort": {"_id": -1}},
            {"$limit": 14},
            {
                "$project": {
                    "_id": 0,
                    "day": "$_id",
                    "revenue": {"$round": ["$revenue_amount", 2]},
                    "profit": {"$round": ["$profit_amount", 2]}
                }
            }
        ]
        sales_days = {r["day"]: {"revenue": r["revenue"], "profit": r["profit"]} for r in db.cookie_sales.aggregate(sale_days_pipe)}

        all_days = sorted(list(set(list(expense_days.keys()) + list(sales_days.keys()))))[-14:]
        trend = []
        for d in all_days:
            trend.append({
                "date": d,
                "expenses": expense_days.get(d, 0.0),
                "cookie_revenue": sales_days.get(d, {}).get("revenue", 0.0),
                "cookie_profit": sales_days.get(d, {}).get("profit", 0.0),
            })

        return {
            "total_cookie_revenue": round(total_cookie_revenue, 2),
            "total_orders_completed": completed_orders_cnt,
            "total_cookies_sold": total_cookies_sold,
            "total_cookie_cost": round(reinvestment_fund, 2),
            "reinvestment_fund": round(reinvestment_fund, 2),
            "gross_cookie_profit": gross_cookie_profit,
            "cookie_profit_margin_pct": margin_pct,
            "total_operational_expenses": total_operational_expenses,
            "total_direct_expenses": round(total_direct_expenses, 2),
            "total_all_expenses": round(total_all_expenses, 2),
            "clean_net_profit": clean_net_profit,
            "overall_net_balance": overall_net_balance,
            "pending_orders_count": pending_orders_cnt,
            "pending_orders_amount": pending_orders_amount,
            "pending_payment_amount": pending_payment_amount,
            "pending_payment_count": pending_payment_count,
            "stock_alerts_count": stock_alerts_count,
            "top_selling_cookie": top_selling,
            "category_breakdown": category_breakdown,
            "daily_trend": trend,
            "cookie_performance": cookie_analytics.get("performance_by_cookie", [])
        }

    @staticmethod
    def get_daily_summary(date_str: Optional[str] = None) -> Dict[str, Any]:
        db = get_db()
        if not date_str:
            date_str = date.today().isoformat()

        sales = list(db.cookie_sales.find({"sale_date": date_str}, {"_id": 0}).sort("id", -1))
        expenses = list(db.expenses.find({"date": date_str}, {"_id": 0}))

        if not sales:
            return {
                "has_sales": False,
                "date": date_str,
                "sales_count": 0,
                "total_units_sold": 0,
                "total_revenue": 0.0,
                "total_cost": 0.0,
                "net_profit": 0.0,
                "profit_margin_pct": 0.0,
                "average_ticket": 0.0,
                "cash_total": 0.0,
                "transfer_total": 0.0,
                "expenses_total": round(sum(float(e.get("amount", 0.0)) for e in expenses), 2),
                "expenses_cash": round(sum(float(e.get("amount", 0.0)) for e in expenses if "efectivo" in str(e.get("payment_method", "")).lower()), 2),
                "cash_balance": 0.0,
                "net_balance_day": 0.0,
                "products": [],
                "sales": []
            }

        total_units = sum(int(s.get("quantity", 0)) for s in sales)
        total_rev = round(sum(float(s.get("total_revenue", 0.0)) for s in sales), 2)
        total_cost = round(sum(float(s.get("total_cost", 0.0)) for s in sales), 2)
        net_prof = round(sum(float(s.get("net_profit", 0.0)) for s in sales), 2)
        margin_pct = round((net_prof / total_rev * 100), 2) if total_rev > 0 else 0.0
        sales_cnt = len(sales)
        avg_ticket = round(total_rev / sales_cnt, 2) if sales_cnt > 0 else 0.0

        cash_total = round(sum(
            float(s.get("total_revenue", 0.0))
            for s in sales
            if "efectivo" in str(s.get("payment_method", "")).lower()
        ), 2)

        transfer_total = round(sum(
            float(s.get("total_revenue", 0.0))
            for s in sales
            if "efectivo" not in str(s.get("payment_method", "")).lower()
        ), 2)

        expenses_total = round(sum(float(e.get("amount", 0.0)) for e in expenses), 2)
        expenses_cash = round(sum(
            float(e.get("amount", 0.0))
            for e in expenses
            if "efectivo" in str(e.get("payment_method", "")).lower()
        ), 2)

        cash_balance = round(cash_total - expenses_cash, 2)
        net_balance_day = round(total_rev - expenses_total, 2)

        prod_map: Dict[str, Dict[str, Any]] = {}
        for s in sales:
            cname = s.get("cookie_name", "Galleta")
            if cname not in prod_map:
                prod_map[cname] = {
                    "name": cname,
                    "quantity": 0,
                    "revenue": 0.0,
                    "profit": 0.0
                }
            prod_map[cname]["quantity"] += int(s.get("quantity", 0))
            prod_map[cname]["revenue"] = round(prod_map[cname]["revenue"] + float(s.get("total_revenue", 0.0)), 2)
            prod_map[cname]["profit"] = round(prod_map[cname]["profit"] + float(s.get("net_profit", 0.0)), 2)

        products_list = sorted(list(prod_map.values()), key=lambda x: x["quantity"], reverse=True)

        return {
            "has_sales": True,
            "date": date_str,
            "sales_count": sales_cnt,
            "total_units_sold": total_units,
            "total_revenue": total_rev,
            "total_cost": total_cost,
            "net_profit": net_prof,
            "profit_margin_pct": margin_pct,
            "average_ticket": avg_ticket,
            "cash_total": cash_total,
            "transfer_total": transfer_total,
            "expenses_total": expenses_total,
            "expenses_cash": expenses_cash,
            "cash_balance": cash_balance,
            "net_balance_day": net_balance_day,
            "products": products_list,
            "sales": sales
        }
