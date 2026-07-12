import datetime
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
import jwt
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User, Note

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///auth_system.db'
app.config['SECRET_KEY'] = 'your-super-secret-key-change-this-in-production'

# Enable CORS so our React frontend can safely talk to the API
CORS(app)
db.init_app(app)

# Custom decorator to protect endpoints
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Access denied. Token is missing!'}), 401
        try:
            # Expecting header format: "Bearer <token>"
            token = token.split(" ")[1] 
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = db.session.get(User, data['user_id'])
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
        except Exception:
            return jsonify({'message': 'Invalid or expired token!'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

# --- AUTHENTICATION ROUTES ---

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    if not data or not data.get('email') or not data.get('password') or not data.get('username'):
        return jsonify({'message': 'Missing required fields'}), 400
        
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'User with this email already exists'}), 400
    
    # scrypt is default and secure in modern Werkzeug versions
    hashed_pw = generate_password_hash(data['password'])
    new_user = User(username=data['username'], email=data['email'], password_hash=hashed_pw)
    db.session.add(new_user)
    db.session.commit()
    return jsonify({'message': 'User registered successfully!'}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'message': 'Missing email or password'}), 400

    user = User.query.filter_by(email=data['email']).first()
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'message': 'Invalid credentials!'}), 401
    
    # Generate a JWT valid for 24 hours
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    return jsonify({'token': token, 'username': user.username})

# --- EXPOSED RESTFUL API ENDPOINTS ---

# Route 1 (PUBLIC): Fetch a list of sample / public data
@app.route('/api/notes/public', methods=['GET'])
def get_public_notes():
    public_notes = Note.query.limit(3).all()
    return jsonify([note.to_dict() for note in public_notes]), 200

# Route 2 (PROTECTED): Create a user-specific record (POST)
@app.route('/api/notes', methods=['POST'])
@token_required
def create_note(current_user):
    data = request.json
    if not data or not data.get('title') or not data.get('content'):
        return jsonify({'message': 'Title and content required'}), 400
        
    new_note = Note(title=data['title'], content=data['content'], user_id=current_user.id)
    db.session.add(new_note)
    db.session.commit()
    return jsonify(new_note.to_dict()), 201

# Route 3 (PROTECTED): Retrieve user-specific records (GET)
@app.route('/api/notes', methods=['GET'])
@token_required
def get_user_notes(current_user):
    notes = Note.query.filter_by(user_id=current_user.id).all()
    return jsonify([note.to_dict() for note in notes]), 200

if __name__ == '__main__':
    with app.app_context():
        db.create_all()  # Generates sqlite database file automatically
    app.run(debug=True, port=5000)