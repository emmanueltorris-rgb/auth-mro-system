from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class JsonSerializableMixin:
    """Provides automatic JSON serialization for API endpoints."""
    def to_dict(self):
        # Loops through columns dynamically, excluding sensitive password fields
        return {c.name: getattr(self, c.name) for c in self.__table__.columns if c.name != 'password_hash'}

class TimestampMixin:
    """Adds timestamps to track record creation."""
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())

# MRO in action: Python resolves attributes/methods from left to right:
# User -> JsonSerializableMixin -> TimestampMixin -> db.Model
class User(JsonSerializableMixin, TimestampMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

class Note(JsonSerializableMixin, TimestampMixin, db.Model):
    __tablename__ = 'notes'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)