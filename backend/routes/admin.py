"""Admin-only analytics (Mongo aggregates over users + scan collections)."""
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request

from auth.decorators import admin_required, token_required

admin_bp = Blueprint("admin", __name__, url_prefix="/admin")


def _counts_by_day(collection, days=14):
    cutoff = datetime.utcnow() - timedelta(days=days)
    pipeline = [
        {"$match": {"created_at": {"$gte": cutoff}}},
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$created_at",
                        "timezone": "UTC",
                    }
                },
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]
    out = {}
    for row in collection.aggregate(pipeline):
        out[row["_id"]] = row["count"]
    return out


def _merge_day_series(leaf_map, insect_map, days=14):
    start = datetime.utcnow().date() - timedelta(days=days - 1)
    series = []
    for i in range(days):
        d = (start + timedelta(days=i)).isoformat()
        series.append(
            {
                "date": d,
                "leaf": int(leaf_map.get(d, 0)),
                "insect": int(insect_map.get(d, 0)),
                "total": int(leaf_map.get(d, 0)) + int(insect_map.get(d, 0)),
            }
        )
    return series


def _class_distribution(collection, limit=12):
    pipeline = [
        {"$match": {"predicted_class": {"$nin": [None, ""]}}},
        {"$group": {"_id": "$predicted_class", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": limit},
    ]
    return [{"class": row["_id"], "count": row["count"]} for row in collection.aggregate(pipeline)]


def setup_admin_routes(app, users_col, leafscan_col, insectscan_col, token_required_decorator):
    @admin_bp.route("/analytics", methods=["GET"])
    @token_required_decorator(users_col, app)
    @admin_required
    def analytics():
        try:
            days = request.args.get("days", default=14, type=int)
            days = max(7, min(days, 90))

            total_users = users_col.count_documents({})
            admin_users = users_col.count_documents({"role": "admin"})
            total_leaf = leafscan_col.count_documents({})
            total_insect = insectscan_col.count_documents({})

            leaf_users = len(leafscan_col.distinct("user_id"))
            insect_users = len(insectscan_col.distinct("user_id"))

            leaf_by_day = _counts_by_day(leafscan_col, days)
            insect_by_day = _counts_by_day(insectscan_col, days)
            scans_by_day = _merge_day_series(leaf_by_day, insect_by_day, days)

            cutoff = datetime.utcnow() - timedelta(days=days)
            signup_pipeline = [
                {"$match": {"created_at": {"$gte": cutoff}}},
                {
                    "$group": {
                        "_id": {
                            "$dateToString": {
                                "format": "%Y-%m-%d",
                                "date": "$created_at",
                                "timezone": "UTC",
                            }
                        },
                        "count": {"$sum": 1},
                    }
                },
                {"$sort": {"_id": 1}},
            ]
            signups_by_day = [
                {"date": row["_id"], "count": row["count"]}
                for row in users_col.aggregate(signup_pipeline)
            ]

            leaf_class_distribution = _class_distribution(leafscan_col)
            insect_class_distribution = _class_distribution(insectscan_col)

            recent_users = list(
                users_col.find(
                    {},
                    {"password": 0},
                )
                .sort("created_at", -1)
                .limit(8)
            )
            for u in recent_users:
                uid = u.pop("_id", None)
                u["user_id"] = str(uid) if uid else None
                if "created_at" in u and hasattr(u["created_at"], "isoformat"):
                    u["created_at"] = u["created_at"].isoformat()

            return (
                jsonify(
                    {
                        "summary": {
                            "total_users": total_users,
                            "admin_users": admin_users,
                            "non_admin_users": max(0, total_users - admin_users),
                            "total_leaf_scans": total_leaf,
                            "total_insect_scans": total_insect,
                            "total_scans": total_leaf + total_insect,
                            "distinct_users_leaf_scans": leaf_users,
                            "distinct_users_insect_scans": insect_users,
                        },
                        "scans_by_day": scans_by_day,
                        "signups_by_day": signups_by_day,
                        "leaf_class_distribution": leaf_class_distribution,
                        "insect_class_distribution": insect_class_distribution,
                        "recent_users": recent_users,
                        "range_days": days,
                    }
                ),
                200,
            )
        except Exception as e:
            return jsonify({"error": "Failed to build analytics", "details": str(e)}), 500

    app.register_blueprint(admin_bp)
