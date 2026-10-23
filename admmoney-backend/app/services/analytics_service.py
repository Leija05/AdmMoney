from typing import Dict, Any, List
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
            "stock_alerts_count": stock_alerts_count,
            "top_selling_cookie": top_selling,
            "category_breakdown": category_breakdown,
            "daily_trend": trend,
            "cookie_performance": cookie_analytics.get("performance_by_cookie", [])
        }
