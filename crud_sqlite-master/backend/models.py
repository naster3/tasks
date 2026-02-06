from datetime import datetime

from .extensions import db

MAX_TITLE = 120
MAX_DESC = 500


class Task(db.Model):
    __tablename__ = "tasks"
    __table_args__ = (db.Index("ix_tasks_status_created_at", "status", "created_at"),)

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(MAX_TITLE), nullable=False, index=True)
    description = db.Column(db.String(MAX_DESC), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="en proceso", index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "status": self.status,
            "created_at": self.created_at.isoformat(),
        }
