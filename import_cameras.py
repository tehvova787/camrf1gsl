import json
import os
from app import app, db, Camera

def import_cameras_from_json():
    """Import camera data from JSON file to database"""
    # Create tables if they don't exist
    with app.app_context():
        db.create_all()
        
        # Check if we already have cameras in the DB
        if Camera.query.count() > 0:
            print("Database already contains cameras. Import will be skipped.")
            return
        
        # Load camera data from JSON file
        with open('cameras.json', 'r', encoding='utf-8') as file:
            cameras_data = json.load(file)
        
        # Add cameras to database
        for camera_data in cameras_data:
            camera = Camera(
                name=camera_data['name'],
                url=camera_data['url'],
                is_video=camera_data['is_video'],
                district=camera_data['district']
            )
            db.session.add(camera)
        
        # Commit changes
        db.session.commit()
        print(f"Successfully imported {len(cameras_data)} cameras to the database.")

if __name__ == "__main__":
    import_cameras_from_json() 