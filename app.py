from flask import Flask, jsonify, request, render_template, send_from_directory, redirect, url_for, session, flash
from flask_sqlalchemy import SQLAlchemy
import os
from dotenv import load_dotenv
import secrets

# Load environment variables
load_dotenv()

app = Flask(__name__, static_folder='.')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///cameras.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.secret_key = secrets.token_hex(16)  # Generate a random secret key
db = SQLAlchemy(app)

# Valid credentials
VALID_USERNAME = "GSL777"
VALID_PASSWORD = "Love_4554"

# Define Camera model
class Camera(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    url = db.Column(db.String(500), nullable=False)
    is_video = db.Column(db.Boolean, default=True)
    district = db.Column(db.String(100))
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'url': self.url,
            'is_video': self.is_video,
            'district': self.district
        }

# Authentication check
def is_authenticated():
    return session.get('authenticated', False)

# Routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        if username == VALID_USERNAME and password == VALID_PASSWORD:
            session['authenticated'] = True
            return redirect(url_for('index'))
        else:
            error = 'Неверный логин или пароль'
    
    return render_template('login.html', error=error)

@app.route('/logout')
def logout():
    session.pop('authenticated', None)
    return redirect(url_for('login'))

@app.route('/')
def index():
    if not is_authenticated():
        return redirect(url_for('login'))
    return send_from_directory('.', 'index.html')

@app.route('/styles.css')
def styles():
    return send_from_directory('.', 'styles.css')

@app.route('/script.js')
def script():
    return send_from_directory('.', 'script.js')

@app.route('/api/cameras', methods=['GET'])
def get_cameras():
    if not is_authenticated():
        return jsonify({"error": "Unauthorized"}), 401
    cameras = Camera.query.all()
    return jsonify([camera.to_dict() for camera in cameras])

@app.route('/api/cameras/<int:camera_id>', methods=['GET'])
def get_camera(camera_id):
    if not is_authenticated():
        return jsonify({"error": "Unauthorized"}), 401
    camera = Camera.query.get(camera_id)
    if camera is None:
        return jsonify({"error": "Camera not found"}), 404
    return jsonify(camera.to_dict())

@app.route('/api/cameras', methods=['POST'])
def add_camera():
    if not is_authenticated():
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    new_camera = Camera(
        name=data['name'],
        url=data['url'],
        is_video=data.get('is_video', True),
        district=data.get('district', '')
    )
    db.session.add(new_camera)
    db.session.commit()
    return jsonify(new_camera.to_dict()), 201

# Initialize the database
def init_db():
    with app.app_context():
        db.create_all()
        
        # Add sample data if database is empty
        if Camera.query.count() == 0:
            sample_cameras = [
                Camera(name="Красная площадь", url="https://media.icnet.ru/cameras/v7nWktzP4M.m3u8", is_video=True, district="Центральный"),
                Camera(name="Тверская улица", url="https://media.icnet.ru/cameras/hdX7vJnPgN.m3u8", is_video=True, district="Центральный"),
                Camera(name="Парк Горького", url="https://media.icnet.ru/cameras/ZeC4jSgf3a.jpg", is_video=False, district="Южный"),
                Camera(name="Воробьевы горы", url="https://media.icnet.ru/cameras/QsRjn87HJk.m3u8", is_video=True, district="Западный")
            ]
            for camera in sample_cameras:
                db.session.add(camera)
            db.session.commit()
            print('Database initialized with sample data!')
        else:
            print('Database already contains data.')

if __name__ == '__main__':
    init_db()
    app.run(debug=True) 